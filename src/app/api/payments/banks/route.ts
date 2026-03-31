import { NextRequest, NextResponse } from "next/server";
import { listBanks, verifyAccountNumber } from "@/lib/paystack";
import type { ApiResponse } from "@/types";

/**
 * GET /api/payments/banks?country=nigeria|ghana
 * List banks supported by Paystack for a given country
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const country = (searchParams.get("country") ?? "nigeria") as "nigeria" | "ghana";

    if (!["nigeria", "ghana"].includes(country)) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: { message: "country must be 'nigeria' or 'ghana'", code: "VALIDATION_ERROR" } },
        { status: 400 }
      );
    }

    const banks = await listBanks(country);

    return NextResponse.json<ApiResponse>({
      success: true,
      data: { banks },
    });
  } catch (error: any) {
    console.error("Error fetching banks:", error);
    return NextResponse.json<ApiResponse>(
      { success: false, error: { message: "Failed to fetch banks", code: "SERVER_ERROR" } },
      { status: 500 }
    );
  }
}

/**
 * POST /api/payments/banks/verify
 * Verify a bank account number via Paystack
 * Body: { accountNumber, bankCode }
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { accountNumber, bankCode } = body;

    if (!accountNumber || !bankCode) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: { message: "accountNumber and bankCode are required", code: "VALIDATION_ERROR" } },
        { status: 400 }
      );
    }

    const result = await verifyAccountNumber(accountNumber, bankCode);

    return NextResponse.json<ApiResponse>({
      success: true,
      data: {
        accountNumber: result.account_number,
        accountName: result.account_name,
        bankId: result.bank_id,
      },
    });
  } catch (error: any) {
    console.error("Error verifying account:", error);
    return NextResponse.json<ApiResponse>(
      {
        success: false,
        error: {
          message: error.message || "Failed to verify account number",
          code: "VERIFICATION_FAILED",
        },
      },
      { status: 400 }
    );
  }
}
