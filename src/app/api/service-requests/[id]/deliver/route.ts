import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/lib/api-middleware";
import { prisma } from "@/lib/prisma";

// POST /api/service-requests/[id]/deliver
// Producer marks work as delivered, providing the URL to the files.
// The delivery code is then sent to the client to confirm receipt.
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  return withAuth(request, async (req) => {
    try {
      const user = req.user!;
      const { id } = params;
      const body = await req.json().catch(() => ({}));
      
      // Extract the new URL and notes fields
      const { deliveryUrl, deliveryNotes } = body;

      if (!deliveryUrl) {
        return NextResponse.json({ error: "A delivery URL (e.g., WeTransfer or Google Drive link) is required." }, { status: 400 });
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

      // Only the producer can mark as delivered
      if (serviceRequest.producerId !== user.id) {
        return NextResponse.json({ error: "Only the producer can mark work as delivered" }, { status: 403 });
      }

      // Payment must be held in escrow before delivery can be confirmed
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

      // 48-hour auto-release window: if client doesn't confirm, payment auto-releases
      const autoReleaseAt = new Date(Date.now() + 48 * 60 * 60 * 1000);

      const updated = await prisma.serviceRequest.update({
        where: { id },
        data: {
          status: "DELIVERED",
          deliveredAt: new Date(),
          autoReleaseAt,
          deliveryUrl, // Save the new explicit URL field
          deliveryNotes, 
          producerResponse: deliveryNotes, // Maintain backward compatibility
        },
      });

      // Send the delivery code to the CLIENT via notification
      await prisma.notification.create({
        data: {
          userId: serviceRequest.clientId,
          type: "WORK_DELIVERED",
          title: "Work Delivered — Action Required",
          message: `${serviceRequest.producer.fullName || serviceRequest.producer.username} has delivered the files for "${serviceRequest.projectTitle}". Check your active jobs to download the files. Your delivery confirmation code is: ${serviceRequest.deliveryCode}. Please confirm receipt to release the payment.`,
          referenceId: id,
          referenceType: "SERVICE_REQUEST",
          isRead: false,
        },
      });

      // Notify PRODUCER that it was logged successfully
      await prisma.notification.create({
        data: {
          userId: serviceRequest.producerId,
          type: "WORK_DELIVERED",
          title: "Delivery Successfully Logged",
          message: `Your files for "${serviceRequest.projectTitle}" have been sent. The client has 48 hours to confirm receipt and release funds, otherwise they will auto-release.`,
          referenceId: id,
          referenceType: "SERVICE_REQUEST",
          isRead: false,
        },
      });

      return NextResponse.json({
        success: true,
        serviceRequest: updated,
        autoReleaseAt,
        message: "Delivery logged. The client has been notified to download the files and confirm.",
      });
    } catch (error: any) {
      console.error("Error marking delivery:", error);
      return NextResponse.json({ error: "Failed to mark as delivered" }, { status: 500 });
    }
  });
}