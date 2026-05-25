import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";

export async function GET() {
  try {
    let walletsReset = 0;
    let studiosReset = 0;

    // ==========================================
    // 1. CLEAN RESET WALLET BALANCES
    // ==========================================
    const wallets = await prisma.wallet.findMany();

    for (const wallet of wallets) {
      // Set sensible test wallet balances based on the currency
      let newBalance = 500; // Default $500 or £500
      if (wallet.currency === "NGN") newBalance = 50000; // 50k Naira
      if (wallet.currency === "GHS") newBalance = 1000;  // 1k Cedis

      await prisma.wallet.update({
        where: { id: wallet.id },
        data: {
          availableBalance: new Prisma.Decimal(newBalance),
          pendingBalance: new Prisma.Decimal(0),
          totalEarned: new Prisma.Decimal(newBalance),
          totalWithdrawn: new Prisma.Decimal(0),
        },
      });
      walletsReset++;
    }

    // ==========================================
    // 2. CLEAN RESET STUDIO HOURLY RATES
    // ==========================================
    const studios = await prisma.studio.findMany();

    for (const studio of studios) {
      const currency = (studio as any).currency || "USD";
      
      // Set sensible hourly rates based on the currency
      let newRate = 50; // Default $50/hr
      if (currency === "NGN") newRate = 15000; // 15k Naira/hr
      if (currency === "GHS") newRate = 200;   // 200 Cedis/hr

      await prisma.studio.update({
        where: { id: studio.id },
        data: {
          hourlyRate: new Prisma.Decimal(newRate),
        },
      });
      studiosReset++;
    }

    return NextResponse.json({
      success: true,
      message: "Clean slate applied! Wallets and Studios have sensible test numbers now.",
      stats: {
        walletsReset,
        studiosReset,
      },
    });
  } catch (error: any) {
    console.error("Reset Error:", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}