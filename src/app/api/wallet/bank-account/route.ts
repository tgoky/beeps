import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/lib/api-middleware";
import { prisma } from "@/lib/prisma";
import {
  createTransferRecipient,
  verifyAccountNumber,
} from "@/lib/paystack";
import {
  createConnectAccount,
  createAccountLink,
} from "@/lib/stripe";
import type { ApiResponse } from "@/types";

/**
 * GET /api/wallet/bank-account
 * Retrieve saved bank account details for the current user
 */
export async function GET(req: NextRequest) {
  return withAuth(req, async (req) => {
    const user = req.user!;

    try {
      const studioProfile = await prisma.studioOwnerProfile.findUnique({
        where: { userId: user.id },
        select: {
          paystackAccountNumber: true,
          paystackAccountName: true,
          paystackBankCode: true,
          paystackRecipientCode: true,
          stripeConnectId: true,
          stripeOnboarded: true,
        },
      });

      return NextResponse.json<ApiResponse>({
        success: true,
        data: {
          paystack: studioProfile?.paystackAccountNumber
            ? {
                accountNumber: studioProfile.paystackAccountNumber,
                accountName: studioProfile.paystackAccountName,
                bankCode: studioProfile.paystackBankCode,
                recipientCode: studioProfile.paystackRecipientCode,
              }
            : null,
          stripe: studioProfile?.stripeConnectId
            ? {
                connectId: studioProfile.stripeConnectId,
                onboarded: studioProfile.stripeOnboarded,
              }
            : null,
          paymentProvider: user.paymentProvider,
          currency: user.currency,
        },
      });
    } catch (error: any) {
      console.error("Error fetching bank account:", error);
      return NextResponse.json<ApiResponse>(
        { success: false, error: { message: "Failed to fetch bank account", code: "SERVER_ERROR" } },
        { status: 500 }
      );
    }
  });
}

/**
 * POST /api/wallet/bank-account
 * Save/update bank account for payouts
 *
 * For Paystack (NG/GH): { provider: "PAYSTACK", accountNumber, bankCode, currency: "NGN"|"GHS" }
 * For Stripe: { provider: "STRIPE", returnUrl }
 */
export async function POST(req: NextRequest) {
  return withAuth(req, async (req) => {
    const user = req.user!;

    try {
      const body = await req.json();
      const { provider } = body;

      if (!provider || !["PAYSTACK", "STRIPE"].includes(provider)) {
        return NextResponse.json<ApiResponse>(
          { success: false, error: { message: "provider must be 'PAYSTACK' or 'STRIPE'", code: "VALIDATION_ERROR" } },
          { status: 400 }
        );
      }

      if (provider === "PAYSTACK") {
        const { accountNumber, bankCode, currency } = body as {
          accountNumber: string;
          bankCode: string;
          currency: "NGN" | "GHS";
        };

        if (!accountNumber || !bankCode || !currency) {
          return NextResponse.json<ApiResponse>(
            { success: false, error: { message: "accountNumber, bankCode, and currency are required", code: "VALIDATION_ERROR" } },
            { status: 400 }
          );
        }

        // Verify account number with Paystack
        const verified = await verifyAccountNumber(accountNumber, bankCode);

        // Create/update transfer recipient
        const recipient = await createTransferRecipient({
          type: "nuban",
          name: verified.account_name,
          account_number: accountNumber,
          bank_code: bankCode,
          currency: currency as "NGN" | "GHS",
          description: `Payout account for ${user.fullName || user.username}`,
          metadata: { userId: user.id },
        });

        // Save to studio profile
        await prisma.studioOwnerProfile.upsert({
          where: { userId: user.id },
          create: {
            userId: user.id,
            studioName: user.fullName ?? user.username ?? "Studio",
            paystackAccountNumber: accountNumber,
            paystackAccountName: verified.account_name,
            paystackBankCode: bankCode,
            paystackRecipientCode: recipient.recipient_code,
          },
          update: {
            paystackAccountNumber: accountNumber,
            paystackAccountName: verified.account_name,
            paystackBankCode: bankCode,
            paystackRecipientCode: recipient.recipient_code,
          },
        });

        return NextResponse.json<ApiResponse>({
          success: true,
          data: {
            accountNumber,
            accountName: verified.account_name,
            bankCode,
            recipientCode: recipient.recipient_code,
            message: "Bank account saved successfully",
          },
        });
      } else {
        // Stripe Connect onboarding
        const { returnUrl, refreshUrl } = body as {
          returnUrl: string;
          refreshUrl: string;
        };

        let studioProfile = await prisma.studioOwnerProfile.findUnique({
          where: { userId: user.id },
        });

        let connectId = studioProfile?.stripeConnectId;

        if (!connectId) {
          // Create new Connect account
          const account = await createConnectAccount({
            email: user.email,
            country: user.countryCode ?? "US",
            metadata: { userId: user.id },
          });
          connectId = account.id;

          await prisma.studioOwnerProfile.upsert({
            where: { userId: user.id },
            create: {
              userId: user.id,
              studioName: user.fullName ?? user.username ?? "Studio",
              stripeConnectId: connectId,
            },
            update: { stripeConnectId: connectId },
          });
        }

        // Generate onboarding link
        const accountLink = await createAccountLink(
          connectId,
          refreshUrl ?? `${process.env.NEXT_PUBLIC_APP_URL}/wallet?tab=bank`,
          returnUrl ?? `${process.env.NEXT_PUBLIC_APP_URL}/wallet?tab=bank&stripe=success`
        );

        return NextResponse.json<ApiResponse>({
          success: true,
          data: {
            onboardingUrl: accountLink.url,
            connectId,
            message: "Stripe Connect onboarding link generated",
          },
        });
      }
    } catch (error: any) {
      console.error("Error saving bank account:", error);
      return NextResponse.json<ApiResponse>(
        {
          success: false,
          error: {
            message: error.message || "Failed to save bank account",
            code: "SERVER_ERROR",
          },
        },
        { status: 500 }
      );
    }
  });
}