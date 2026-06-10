import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    let studiosRepaired = 0;

    const studios = await prisma.studio.findMany();

    for (const studio of studios) {
      let correctCountry = null;
      
      // Use the currency as the absolute source of truth
      const currency = (studio as any).currency;
      if (currency === "GHS") correctCountry = "Ghana";
      else if (currency === "NGN") correctCountry = "Nigeria";
      else if (currency === "USD") correctCountry = "United States";
      else if (currency === "GBP") correctCountry = "United Kingdom";

      if (correctCountry) {
        await prisma.studio.update({
          where: { id: studio.id },
          data: {
            country: correctCountry, // Force exactly "Ghana" or "Nigeria"
          },
        });
        studiosRepaired++;
      }
    }

    return NextResponse.json({
      success: true,
      message: "Studios forcefully repaired using their currency as the source of truth! 🎯",
      stats: { studiosRepaired }
    });
  } catch (error: any) {
    console.error("Repair Migration Error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}