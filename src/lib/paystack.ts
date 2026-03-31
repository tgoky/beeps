/**
 * Paystack Payment Integration
 * Handles NGN (Nigeria) and GHS (Ghana) payments via Paystack API
 * Docs: https://paystack.com/docs/api
 */

const PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY!;
const PAYSTACK_BASE_URL = "https://api.paystack.co";

interface PaystackHeaders {
  Authorization: string;
  "Content-Type": string;
}

function getHeaders(): PaystackHeaders {
  if (!PAYSTACK_SECRET_KEY) {
    throw new Error("PAYSTACK_SECRET_KEY environment variable is not set");
  }
  return {
    Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
    "Content-Type": "application/json",
  };
}

async function paystackFetch<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const res = await fetch(`${PAYSTACK_BASE_URL}${path}`, {
    ...options,
    headers: {
      ...getHeaders(),
      ...((options.headers as Record<string, string>) || {}),
    },
  });

  const data = await res.json();

  if (!res.ok || !data.status) {
    throw new Error(
      data.message || `Paystack API error: ${res.status} ${res.statusText}`
    );
  }

  return data;
}

// ─── Transaction ────────────────────────────────────────────────────────────

export interface PaystackInitializeParams {
  email: string;
  amount: number;         // Amount in kobo (NGN) or pesewas (GHS) — smallest unit
  currency?: "NGN" | "GHS";
  reference?: string;     // Unique transaction reference; auto-generated if omitted
  callback_url?: string;
  metadata?: Record<string, unknown>;
  subaccount?: string;    // Studio owner subaccount code for split payments
  transaction_charge?: number; // Platform fee in kobo (charged to subaccount split)
  bearer?: "account" | "subaccount"; // Who bears Paystack fees
}

export interface PaystackInitializeResult {
  authorization_url: string;  // Redirect user here
  access_code: string;        // For Paystack inline popup
  reference: string;          // Transaction reference
}

/**
 * Initialize a Paystack transaction
 * Returns authorization_url for redirect OR access_code for inline popup
 */
export async function initializeTransaction(
  params: PaystackInitializeParams
): Promise<PaystackInitializeResult> {
  const response = await paystackFetch<{
    status: boolean;
    message: string;
    data: PaystackInitializeResult;
  }>("/transaction/initialize", {
    method: "POST",
    body: JSON.stringify(params),
  });

  return response.data;
}

export interface PaystackVerifyResult {
  id: number;
  status: "success" | "failed" | "abandoned";
  reference: string;
  amount: number;     // In kobo/pesewas
  currency: string;
  paid_at: string;
  customer: {
    email: string;
    customer_code: string;
  };
  metadata: Record<string, unknown>;
  authorization: {
    authorization_code: string;
    card_type: string;
    last4: string;
    bank: string;
    channel: string;
  };
}

/**
 * Verify a Paystack transaction by reference
 */
export async function verifyTransaction(
  reference: string
): Promise<PaystackVerifyResult> {
  const response = await paystackFetch<{
    status: boolean;
    message: string;
    data: PaystackVerifyResult;
  }>(`/transaction/verify/${encodeURIComponent(reference)}`);

  return response.data;
}

// ─── Refund ──────────────────────────────────────────────────────────────────

export interface PaystackRefundParams {
  transaction: string;        // Transaction reference or ID
  amount?: number;            // Partial refund amount in kobo; full refund if omitted
  currency?: string;
  customer_note?: string;
  merchant_note?: string;
}

export interface PaystackRefundResult {
  transaction: { id: number; reference: string };
  integration: number;
  deducted_amount: number;
  id: number;
  domain: string;
  status: string;
  currency: string;
  amount: number;
  refunded_at: string;
}

/**
 * Initiate a Paystack refund
 */
export async function refundTransaction(
  params: PaystackRefundParams
): Promise<PaystackRefundResult> {
  const response = await paystackFetch<{
    status: boolean;
    message: string;
    data: PaystackRefundResult;
  }>("/refund", {
    method: "POST",
    body: JSON.stringify(params),
  });

  return response.data;
}

// ─── Transfers (Payouts to Studio Owners) ────────────────────────────────────

export interface PaystackCreateRecipientParams {
  type: "nuban" | "mobile_money" | "basa";
  name: string;
  account_number: string;
  bank_code: string;
  currency: "NGN" | "GHS";
  description?: string;
  metadata?: Record<string, unknown>;
}

export interface PaystackRecipientResult {
  active: boolean;
  createdAt: string;
  currency: string;
  description: string;
  domain: string;
  id: number;
  integration: number;
  name: string;
  recipient_code: string;
  type: string;
  updatedAt: string;
  details: {
    account_number: string;
    account_name: string;
    bank_code: string;
    bank_name: string;
  };
}

/**
 * Create a transfer recipient (studio owner's bank account)
 */
export async function createTransferRecipient(
  params: PaystackCreateRecipientParams
): Promise<PaystackRecipientResult> {
  const response = await paystackFetch<{
    status: boolean;
    message: string;
    data: PaystackRecipientResult;
  }>("/transferrecipient", {
    method: "POST",
    body: JSON.stringify(params),
  });

  return response.data;
}

export interface PaystackTransferParams {
  source: "balance";
  amount: number;           // In kobo (NGN) or pesewas (GHS)
  recipient: string;        // Recipient code
  reason?: string;
  currency?: string;
  reference?: string;
}

export interface PaystackTransferResult {
  reference: string;
  integration: number;
  domain: string;
  amount: number;
  currency: string;
  source: string;
  reason: string;
  recipient: number;
  status: string;
  transfer_code: string;
  id: number;
  createdAt: string;
  updatedAt: string;
}

/**
 * Initiate a transfer to a studio owner's bank account
 */
export async function initiateTransfer(
  params: PaystackTransferParams
): Promise<PaystackTransferResult> {
  const response = await paystackFetch<{
    status: boolean;
    message: string;
    data: PaystackTransferResult;
  }>("/transfer", {
    method: "POST",
    body: JSON.stringify(params),
  });

  return response.data;
}

// ─── Subaccounts (Split Payments) ────────────────────────────────────────────

export interface PaystackCreateSubaccountParams {
  business_name: string;
  settlement_bank: string;   // Bank code
  account_number: string;
  percentage_charge: number; // e.g. 90 means studio owner gets 90%, platform gets 10%
  description?: string;
  primary_contact_email?: string;
  primary_contact_name?: string;
  primary_contact_phone?: string;
  metadata?: Record<string, unknown>;
}

export interface PaystackSubaccountResult {
  subaccount_code: string;
  business_name: string;
  description: string;
  primary_contact_name: string | null;
  primary_contact_email: string | null;
  primary_contact_phone: string | null;
  metadata: Record<string, unknown> | null;
  percentage_charge: number;
  settlement_bank: string;
  account_number: string;
  active: boolean;
  id: number;
  createdAt: string;
}

/**
 * Create a Paystack subaccount for a studio owner
 * Enables automatic split payments when bookings are processed
 */
export async function createSubaccount(
  params: PaystackCreateSubaccountParams
): Promise<PaystackSubaccountResult> {
  const response = await paystackFetch<{
    status: boolean;
    message: string;
    data: PaystackSubaccountResult;
  }>("/subaccount", {
    method: "POST",
    body: JSON.stringify(params),
  });

  return response.data;
}

// ─── Bank Listing ────────────────────────────────────────────────────────────

export interface PaystackBank {
  id: number;
  name: string;
  slug: string;
  code: string;
  longcode: string;
  gateway: string | null;
  pay_with_bank: boolean;
  active: boolean;
  country: string;
  currency: string;
  type: string;
}

/**
 * List all banks supported by Paystack for a given country
 */
export async function listBanks(country: "nigeria" | "ghana"): Promise<PaystackBank[]> {
  const response = await paystackFetch<{
    status: boolean;
    message: string;
    data: PaystackBank[];
  }>(`/bank?country=${country}&use_cursor=false&perPage=100`);

  return response.data;
}

/**
 * Verify a bank account number
 */
export async function verifyAccountNumber(
  accountNumber: string,
  bankCode: string
): Promise<{ account_number: string; account_name: string; bank_id: number }> {
  const response = await paystackFetch<{
    status: boolean;
    message: string;
    data: { account_number: string; account_name: string; bank_id: number };
  }>(`/bank/resolve?account_number=${accountNumber}&bank_code=${bankCode}`);

  return response.data;
}

// ─── Webhook Verification ────────────────────────────────────────────────────

import crypto from "crypto";

/**
 * Verify Paystack webhook signature
 * Must be called before processing any webhook event
 */
export function verifyWebhookSignature(
  rawBody: string,
  signature: string
): boolean {
  const hash = crypto
    .createHmac("sha512", PAYSTACK_SECRET_KEY)
    .update(rawBody)
    .digest("hex");
  return hash === signature;
}

// ─── Utility ─────────────────────────────────────────────────────────────────

/**
 * Convert a decimal amount (e.g. 50.00 NGN) to Paystack's smallest unit (kobo/pesewas)
 */
export function toSmallestUnit(amount: number): number {
  return Math.round(amount * 100);
}

/**
 * Convert Paystack's smallest unit back to decimal amount
 */
export function fromSmallestUnit(amount: number): number {
  return amount / 100;
}
