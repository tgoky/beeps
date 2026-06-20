"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Wallet,
  ArrowDownToLine,
  ArrowUpFromLine,
  Clock,
  CheckCircle2,
  XCircle,
  TrendingUp,
  CreditCard,
  Building2,
  RefreshCw,
  AlertCircle,
  ChevronRight,
  Info,
  BadgeCheck,
} from "lucide-react";
import { useTheme } from "../../providers/ThemeProvider";

interface WalletData {
  availableBalance: number;
  pendingBalance: number;
  totalEarned: number;
  totalWithdrawn: number;
  currency: string;
}

interface WalletSummary {
  pendingWithdrawalAmount: number;
  pendingWithdrawalCount: number;
  last30DaysEarnings: number;
}

interface WalletTransaction {
  id: string;
  type: string;
  amount: number;
  currency: string;
  description: string;
  balanceAfter: number;
  referenceId: string | null;
  referenceType: string | null;
  createdAt: string;
}

interface WithdrawalRecord {
  id: string;
  amount: number;
  currency: string;
  status: "PENDING" | "PROCESSING" | "COMPLETED" | "FAILED" | "CANCELLED";
  bankName: string | null;
  accountNumber: string | null;
  accountName: string | null;
  processedAt: string | null;
  createdAt: string;
  failureReason: string | null;
}

interface BankAccount {
  accountNumber: string | null;
  accountName: string | null;
  bankCode: string | null;
  recipientCode: string | null;
}

const TRANSACTION_TYPE_LABELS: Record<string, { label: string; color: string; sign: "+" | "-" }> = {
  CREDIT:          { label: "Credit",         color: "text-emerald-500", sign: "+" },
  DEBIT:           { label: "Debit",          color: "text-red-500",     sign: "-" },
  HOLD:            { label: "Held (Escrow)",  color: "text-amber-500",   sign: "-" },
  RELEASE:         { label: "Released",       color: "text-emerald-500", sign: "+" },
  REFUND_RECEIVED: { label: "Refund",         color: "text-blue-500",    sign: "+" },
  REFUND_SENT:     { label: "Refund Sent",    color: "text-red-500",     sign: "-" },
  PLATFORM_FEE:    { label: "Platform Fee",   color: "text-zinc-400",    sign: "-" },
  WITHDRAWAL:      { label: "Withdrawal",     color: "text-purple-500",  sign: "-" },
};

const WITHDRAWAL_STATUS_CONFIG = {
  PENDING:    { label: "Pending",    color: "text-amber-500",   bg: "bg-amber-500/10",   icon: Clock },
  PROCESSING: { label: "Processing", color: "text-blue-500",    bg: "bg-blue-500/10",    icon: RefreshCw },
  COMPLETED:  { label: "Completed",  color: "text-emerald-500", bg: "bg-emerald-500/10", icon: CheckCircle2 },
  FAILED:     { label: "Failed",     color: "text-red-500",     bg: "bg-red-500/10",     icon: XCircle },
  CANCELLED:  { label: "Cancelled",  color: "text-zinc-500",    bg: "bg-zinc-500/10",    icon: XCircle },
};

type Tab = "overview" | "transactions" | "withdraw" | "bank";

export default function WalletPage() {
  const { theme } = useTheme();
  const router = useRouter();
  const searchParams = useSearchParams();
  const isDark = theme === "dark";

  const [activeTab, setActiveTab] = useState<Tab>((searchParams.get("tab") as Tab) ?? "overview");
  const [wallet, setWallet] = useState<WalletData | null>(null);
  const [summary, setSummary] = useState<WalletSummary | null>(null);
  const [transactions, setTransactions] = useState<WalletTransaction[]>([]);
  const [withdrawals, setWithdrawals] = useState<WithdrawalRecord[]>([]);
  const [bankAccount, setBankAccount] = useState<{ paystack: BankAccount | null; paymentProvider: string } | null>(null);

  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [withdrawAmount, setWithdrawAmount] = useState("");
  const [isWithdrawing, setIsWithdrawing] = useState(false);
  const [withdrawError, setWithdrawError] = useState("");
  const [withdrawSuccess, setWithdrawSuccess] = useState("");

  // Bank account form
  const [bankForm, setBankForm] = useState({ accountNumber: "", bankCode: "", currency: "NGN" });
  const [banks, setBanks] = useState<{ code: string; name: string }[]>([]);
  const [verifiedAccount, setVerifiedAccount] = useState<{ accountName: string; accountNumber: string } | null>(null);
  const [isSavingBank, setIsSavingBank] = useState(false);
  const [isVerifyingAccount, setIsVerifyingAccount] = useState(false);
  const [bankError, setBankError] = useState("");
  const [bankSuccess, setBankSuccess] = useState("");

  const colors = {
    bg:     isDark ? "#000" : "#FFF",
    card:   isDark ? "#111" : "#F9F9F9",
    border: isDark ? "#222" : "#EBEBEB",
    text:   isDark ? "#FFF" : "#000",
    sub:    isDark ? "#71717A" : "#8E8E93",
    input:  isDark ? "#1A1A1A" : "#F2F2F7",
  };

  const fetchWallet = useCallback(async () => {
    try {
      const res = await fetch("/api/wallet");
      if (!res.ok) throw new Error("Failed to fetch wallet");
      const data = await res.json();
      setWallet(data.data.wallet);
      setSummary(data.data.summary);
    } catch (err) {
      console.error(err);
    }
  }, []);

  const fetchTransactions = useCallback(async () => {
    try {
      const res = await fetch("/api/wallet/transactions?limit=20");
      if (!res.ok) throw new Error();
      const data = await res.json();
      setTransactions(data.data.transactions ?? []);
    } catch {
      setTransactions([]);
    }
  }, []);

  const fetchWithdrawals = useCallback(async () => {
    try {
      const res = await fetch("/api/wallet/withdraw?limit=10");
      if (!res.ok) throw new Error();
      const data = await res.json();
      setWithdrawals(data.data.withdrawals ?? []);
    } catch {
      setWithdrawals([]);
    }
  }, []);

  const fetchBankAccount = useCallback(async () => {
    try {
      const res = await fetch("/api/wallet/bank-account");
      if (!res.ok) throw new Error();
      const data = await res.json();
      setBankAccount(data.data);
    } catch {
      setBankAccount(null);
    }
  }, []);

  const fetchBanks = useCallback(async (country: "nigeria" | "ghana") => {
    try {
      const res = await fetch(`/api/payments/banks?country=${country}`);
      if (!res.ok) throw new Error();
      const data = await res.json();
      setBanks(data.data.banks ?? []);
    } catch {
      setBanks([]);
    }
  }, []);

  useEffect(() => {
    const init = async () => {
      setIsLoading(true);
      await Promise.all([fetchWallet(), fetchTransactions(), fetchWithdrawals(), fetchBankAccount()]);
      setIsLoading(false);
    };
    init();
  }, [fetchWallet, fetchTransactions, fetchWithdrawals, fetchBankAccount]);

  useEffect(() => {
    if (activeTab === "bank" && bankAccount?.paymentProvider === "PAYSTACK") {
      const country = bankForm.currency === "GHS" ? "ghana" : "nigeria";
      fetchBanks(country);
    }
  }, [activeTab, bankForm.currency, bankAccount?.paymentProvider, fetchBanks]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await Promise.all([fetchWallet(), fetchTransactions(), fetchWithdrawals()]);
    setIsRefreshing(false);
  };

  const handleWithdraw = async () => {
    setWithdrawError("");
    setWithdrawSuccess("");
    const amount = parseFloat(withdrawAmount);
    if (!amount || isNaN(amount) || amount <= 0) {
      setWithdrawError("Please enter a valid amount");
      return;
    }
    if (wallet && amount > wallet.availableBalance) {
      setWithdrawError("Amount exceeds available balance");
      return;
    }
    setIsWithdrawing(true);
    try {
      const res = await fetch("/api/wallet/withdraw", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        setWithdrawError(data.error?.message ?? "Withdrawal failed");
      } else {
        setWithdrawSuccess(data.data.withdrawal.message ?? "Withdrawal initiated successfully");
        setWithdrawAmount("");
        await Promise.all([fetchWallet(), fetchWithdrawals()]);
      }
    } catch {
      setWithdrawError("Network error. Please try again.");
    } finally {
      setIsWithdrawing(false);
    }
  };

  const handleVerifyAccount = async () => {
    setBankError("");
    setVerifiedAccount(null);
    if (!bankForm.accountNumber || !bankForm.bankCode) {
      setBankError("Please enter account number and select bank");
      return;
    }
    setIsVerifyingAccount(true);
    try {
      const res = await fetch("/api/payments/banks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ accountNumber: bankForm.accountNumber, bankCode: bankForm.bankCode }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        setBankError(data.error?.message ?? "Account verification failed");
      } else {
        setVerifiedAccount({ accountName: data.data.accountName, accountNumber: data.data.accountNumber });
      }
    } catch {
      setBankError("Failed to verify account");
    } finally {
      setIsVerifyingAccount(false);
    }
  };

  const handleSaveBank = async () => {
    setBankError("");
    setBankSuccess("");
    if (!verifiedAccount) {
      setBankError("Please verify your account number first");
      return;
    }
    setIsSavingBank(true);
    try {
      const res = await fetch("/api/wallet/bank-account", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          provider: "PAYSTACK",
          accountNumber: bankForm.accountNumber,
          bankCode: bankForm.bankCode,
          currency: bankForm.currency,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        setBankError(data.error?.message ?? "Failed to save bank account");
      } else {
        setBankSuccess("Bank account saved successfully");
        await fetchBankAccount();
      }
    } catch {
      setBankError("Failed to save bank account");
    } finally {
      setIsSavingBank(false);
    }
  };

  const currencySymbol = wallet?.currency === "NGN" ? "₦"
    : wallet?.currency === "GHS" ? "₵"
    : wallet?.currency === "GBP" ? "£"
    : "$";

  const formatAmount = (amount: number) =>
    `${currencySymbol}${amount.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  const formatDate = (dateStr: string) =>
    new Date(dateStr).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });

  const TABS: { id: Tab; label: string; icon: React.ElementType }[] = [
    { id: "overview",     label: "Overview",     icon: Wallet },
    { id: "transactions", label: "Activity",     icon: TrendingUp },
    { id: "withdraw",     label: "Withdraw",     icon: ArrowUpFromLine },
    { id: "bank",         label: "Bank Account", icon: Building2 },
  ];

  if (isLoading) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ backgroundColor: colors.bg }}
      >
        <div
          className={`animate-spin rounded-full h-8 w-8 border-2 border-t-transparent ${isDark ? "border-white" : "border-black"}`}
        />
      </div>
    );
  }

  return (
    <div
      className="min-h-screen pb-20"
      style={{ backgroundColor: colors.bg, color: colors.text }}
    >
      {/* Header */}
      <div
        className="sticky top-0 z-20 px-5 pt-12 pb-4 border-b"
        style={{ backgroundColor: colors.bg, borderColor: colors.border }}
      >
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-[22px] font-black tracking-tight">Wallet</h1>
            <p className="text-[12px]" style={{ color: colors.sub }}>
              Manage your earnings and withdrawals
            </p>
          </div>
          <button
            onClick={handleRefresh}
            disabled={isRefreshing}
            className={`p-2 rounded-xl transition-all ${isDark ? "bg-zinc-900 hover:bg-zinc-800" : "bg-gray-100 hover:bg-gray-200"} ${isRefreshing ? "opacity-50" : ""}`}
          >
            <RefreshCw size={16} className={isRefreshing ? "animate-spin" : ""} style={{ color: colors.sub }} />
          </button>
        </div>

        {/* Tab Bar */}
        <div className="flex gap-1 overflow-x-auto scrollbar-hide -mx-1 px-1">
          {TABS.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setActiveTab(id)}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-[12px] font-semibold whitespace-nowrap transition-all ${
                activeTab === id
                  ? isDark ? "bg-white text-black" : "bg-black text-white"
                  : isDark ? "text-zinc-400 hover:bg-zinc-900" : "text-gray-500 hover:bg-gray-100"
              }`}
            >
              <Icon size={13} />
              {label}
            </button>
          ))}
        </div>
      </div>

      <div className="px-5 pt-6 space-y-5 max-w-lg mx-auto">

        {/* ── OVERVIEW TAB ─────────────────────────────────────────────── */}
        {activeTab === "overview" && (
          <>
            {/* Balance Cards */}
            <div
              className="rounded-2xl p-5 border"
              style={{ backgroundColor: isDark ? "#0f0f0f" : "#F0F0F0", borderColor: colors.border }}
            >
              <p className="text-[11px] font-semibold uppercase tracking-widest mb-2" style={{ color: colors.sub }}>
                Available Balance
              </p>
              <p className="text-[40px] font-black tracking-tighter leading-none mb-1">
                {wallet ? formatAmount(wallet.availableBalance) : "—"}
              </p>
              <p className="text-[12px]" style={{ color: colors.sub }}>
                {wallet?.currency ?? "USD"} · Ready to withdraw
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div
                className="rounded-2xl p-4 border"
                style={{ backgroundColor: colors.card, borderColor: colors.border }}
              >
                <div className="flex items-center gap-1.5 mb-2">
                  <Clock size={13} className="text-amber-500" />
                  <p className="text-[10px] font-bold uppercase tracking-wider text-amber-500">In Escrow</p>
                </div>
                <p className="text-[20px] font-bold">
                  {wallet ? formatAmount(wallet.pendingBalance) : "—"}
                </p>
                <p className="text-[10px] mt-0.5" style={{ color: colors.sub }}>Pending sessions</p>
              </div>

              <div
                className="rounded-2xl p-4 border"
                style={{ backgroundColor: colors.card, borderColor: colors.border }}
              >
                <div className="flex items-center gap-1.5 mb-2">
                  <TrendingUp size={13} className="text-emerald-500" />
                  <p className="text-[10px] font-bold uppercase tracking-wider text-emerald-500">Last 30 Days</p>
                </div>
                <p className="text-[20px] font-bold">
                  {summary ? formatAmount(summary.last30DaysEarnings) : "—"}
                </p>
                <p className="text-[10px] mt-0.5" style={{ color: colors.sub }}>Earnings</p>
              </div>
            </div>

            {/* All-time stats */}
            <div
              className="rounded-2xl border divide-y"
              style={{ backgroundColor: colors.card, borderColor: colors.border, divideColor: colors.border }}
            >
              {[
                { label: "Total Earned", value: wallet ? formatAmount(wallet.totalEarned) : "—", icon: ArrowDownToLine, color: "text-emerald-500" },
                { label: "Total Withdrawn", value: wallet ? formatAmount(wallet.totalWithdrawn) : "—", icon: ArrowUpFromLine, color: "text-purple-500" },
                { label: "Pending Withdrawals", value: summary ? formatAmount(summary.pendingWithdrawalAmount) : "—", icon: Clock, color: "text-amber-500" },
              ].map(({ label, value, icon: Icon, color }) => (
                <div key={label} className="flex items-center justify-between px-4 py-3.5">
                  <div className="flex items-center gap-3">
                    <div className={`p-1.5 rounded-lg ${isDark ? "bg-zinc-800" : "bg-gray-100"}`}>
                      <Icon size={14} className={color} />
                    </div>
                    <span className="text-[13px] font-medium">{label}</span>
                  </div>
                  <span className="text-[13px] font-bold">{value}</span>
                </div>
              ))}
            </div>

            {/* Quick actions */}
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => setActiveTab("withdraw")}
                className={`flex items-center justify-center gap-2 py-3.5 rounded-xl text-[13px] font-bold transition-all active:scale-95 ${
                  isDark ? "bg-white text-black hover:bg-zinc-200" : "bg-black text-white hover:bg-zinc-800"
                }`}
              >
                <ArrowUpFromLine size={15} />
                Withdraw
              </button>
              <button
                onClick={() => setActiveTab("transactions")}
                className={`flex items-center justify-center gap-2 py-3.5 rounded-xl text-[13px] font-bold border transition-all active:scale-95 ${
                  isDark ? "border-zinc-700 text-white hover:bg-zinc-900" : "border-gray-200 text-black hover:bg-gray-50"
                }`}
              >
                <TrendingUp size={15} />
                Activity
              </button>
            </div>
          </>
        )}

        {/* ── TRANSACTIONS TAB ─────────────────────────────────────────── */}
        {activeTab === "transactions" && (
          <div>
            <h2 className="text-[14px] font-bold mb-4">Transaction History</h2>
            {transactions.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <div className={`p-4 rounded-2xl mb-3 ${isDark ? "bg-zinc-900" : "bg-gray-100"}`}>
                  <TrendingUp size={24} style={{ color: colors.sub }} />
                </div>
                <p className="text-[13px] font-semibold mb-1">No transactions yet</p>
                <p className="text-[12px]" style={{ color: colors.sub }}>
                  Your earnings will appear here after sessions complete
                </p>
              </div>
            ) : (
              <div
                className="rounded-2xl border overflow-hidden"
                style={{ borderColor: colors.border }}
              >
                {transactions.map((tx, i) => {
                  const typeConfig = TRANSACTION_TYPE_LABELS[tx.type] ?? {
                    label: tx.type, color: "text-zinc-400", sign: "+" as const,
                  };
                  return (
                    <div
                      key={tx.id}
                      className={`flex items-center gap-3 px-4 py-3.5 ${i > 0 ? "border-t" : ""}`}
                      style={{ borderColor: colors.border, backgroundColor: colors.card }}
                    >
                      <div
                        className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                          typeConfig.sign === "+" ? "bg-emerald-500/10" : "bg-red-500/10"
                        }`}
                      >
                        {typeConfig.sign === "+" ? (
                          <ArrowDownToLine size={15} className="text-emerald-500" />
                        ) : (
                          <ArrowUpFromLine size={15} className="text-red-400" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[13px] font-semibold truncate">{tx.description}</p>
                        <p className="text-[11px]" style={{ color: colors.sub }}>
                          {typeConfig.label} · {formatDate(tx.createdAt)}
                        </p>
                      </div>
                      <div className="text-right shrink-0">
                        <p className={`text-[13px] font-bold ${typeConfig.color}`}>
                          {typeConfig.sign}{tx.currency} {tx.amount.toFixed(2)}
                        </p>
                        <p className="text-[10px]" style={{ color: colors.sub }}>
                          Bal: {tx.balanceAfter.toFixed(2)}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ── WITHDRAW TAB ─────────────────────────────────────────────── */}
        {activeTab === "withdraw" && (
          <div className="space-y-5">
            {/* Balance reminder */}
            <div
              className="rounded-2xl p-4 border"
              style={{ backgroundColor: isDark ? "#0f0f0f" : "#F0F0F0", borderColor: colors.border }}
            >
              <p className="text-[11px] font-semibold uppercase tracking-widest mb-1" style={{ color: colors.sub }}>
                Available to Withdraw
              </p>
              <p className="text-[28px] font-black tracking-tight">
                {wallet ? formatAmount(wallet.availableBalance) : "—"}
              </p>
            </div>

            {/* Bank account warning */}
            {bankAccount && !bankAccount.paystack && bankAccount.paymentProvider === "PAYSTACK" && (
              <div
                className="flex items-start gap-3 p-3.5 rounded-xl border border-amber-500/30 bg-amber-500/5"
              >
                <AlertCircle size={16} className="text-amber-500 shrink-0 mt-0.5" />
                <div>
                  <p className="text-[12px] font-semibold text-amber-500">Bank account required</p>
                  <p className="text-[11px] mt-0.5" style={{ color: colors.sub }}>
                    Add your bank account to withdraw funds.
                  </p>
                  <button
                    onClick={() => setActiveTab("bank")}
                    className="text-[11px] font-semibold text-amber-500 mt-1 flex items-center gap-1"
                  >
                    Add bank account <ChevronRight size={12} />
                  </button>
                </div>
              </div>
            )}

            {/* Withdraw form */}
            <div
              className="rounded-2xl border p-5 space-y-4"
              style={{ backgroundColor: colors.card, borderColor: colors.border }}
            >
              <h3 className="text-[14px] font-bold">Withdraw Funds</h3>

              <div>
                <label className="text-[11px] font-semibold uppercase tracking-wider mb-2 block" style={{ color: colors.sub }}>
                  Amount ({wallet?.currency ?? "USD"})
                </label>
                <div
                  className="flex items-center rounded-xl px-4 py-3 border"
                  style={{ backgroundColor: colors.input, borderColor: colors.border }}
                >
                  <span className="text-[18px] font-bold mr-2">{currencySymbol}</span>
                  <input
                    type="number"
                    value={withdrawAmount}
                    onChange={(e) => setWithdrawAmount(e.target.value)}
                    placeholder="0.00"
                    min="0"
                    step="0.01"
                    className="flex-1 bg-transparent text-[18px] font-bold outline-none"
                    style={{ color: colors.text }}
                  />
                  {wallet && (
                    <button
                      onClick={() => setWithdrawAmount(wallet.availableBalance.toFixed(2))}
                      className="text-[10px] font-bold px-2 py-1 rounded-lg"
                      style={{ color: isDark ? "#FFF" : "#000", backgroundColor: isDark ? "#333" : "#E5E5E5" }}
                    >
                      MAX
                    </button>
                  )}
                </div>
              </div>

              {withdrawError && (
                <div className="flex items-center gap-2 text-red-500">
                  <AlertCircle size={14} />
                  <p className="text-[12px]">{withdrawError}</p>
                </div>
              )}

              {withdrawSuccess && (
                <div className="flex items-center gap-2 text-emerald-500">
                  <CheckCircle2 size={14} />
                  <p className="text-[12px]">{withdrawSuccess}</p>
                </div>
              )}

              <div className="flex items-start gap-2 text-[11px]" style={{ color: colors.sub }}>
                <Info size={12} className="shrink-0 mt-0.5" />
                <span>Paystack payouts arrive within 1–2 business days. Stripe payouts within 2–5 business days.</span>
              </div>

              <button
                onClick={handleWithdraw}
                disabled={isWithdrawing || !withdrawAmount || parseFloat(withdrawAmount) <= 0}
                className={`w-full py-3.5 rounded-xl text-[13px] font-bold transition-all active:scale-95 ${
                  isWithdrawing || !withdrawAmount || parseFloat(withdrawAmount) <= 0
                    ? "opacity-40 cursor-not-allowed"
                    : ""
                } ${isDark ? "bg-white text-black" : "bg-black text-white"}`}
              >
                {isWithdrawing ? "Processing..." : "Withdraw Now"}
              </button>
            </div>

            {/* Withdrawal history */}
            {withdrawals.length > 0 && (
              <div>
                <h3 className="text-[13px] font-bold mb-3">Withdrawal History</h3>
                <div className="rounded-2xl border overflow-hidden" style={{ borderColor: colors.border }}>
                  {withdrawals.map((w, i) => {
                    const statusConf = WITHDRAWAL_STATUS_CONFIG[w.status];
                    const StatusIcon = statusConf.icon;
                    return (
                      <div
                        key={w.id}
                        className={`flex items-center gap-3 px-4 py-3.5 ${i > 0 ? "border-t" : ""}`}
                        style={{ borderColor: colors.border, backgroundColor: colors.card }}
                      >
                        <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${statusConf.bg}`}>
                          <StatusIcon size={15} className={statusConf.color} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-[13px] font-semibold">
                            {w.currency} {w.amount.toFixed(2)}
                          </p>
                          <p className="text-[11px]" style={{ color: colors.sub }}>
                            {w.accountNumber ? `****${w.accountNumber}` : "Bank transfer"} · {formatDate(w.createdAt)}
                          </p>
                        </div>
                        <span className={`text-[11px] font-semibold px-2.5 py-1 rounded-full ${statusConf.bg} ${statusConf.color}`}>
                          {statusConf.label}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── BANK ACCOUNT TAB ─────────────────────────────────────────── */}
        {activeTab === "bank" && (
          <div className="space-y-5">
            {/* Existing bank account */}
            {bankAccount?.paystack && (
              <div
                className="rounded-2xl border p-4"
                style={{ backgroundColor: colors.card, borderColor: colors.border }}
              >
                <div className="flex items-center gap-2 mb-3">
                  <BadgeCheck size={16} className="text-emerald-500" />
                  <p className="text-[13px] font-bold">Saved Bank Account</p>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-[12px]" style={{ color: colors.sub }}>Account Name</span>
                    <span className="text-[12px] font-semibold">{bankAccount.paystack.accountName ?? "—"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[12px]" style={{ color: colors.sub }}>Account Number</span>
                    <span className="text-[12px] font-semibold">
                      ****{bankAccount.paystack.accountNumber?.slice(-4) ?? "—"}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Paystack bank form */}
            {(!bankAccount || bankAccount.paymentProvider === "PAYSTACK") && (
              <div
                className="rounded-2xl border p-5 space-y-4"
                style={{ backgroundColor: colors.card, borderColor: colors.border }}
              >
                <h3 className="text-[14px] font-bold">
                  {bankAccount?.paystack ? "Update Bank Account" : "Add Bank Account"}
                </h3>

                <div>
                  <label className="text-[11px] font-semibold uppercase tracking-wider mb-2 block" style={{ color: colors.sub }}>
                    Currency
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {["NGN", "GHS"].map((c) => (
                      <button
                        key={c}
                        onClick={() => {
                          setBankForm((f) => ({ ...f, currency: c }));
                          setVerifiedAccount(null);
                        }}
                        className={`py-2.5 rounded-xl text-[13px] font-bold border transition-all ${
                          bankForm.currency === c
                            ? isDark ? "bg-white text-black border-white" : "bg-black text-white border-black"
                            : isDark ? "border-zinc-700 text-zinc-300" : "border-gray-200 text-gray-700"
                        }`}
                      >
                        {c === "NGN" ? "🇳🇬 NGN" : "🇬🇭 GHS"}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="text-[11px] font-semibold uppercase tracking-wider mb-2 block" style={{ color: colors.sub }}>
                    Bank
                  </label>
                  <select
                    value={bankForm.bankCode}
                    onChange={(e) => {
                      setBankForm((f) => ({ ...f, bankCode: e.target.value }));
                      setVerifiedAccount(null);
                    }}
                    className="w-full px-4 py-3 rounded-xl text-[13px] font-medium outline-none border"
                    style={{ backgroundColor: colors.input, borderColor: colors.border, color: colors.text }}
                  >
                    <option value="">Select your bank</option>
                    {banks.map((b) => (
                      <option key={b.code} value={b.code}>{b.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-[11px] font-semibold uppercase tracking-wider mb-2 block" style={{ color: colors.sub }}>
                    Account Number
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={bankForm.accountNumber}
                      onChange={(e) => {
                        setBankForm((f) => ({ ...f, accountNumber: e.target.value }));
                        setVerifiedAccount(null);
                      }}
                      placeholder="0123456789"
                      maxLength={10}
                      className="flex-1 px-4 py-3 rounded-xl text-[13px] outline-none border"
                      style={{ backgroundColor: colors.input, borderColor: colors.border, color: colors.text }}
                    />
                    <button
                      onClick={handleVerifyAccount}
                      disabled={isVerifyingAccount || !bankForm.accountNumber || !bankForm.bankCode}
                      className={`px-4 py-3 rounded-xl text-[12px] font-bold transition-all ${
                        isVerifyingAccount || !bankForm.accountNumber || !bankForm.bankCode
                          ? "opacity-40 cursor-not-allowed"
                          : ""
                      } ${isDark ? "bg-zinc-800 text-white hover:bg-zinc-700" : "bg-gray-100 text-black hover:bg-gray-200"}`}
                    >
                      {isVerifyingAccount ? "..." : "Verify"}
                    </button>
                  </div>
                </div>

                {verifiedAccount && (
                  <div className="flex items-center gap-2 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
                    <CheckCircle2 size={14} className="text-emerald-500 shrink-0" />
                    <div>
                      <p className="text-[12px] font-bold text-emerald-500">{verifiedAccount.accountName}</p>
                      <p className="text-[11px] text-emerald-600">{verifiedAccount.accountNumber}</p>
                    </div>
                  </div>
                )}

                {bankError && (
                  <div className="flex items-center gap-2 text-red-500">
                    <AlertCircle size={14} />
                    <p className="text-[12px]">{bankError}</p>
                  </div>
                )}

                {bankSuccess && (
                  <div className="flex items-center gap-2 text-emerald-500">
                    <CheckCircle2 size={14} />
                    <p className="text-[12px]">{bankSuccess}</p>
                  </div>
                )}

                <button
                  onClick={handleSaveBank}
                  disabled={isSavingBank || !verifiedAccount}
                  className={`w-full py-3.5 rounded-xl text-[13px] font-bold transition-all active:scale-95 ${
                    isSavingBank || !verifiedAccount ? "opacity-40 cursor-not-allowed" : ""
                  } ${isDark ? "bg-white text-black" : "bg-black text-white"}`}
                >
                  {isSavingBank ? "Saving..." : "Save Bank Account"}
                </button>
              </div>
            )}

            {/* Stripe Connect */}
            {bankAccount?.paymentProvider === "STRIPE" && (
              <div
                className="rounded-2xl border p-5 space-y-4"
                style={{ backgroundColor: colors.card, borderColor: colors.border }}
              >
                <div className="flex items-center gap-3">
                  <CreditCard size={18} />
                  <h3 className="text-[14px] font-bold">Stripe Connect</h3>
                </div>
                <p className="text-[12px]" style={{ color: colors.sub }}>
                  Connect your bank account via Stripe to receive payouts for completed sessions.
                </p>
                <button
                  onClick={async () => {
                    const res = await fetch("/api/wallet/bank-account", {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({
                        provider: "STRIPE",
                        returnUrl: `${window.location.origin}/wallet?tab=bank&stripe=success`,
                        refreshUrl: `${window.location.origin}/wallet?tab=bank`,
                      }),
                    });
                    const data = await res.json();
                    if (data.data?.onboardingUrl) {
                      window.location.href = data.data.onboardingUrl;
                    }
                  }}
                  className={`w-full py-3.5 rounded-xl text-[13px] font-bold ${
                    isDark ? "bg-white text-black" : "bg-black text-white"
                  }`}
                >
                  {bankAccount.stripe?.onboarded ? "Update Stripe Account" : "Connect with Stripe"}
                </button>
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  );
}