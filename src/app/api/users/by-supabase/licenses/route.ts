import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/lib/api-middleware";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  return withAuth(req, async (req) => {
    try {
      const user = req.user!;

      // Fetch all licenses the user has bought
      const licenses = await prisma.licenseAgreement.findMany({
        where: { buyerId: user.id },
        include: {
          beat: {
            select: { title: true, imageUrl: true, producer: { select: { fullName: true, username: true } } }
          },
          serviceRequest: {
            select: { projectTitle: true, producer: { select: { fullName: true, username: true } } }
          }
        },
        orderBy: { createdAt: "desc" },
      });

      // Format the data perfectly for the frontend
      const formattedVault = licenses.map(license => {
        const isCustom = !license.beatId;
        return {
          id: license.id,
          title: isCustom ? license.serviceRequest?.projectTitle : license.beat?.title,
          producerName: isCustom 
            ? (license.serviceRequest?.producer.fullName || license.serviceRequest?.producer.username)
            : (license.beat?.producer.fullName || license.beat?.producer.username),
          imageUrl: isCustom ? null : license.beat?.imageUrl,
          licenseType: license.licenseType,
          amountPaid: license.amountPaid,
          transactionHash: license.transactionHash,
          licensedFileHash: license.licensedFileHash,
          createdAt: license.createdAt,
          isCustom,
          // Used to trigger the PDF generation dynamically
          rawAgreement: license 
        };
      });

      return NextResponse.json({ success: true, vault: formattedVault });
    } catch (error: any) {
      console.error("Vault Error:", error);
      return NextResponse.json({ error: "Failed to load Vault" }, { status: 500 });
    }
  });
}