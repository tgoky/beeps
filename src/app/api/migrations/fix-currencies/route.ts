import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrencyConfig } from "@/lib/currency";

export async function GET() {
  try {
    let usersUpdated = 0;
    let walletsUpdated = 0;
    let studiosUpdated = 0;

    // ==========================================
    // 1. MIGRATE USERS AND WALLETS
    // ==========================================
    const users = await prisma.user.findMany({
      include: { wallet: true },
    });

    for (const user of users) {
      // Try to get country code, fallback to parsing location string
      let countryCode = user.countryCode;
      if (!countryCode && user.location) {
        const parts = user.location.split(",");
        countryCode = parts[parts.length - 1]?.trim() || null;
      }

      const config = getCurrencyConfig(countryCode);

      // Update User if currency or provider is incorrect
      if (
        user.currency !== config.currency ||
        user.paymentProvider !== config.provider ||
        (!user.countryCode && countryCode)
      ) {
        await prisma.user.update({
          where: { id: user.id },
          data: {
            currency: config.currency,
            paymentProvider: config.provider,
            ...( !user.countryCode && countryCode ? { countryCode } : {} ),
          },
        });
        usersUpdated++;
      }

      // Update Wallet to match User's local currency
      if (user.wallet && user.wallet.currency !== config.currency) {
        await prisma.wallet.update({
          where: { id: user.wallet.id },
          data: { currency: config.currency },
        });
        walletsUpdated++;
      }
    }

    // ==========================================
    // 2. MIGRATE STUDIOS
    // ==========================================
    const studios = await prisma.studio.findMany();

    for (const studio of studios) {
      // Try to get country, fallback to parsing location string
      let country = studio.country;
      if (!country && studio.location) {
        const parts = studio.location.split(",");
        country = parts[parts.length - 1]?.trim() || null;
      }

      const config = getCurrencyConfig(country);

      // Update Studio currency
      if (studio.currency !== config.currency) {
        await prisma.studio.update({
          where: { id: studio.id },
          data: { currency: config.currency },
        });
        studiosUpdated++;
      }
    }

    return NextResponse.json({
      success: true,
      message: "Database currency migration completed successfully.",
      stats: {
        usersUpdated,
        walletsUpdated,
        studiosUpdated,
      },
    });
  } catch (error: any) {
    console.error("Migration Error:", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}