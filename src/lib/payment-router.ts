/**
 * Payment Router
 * Determines which payment provider to use based on user's country/currency
 * and routes payment operations accordingly.
 *
 * Supported providers:
 *   - PAYSTACK: Nigeria (NGN), Ghana (GHS)
 *   - STRIPE:   All other countries (USD, GBP, EUR, etc.)
 */

// ─── Country → Currency/Provider Mapping ─────────────────────────────────────

export interface PaymentConfig {
  provider: "STRIPE" | "PAYSTACK";
  currency: string;        // ISO 4217
  currencySymbol: string;
  countryName: string;
}

const COUNTRY_PAYMENT_CONFIG: Record<string, PaymentConfig> = {
  NG: { provider: "PAYSTACK", currency: "NGN", currencySymbol: "₦", countryName: "Nigeria" },
  GH: { provider: "PAYSTACK", currency: "GHS", currencySymbol: "₵", countryName: "Ghana" },
  // All other countries default to Stripe/USD below
  US: { provider: "STRIPE", currency: "USD", currencySymbol: "$", countryName: "United States" },
  GB: { provider: "STRIPE", currency: "GBP", currencySymbol: "£", countryName: "United Kingdom" },
  EU: { provider: "STRIPE", currency: "EUR", currencySymbol: "€", countryName: "Europe" },
  CA: { provider: "STRIPE", currency: "CAD", currencySymbol: "CA$", countryName: "Canada" },
  AU: { provider: "STRIPE", currency: "AUD", currencySymbol: "A$", countryName: "Australia" },
  ZA: { provider: "STRIPE", currency: "ZAR", currencySymbol: "R", countryName: "South Africa" },
  KE: { provider: "STRIPE", currency: "KES", currencySymbol: "KSh", countryName: "Kenya" },
  IN: { provider: "STRIPE", currency: "INR", currencySymbol: "₹", countryName: "India" },
};

const DEFAULT_CONFIG: PaymentConfig = {
  provider: "STRIPE",
  currency: "USD",
  currencySymbol: "$",
  countryName: "International",
};

/**
 * Get payment configuration for a given country code
 */
export function getPaymentConfig(countryCode: string | null | undefined): PaymentConfig {
  if (!countryCode) return DEFAULT_CONFIG;
  return COUNTRY_PAYMENT_CONFIG[countryCode.toUpperCase()] ?? DEFAULT_CONFIG;
}

/**
 * Determine provider from currency code
 */
export function getProviderFromCurrency(currency: string): "STRIPE" | "PAYSTACK" {
  const paystackCurrencies = ["NGN", "GHS"];
  return paystackCurrencies.includes(currency.toUpperCase()) ? "PAYSTACK" : "STRIPE";
}

/**
 * Format an amount with its currency symbol
 */
export function formatAmount(amount: number, currency: string): string {
  const config = Object.values(COUNTRY_PAYMENT_CONFIG).find(
    (c) => c.currency === currency
  );
  const symbol = config?.currencySymbol ?? "$";
  return `${symbol}${amount.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

// ─── Payment Operations ───────────────────────────────────────────────────────

import * as paystack from "./paystack";
import * as stripe from "./stripe";
import crypto from "crypto";

export interface InitializePaymentParams {
  provider: "STRIPE" | "PAYSTACK";
  amount: number;            // Decimal amount (e.g. 50.00 NGN)
  currency: string;          // ISO 4217
  email: string;             // Customer email
  bookingId: string;
  callbackUrl?: string;      // Paystack redirect after payment
  metadata?: Record<string, string>;
  // Studio owner split (optional — for Paystack subaccount)
  studioSubaccountCode?: string;
  platformFeePercent?: number;  // e.g. 10 (= 10%)
}

export interface InitializePaymentResult {
  provider: "STRIPE" | "PAYSTACK";
  // Paystack
  authorizationUrl?: string;   // Redirect URL for Paystack
  accessCode?: string;         // Paystack inline popup code
  paystackReference?: string;  // Unique Paystack reference
  // Stripe
  clientSecret?: string;       // Stripe PaymentIntent client_secret for frontend
  paymentIntentId?: string;    // Stripe PaymentIntent ID
  // Common
  reference: string;           // Universal reference stored on the Booking
  currency: string;
  amount: number;
}

/**
 * Initialize a payment with the appropriate provider
 */
export async function initializePayment(
  params: InitializePaymentParams
): Promise<InitializePaymentResult> {
  if (params.provider === "PAYSTACK") {
    const reference = `BEEPS-${params.bookingId.slice(0, 8)}-${crypto.randomBytes(4).toString("hex").toUpperCase()}`;
    const amountInSmallestUnit = paystack.toSmallestUnit(params.amount);

    const platformFee = params.platformFeePercent
      ? paystack.toSmallestUnit(
          Math.round((params.amount * (params.platformFeePercent / 100)) * 100) / 100
        )
      : undefined;

    const result = await paystack.initializeTransaction({
      email: params.email,
      amount: amountInSmallestUnit,
      currency: params.currency as "NGN" | "GHS",
      reference,
      callback_url: params.callbackUrl,
      metadata: {
        ...(params.metadata ?? {}),
        bookingId: params.bookingId,
        provider: "PAYSTACK",
      },
      ...(params.studioSubaccountCode && {
        subaccount: params.studioSubaccountCode,
        bearer: "account", // Platform bears Paystack fees; transaction_charge is platform's cut
        transaction_charge: platformFee,
      }),
    });

    return {
      provider: "PAYSTACK",
      authorizationUrl: result.authorization_url,
      accessCode: result.access_code,
      paystackReference: reference,
      reference,
      currency: params.currency,
      amount: params.amount,
    };
  } else {
    // Stripe
    const amountInCents = stripe.toSmallestUnit(params.amount, params.currency);
    const platformFeeAmount = params.platformFeePercent
      ? Math.round(amountInCents * (params.platformFeePercent / 100))
      : undefined;

    const paymentIntent = await stripe.createPaymentIntent({
      amount: amountInCents,
      currency: params.currency,
      captureMethod: "manual",
      description: `Studio Booking ${params.bookingId}`,
      statementDescriptor: "BEEPS SESSION",
      metadata: {
        ...(params.metadata ?? {}),
        bookingId: params.bookingId,
      },
      ...(platformFeeAmount && { applicationFeeAmount: platformFeeAmount }),
    });

    return {
      provider: "STRIPE",
      clientSecret: paymentIntent.client_secret ?? undefined,
      paymentIntentId: paymentIntent.id,
      reference: paymentIntent.id,
      currency: params.currency,
      amount: params.amount,
    };
  }
}

// ─── Refund ───────────────────────────────────────────────────────────────────

export interface ProcessRefundParams {
  provider: "STRIPE" | "PAYSTACK";
  paymentIntentId?: string;  // Stripe
  paystackReference?: string; // Paystack
  amount: number;             // Decimal amount to refund
  currency: string;
  reason?: string;
}

export interface ProcessRefundResult {
  success: boolean;
  refundId?: string;
  refundReference?: string;
  amount: number;
  currency: string;
  provider: string;
}

/**
 * Process a refund with the appropriate provider
 */
export async function processRefund(
  params: ProcessRefundParams
): Promise<ProcessRefundResult> {
  if (params.provider === "PAYSTACK") {
    if (!params.paystackReference) {
      throw new Error("paystackReference is required for Paystack refunds");
    }

    const refund = await paystack.refundTransaction({
      transaction: params.paystackReference,
      amount: paystack.toSmallestUnit(params.amount),
      currency: params.currency,
      merchant_note: params.reason ?? "Session cancelled",
    });

    return {
      success: refund.status === "processed" || refund.status === "pending",
      refundReference: String(refund.id),
      amount: paystack.fromSmallestUnit(refund.amount),
      currency: params.currency,
      provider: "PAYSTACK",
    };
  } else {
    // Stripe — if payment was manually authorized but never captured, cancel instead
    if (params.paymentIntentId) {
      try {
        // Try to cancel first (no-charge if uncaptured)
        const pi = await stripe.cancelPaymentIntent(params.paymentIntentId);
        return {
          success: pi.status === "canceled",
          refundId: pi.id,
          amount: params.amount,
          currency: params.currency,
          provider: "STRIPE",
        };
      } catch {
        // If already captured, issue a refund
        const refund = await stripe.createRefund({
          paymentIntentId: params.paymentIntentId,
          amount: stripe.toSmallestUnit(params.amount, params.currency),
          reason: "requested_by_customer",
        });
        return {
          success: refund.status === "succeeded" || refund.status === "pending",
          refundId: refund.id,
          amount: stripe.fromSmallestUnit(refund.amount, params.currency),
          currency: params.currency,
          provider: "STRIPE",
        };
      }
    }
    throw new Error("paymentIntentId is required for Stripe refunds");
  }
}

// ─── Capture (Release Escrow) ─────────────────────────────────────────────────

export interface CapturePaymentParams {
  provider: "STRIPE" | "PAYSTACK";
  paymentIntentId?: string;  // Stripe only
  amount: number;            // Decimal amount to capture
  currency: string;
  studioOwnerPayoutAmount: number;
  // Paystack payout to studio owner
  paystackRecipientCode?: string;
  paystackReference?: string;
}

export interface CapturePaymentResult {
  success: boolean;
  capturedAmount: number;
  payoutAmount: number;
  currency: string;
  provider: string;
  stripeTransferId?: string;
  paystackTransferCode?: string;
}

/**
 * Capture the escrowed payment and payout the studio owner
 */
export async function captureAndPayout(
  params: CapturePaymentParams
): Promise<CapturePaymentResult> {
  if (params.provider === "PAYSTACK") {
    // For Paystack: the money is already collected. We initiate a transfer to the studio owner.
    if (!params.paystackRecipientCode) {
      throw new Error("paystackRecipientCode is required for Paystack payouts");
    }

    const transfer = await paystack.initiateTransfer({
      source: "balance",
      amount: paystack.toSmallestUnit(params.studioOwnerPayoutAmount),
      recipient: params.paystackRecipientCode,
      reason: `Studio session payout`,
      currency: params.currency,
    });

    return {
      success: transfer.status === "success" || transfer.status === "pending",
      capturedAmount: params.amount,
      payoutAmount: params.studioOwnerPayoutAmount,
      currency: params.currency,
      provider: "PAYSTACK",
      paystackTransferCode: transfer.transfer_code,
    };
  } else {
    // Stripe: capture the PaymentIntent with exact amount
    if (!params.paymentIntentId) {
      throw new Error("paymentIntentId is required for Stripe capture");
    }

    const amountInCents = stripe.toSmallestUnit(params.amount, params.currency);
    const captured = await stripe.capturePaymentIntent(
      params.paymentIntentId,
      amountInCents
    );

    return {
      success: captured.status === "succeeded",
      capturedAmount: params.amount,
      payoutAmount: params.studioOwnerPayoutAmount,
      currency: params.currency,
      provider: "STRIPE",
    };
  }
}