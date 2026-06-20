import { NextRequest, NextResponse } from "next/server";
import { withAuth, type AuthenticatedRequest } from "@/lib/api-middleware";
import { prisma } from "@/lib/prisma";
import { identifyAudio } from "@/lib/acrcloud";
import { S3Client, GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

const r2 = new S3Client({
  region: "auto",
  endpoint: process.env.CLOUDFLARE_R2_ENDPOINT!,
  credentials: {
    accessKeyId: process.env.CLOUDFLARE_R2_ACCESS_KEY_ID!,
    secretAccessKey: process.env.CLOUDFLARE_R2_SECRET_ACCESS_KEY!,
  },
});

// ✅ FIX: TS strict-mode compliant signature
async function identifyAudioWithTimeout(
  url: string, 
  ms = 10_000
): Promise<{ isMatch: boolean; matchData?: string | null; timedOut?: boolean; error?: unknown }> {
  return Promise.race([
    identifyAudio(url),
    new Promise<{ isMatch: boolean; timedOut: boolean }>((resolve) =>
      setTimeout(() => resolve({ isMatch: false, timedOut: true }), ms)
    ),
  ]);
}

// POST /api/service-requests/[id]/deliver
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  return withAuth(request, async (req: AuthenticatedRequest) => {
    try {
      const user = req.user!;
      const { id } = params;
      const body = await request.json().catch(() => ({}));
      
      const { deliveryFileKey, fileHash, deliveryNotes } = body;

      if (!deliveryFileKey) {
        return NextResponse.json({ error: "A delivery file is required." }, { status: 400 });
      }

      const serviceRequest = await prisma.serviceRequest.findUnique({
        where: { id },
        include: {
          client: { select: { id: true, username: true, fullName: true, email: true } },
          producer: { select: { id: true, username: true, fullName: true } },
        },
      });

      if (!serviceRequest) {
        return NextResponse.json({ error: "Service request not found" }, { status: 404 });
      }

      if (serviceRequest.producerId !== user.id) {
        return NextResponse.json({ error: "Only the producer can mark work as delivered" }, { status: 403 });
      }

      if (serviceRequest.paymentStatus !== "PAYMENT_HELD") {
        return NextResponse.json(
          { error: "Cannot deliver — client payment has not been secured in escrow yet" },
          { status: 400 }
        );
      }

      if (serviceRequest.status !== "IN_PROGRESS") {
        return NextResponse.json(
          { error: `Cannot deliver from status: ${serviceRequest.status}` },
          { status: 400 }
        );
      }

      if (!serviceRequest.deliveryCode) {
        return NextResponse.json(
          { error: "No delivery code found — system error, please contact support" },
          { status: 500 }
        );
      }

      if (fileHash) {
        const existingExclusive = await prisma.licenseAgreement.findFirst({
          where: { licensedFileHash: fileHash, licenseType: "EXCLUSIVE" }
        });
        if (existingExclusive) {
          return NextResponse.json(
            { error: "GATE 2 BLOCKED: You cannot deliver an audio file that was already sold as an Exclusive License on Beeps." }, 
            { status: 403 }
          );
        }
      }

      const command = new GetObjectCommand({ 
        Bucket: process.env.R2_BUCKET_NAME!, 
        Key: deliveryFileKey 
      });
      const tempAudioUrl = await getSignedUrl(r2, command, { expiresIn: 300 });
      
      const acrResult = await identifyAudioWithTimeout(tempAudioUrl);
      
      if (acrResult.timedOut) {
        console.warn("[Beeps Shield] ACRCloud check timed out — proceeding without verification, flag for manual review.");
        
        // ✅ FIX: Log silently to the Activity table for Admins, do NOT notify the producer
        await prisma.activity.create({
          data: {
            userId: serviceRequest.producerId,
            type: "UPLOAD",
            title: "ACRCloud Timeout - Manual Review Needed",
            description: `Delivery for "${serviceRequest.projectTitle}" bypassed copyright check due to timeout.`,
            referenceId: id,
            referenceType: "SERVICE_REQUEST",
          },
        });
      } else if (acrResult.isMatch) {
        return NextResponse.json(
          { error: `GATE 1 BLOCKED: Beeps Shield detected uncleared copyrighted material ("${acrResult.matchData}").` }, 
          { status: 403 }
        );
      }

      const autoReleaseAt = new Date(Date.now() + 48 * 60 * 60 * 1000);

      const updated = await prisma.serviceRequest.update({
        where: { id },
        data: {
          status: "DELIVERED",
          deliveredAt: new Date(),
          autoReleaseAt,
          deliveryUrl: deliveryFileKey,
          deliveryNotes, 
          producerResponse: deliveryNotes,
        },
      });

      // ✅ FIX: Parallelize notifications to avoid sequential round-trips
      await Promise.all([
        prisma.notification.create({
          data: {
            userId: serviceRequest.clientId,
            type: "WORK_DELIVERED",
            title: "Work Delivered — Action Required",
            message: `${serviceRequest.producer.fullName || serviceRequest.producer.username} has delivered the files for "${serviceRequest.projectTitle}". Check your active jobs to download the files. Your delivery confirmation code is: ${serviceRequest.deliveryCode}. Please confirm receipt to release the payment.`,
            referenceId: id,
            referenceType: "SERVICE_REQUEST",
            isRead: false,
          },
        }),
        prisma.notification.create({
          data: {
            userId: serviceRequest.producerId,
            type: "WORK_DELIVERED",
            title: "Delivery Successfully Logged",
            message: `Your files for "${serviceRequest.projectTitle}" have been securely uploaded to the Beeps Vault. The client has 48 hours to confirm receipt and release funds.`,
            referenceId: id,
            referenceType: "SERVICE_REQUEST",
            isRead: false,
          },
        })
      ]);

      return NextResponse.json({
        success: true,
        serviceRequest: updated,
        autoReleaseAt,
        message: "Delivery logged and protected by Beeps Shield. The client has been notified.",
      });

    } catch (error: any) {
      console.error("Error marking delivery:", error);
      return NextResponse.json(
        { error: "Failed to mark as delivered" }, 
        { status: 500 }
      );
    }
  });
}