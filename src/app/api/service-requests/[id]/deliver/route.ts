import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/lib/api-middleware";
import { prisma } from "@/lib/prisma";

// POST /api/service-requests/[id]/deliver
// Producer marks work as delivered and the delivery code is sent to the client.
// This mirrors the studio check-in: studio owner scans QR → confirmation code sent to artist.
// Here: producer clicks "Mark Delivered" → delivery code sent to client via notification.
// Client must enter that code to confirm receipt and release the escrowed payment.
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  return withAuth(request, async (req) => {
    try {
      const user = req.user!;
      const { id } = params;
      const body = await req.json().catch(() => ({}));
      const { deliveryNotes } = body;

      const serviceRequest = await prisma.serviceRequest.findUnique({
        where: { id },
        include: {
          client: { select: { id: true, username: true, fullName: true } },
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
          { error: "Cannot mark as delivered — client payment has not been secured yet" },
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
          { error: "No delivery code found — this is a system error, please contact support" },
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
          ...(deliveryNotes && { producerResponse: deliveryNotes }),
        },
      });

      // Send the delivery code to the CLIENT via notification
      // This is the equivalent of the confirmation code sent to the artist at studio check-in
      await prisma.notification.create({
        data: {
          userId: serviceRequest.clientId,
          type: "WORK_DELIVERED",
          title: "Work Delivered — Confirm to Release Payment",
          message: `${serviceRequest.producer.fullName || serviceRequest.producer.username} has delivered "${serviceRequest.projectTitle}". Your delivery confirmation code is: ${serviceRequest.deliveryCode}. Enter this code to confirm receipt and release payment. If you don't confirm within 48 hours, payment will auto-release.`,
          referenceId: id,
          referenceType: "SERVICE_REQUEST",
          isRead: false,
        },
      });

      // Notify producer that the delivery has been logged
      await prisma.notification.create({
        data: {
          userId: serviceRequest.producerId,
          type: "WORK_DELIVERED",
          title: "Delivery Logged",
          message: `Your delivery for "${serviceRequest.projectTitle}" has been logged. The client has been sent the confirmation code. Payment will release once they confirm, or automatically after 48 hours.`,
          referenceId: id,
          referenceType: "SERVICE_REQUEST",
          isRead: false,
        },
      });

      return NextResponse.json({
        success: true,
        serviceRequest: updated,
        autoReleaseAt,
        message: "Delivery logged. Client has received the confirmation code.",
      });
    } catch (error: any) {
      console.error("Error marking delivery:", error);
      return NextResponse.json({ error: "Failed to mark as delivered" }, { status: 500 });
    }
  });
}