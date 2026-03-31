/**
 * Stripe Payment Integration
 * Handles international payments (USD, GBP, EUR, etc.) via Stripe API
 * Uses manual capture for escrow-style holds
 * Docs: https://stripe.com/docs/api
 */

import Stripe from "stripe";

let _stripe: Stripe | null = null;

function getStripe(): Stripe {
  if (!process.env.STRIPE_SECRET_KEY) {
    throw new Error("STRIPE_SECRET_KEY environment variable is not set");
  }
  if (!_stripe) {
    _stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: "2024-11-20.acacia",
      typescript: true,
    });
  }
  return _stripe;
}

// ─── Payment Intents (Escrow) ────────────────────────────────────────────────

export interface CreatePaymentIntentParams {
  amount: number;                  // Amount in the currency's smallest unit (cents for USD)
  currency: string;                // ISO 4217 currency code e.g. "usd"
  customerId?: string;             // Stripe Customer ID
  paymentMethodId?: string;        // Attach a specific payment method
  metadata?: Record<string, string>;
  description?: string;
  statementDescriptor?: string;    // Appears on customer's bank statement (max 22 chars)
  transferData?: {
    destination: string;           // Studio owner's Stripe Connect account ID
    amount?: number;               // Amount to transfer (after platform fee)
  };
  applicationFeeAmount?: number;   // Platform fee in smallest unit
  captureMethod?: "automatic" | "manual";
}

/**
 * Create a Stripe PaymentIntent with manual capture for escrow
 * The funds are authorized but not captured until release-payment is called
 */
export async function createPaymentIntent(
  params: CreatePaymentIntentParams
): Promise<Stripe.PaymentIntent> {
  const stripe = getStripe();

  return stripe.paymentIntents.create({
    amount: params.amount,
    currency: params.currency.toLowerCase(),
    capture_method: params.captureMethod ?? "manual",
    description: params.description,
    statement_descriptor: params.statementDescriptor,
    metadata: params.metadata ?? {},
    ...(params.customerId && { customer: params.customerId }),
    ...(params.paymentMethodId && { payment_method: params.paymentMethodId }),
    ...(params.transferData && {
      transfer_data: {
        destination: params.transferData.destination,
        ...(params.transferData.amount && { amount: params.transferData.amount }),
      },
    }),
    ...(params.applicationFeeAmount && {
      application_fee_amount: params.applicationFeeAmount,
    }),
  });
}

/**
 * Retrieve a PaymentIntent
 */
export async function retrievePaymentIntent(
  paymentIntentId: string
): Promise<Stripe.PaymentIntent> {
  return getStripe().paymentIntents.retrieve(paymentIntentId);
}

/**
 * Capture a manually-authorized PaymentIntent (release from escrow)
 * Optionally pass a reduced amount for pro-rata early checkout
 */
export async function capturePaymentIntent(
  paymentIntentId: string,
  amountToCapture?: number
): Promise<Stripe.PaymentIntent> {
  const stripe = getStripe();
  return stripe.paymentIntents.capture(paymentIntentId, {
    ...(amountToCapture && { amount_to_capture: amountToCapture }),
  });
}

/**
 * Cancel a PaymentIntent (releases the authorization hold — no charge)
 */
export async function cancelPaymentIntent(
  paymentIntentId: string
): Promise<Stripe.PaymentIntent> {
  return getStripe().paymentIntents.cancel(paymentIntentId);
}

// ─── Refunds ─────────────────────────────────────────────────────────────────

export interface CreateRefundParams {
  paymentIntentId?: string;
  chargeId?: string;
  amount?: number;           // Partial refund amount; full refund if omitted
  reason?: "duplicate" | "fraudulent" | "requested_by_customer";
  metadata?: Record<string, string>;
}

/**
 * Issue a refund for a PaymentIntent or Charge
 */
export async function createRefund(
  params: CreateRefundParams
): Promise<Stripe.Refund> {
  const stripe = getStripe();
  return stripe.refunds.create({
    ...(params.paymentIntentId && { payment_intent: params.paymentIntentId }),
    ...(params.chargeId && { charge: params.chargeId }),
    ...(params.amount && { amount: params.amount }),
    reason: params.reason ?? "requested_by_customer",
    metadata: params.metadata ?? {},
  });
}

// ─── Transfers (Payouts to Studio Owners) ────────────────────────────────────

export interface CreateTransferParams {
  amount: number;
  currency: string;
  destination: string;       // Studio owner's Stripe Connect account ID
  sourceTransaction?: string; // Charge ID to transfer from
  description?: string;
  metadata?: Record<string, string>;
}

/**
 * Transfer funds to a studio owner's connected Stripe account
 */
export async function createTransfer(
  params: CreateTransferParams
): Promise<Stripe.Transfer> {
  const stripe = getStripe();
  return stripe.transfers.create({
    amount: params.amount,
    currency: params.currency.toLowerCase(),
    destination: params.destination,
    ...(params.sourceTransaction && { source_transaction: params.sourceTransaction }),
    description: params.description,
    metadata: params.metadata ?? {},
  });
}

// ─── Connect Accounts (Studio Owner Onboarding) ──────────────────────────────

/**
 * Create a Stripe Connect account for a studio owner
 */
export async function createConnectAccount(params: {
  email: string;
  country: string;          // ISO 3166-1 alpha-2
  businessType?: "individual" | "company";
  metadata?: Record<string, string>;
}): Promise<Stripe.Account> {
  const stripe = getStripe();
  return stripe.accounts.create({
    type: "express",
    country: params.country,
    email: params.email,
    business_type: params.businessType ?? "individual",
    capabilities: {
      card_payments: { requested: true },
      transfers: { requested: true },
    },
    metadata: params.metadata ?? {},
  });
}

/**
 * Create an account link for Connect onboarding
 */
export async function createAccountLink(
  accountId: string,
  refreshUrl: string,
  returnUrl: string
): Promise<Stripe.AccountLink> {
  const stripe = getStripe();
  return stripe.accountLinks.create({
    account: accountId,
    refresh_url: refreshUrl,
    return_url: returnUrl,
    type: "account_onboarding",
  });
}

// ─── Customers ───────────────────────────────────────────────────────────────

/**
 * Create or retrieve a Stripe Customer
 */
export async function createCustomer(params: {
  email: string;
  name?: string;
  metadata?: Record<string, string>;
}): Promise<Stripe.Customer> {
  const stripe = getStripe();
  return stripe.customers.create({
    email: params.email,
    name: params.name,
    metadata: params.metadata ?? {},
  });
}

// ─── Webhook Verification ────────────────────────────────────────────────────

/**
 * Construct and verify a Stripe webhook event
 * Must be called with the raw request body
 */
export function constructWebhookEvent(
  rawBody: string | Buffer,
  signature: string
): Stripe.Event {
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!webhookSecret) {
    throw new Error("STRIPE_WEBHOOK_SECRET environment variable is not set");
  }
  return getStripe().webhooks.constructEvent(rawBody, signature, webhookSecret);
}

// ─── Utility ─────────────────────────────────────────────────────────────────

/**
 * Convert a decimal amount (e.g. 50.00 USD) to Stripe's smallest unit (cents)
 */
export function toSmallestUnit(amount: number, currency: string): number {
  // Zero-decimal currencies don't need multiplication
  const zeroDecimalCurrencies = ["bif", "clp", "gnf", "mga", "pyg", "rwf", "ugx", "xaf", "xof", "vnd"];
  if (zeroDecimalCurrencies.includes(currency.toLowerCase())) {
    return Math.round(amount);
  }
  return Math.round(amount * 100);
}

/**
 * Convert Stripe's smallest unit back to a decimal amount
 */
export function fromSmallestUnit(amount: number, currency: string): number {
  const zeroDecimalCurrencies = ["bif", "clp", "gnf", "mga", "pyg", "rwf", "ugx", "xaf", "xof", "vnd"];
  if (zeroDecimalCurrencies.includes(currency.toLowerCase())) {
    return amount;
  }
  return amount / 100;
}