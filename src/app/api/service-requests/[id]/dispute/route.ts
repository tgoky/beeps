import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/lib/api-middleware";
import { prisma } from "@/lib/prisma";

// POST /api/service-requests/[id]/dispute
// Either party can raise a dispute within 48 hours of delivery.
// Freezes payment — cannot confirm delivery while dispute is open.
// Admin resolves via PATCH.
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  return withAuth(request, async (req) => {
    try {
      const user = req.user!;
      const { id } = params;
      const body = await req.json();
      const { reason } = body;

      if (!reason || reason.trim().length < 10) {
        return NextResponse.json(
          { error: "Please provide a detailed reason for the dispute (at least 10 characters)" },
          { status: 400 }
        );
      }

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

      const isClient = serviceRequest.clientId === user.id;
      const isProducer = serviceRequest.producerId === user.id;

      if (!isClient && !isProducer) {
        return NextResponse.json({ error: "You are not a party to this service request" }, { status: 403 });
      }

      // Can only dispute after delivery
      if (serviceRequest.status !== "DELIVERED") {
        return NextResponse.json(
          { error: "Disputes can only be raised after the producer has marked work as delivered" },
          { status: 400 }
        );
      }

      if (serviceRequest.paymentStatus !== "PAYMENT_HELD") {
        return NextResponse.json(
          { error: "Cannot dispute — payment is not held in escrow" },
          { status: 400 }
        );
      }

      if (serviceRequest.disputeStatus === "OPEN" || serviceRequest.disputeStatus === "UNDER_REVIEW") {
        return NextResponse.json({ error: "A dispute is already open for this request" }, { status: 400 });
      }

      // Check 48-hour dispute window from delivery time
      if (serviceRequest.deliveredAt) {
        const disputeWindowEnd = new Date(serviceRequest.deliveredAt.getTime() + 48 * 60 * 60 * 1000);
        if (new Date() > disputeWindowEnd) {
          return NextResponse.json(
            { error: "The 48-hour dispute window has closed. Payment will auto-release shortly." },
            { status: 400 }
          );
        }
      }

      const updated = await prisma.serviceRequest.update({
        where: { id },
        data: {
          disputeStatus: "OPEN",
          disputeReason: reason.trim(),
          disputedAt: new Date(),
        },
      });

      const disputingParty = isClient
        ? serviceRequest.client.fullName || serviceRequest.client.username
        : serviceRequest.producer.fullName || serviceRequest.producer.username;

      const otherPartyId = isClient ? serviceRequest.producerId : serviceRequest.clientId;

      // Notify the other party
      await prisma.notification.create({
        data: {
          userId: otherPartyId,
          type: "DISPUTE_OPENED",
          title: "Dispute Opened",
          message: `${disputingParty} has raised a dispute on "${serviceRequest.projectTitle}". Payment is frozen pending admin review. Reason: "${reason.trim()}"`,
          referenceId: id,
          referenceType: "SERVICE_REQUEST",
          isRead: false,
        },
      });

      // Confirm to disputing party
      await prisma.notification.create({
        data: {
          userId: user.id,
          type: "DISPUTE_OPENED",
          title: "Dispute Submitted",
          message: `Your dispute for "${serviceRequest.projectTitle}" has been submitted. Payment is frozen while our team reviews the case.`,
          referenceId: id,
          referenceType: "SERVICE_REQUEST",
          isRead: false,
        },
      });

      return NextResponse.json({
        success: true,
        serviceRequest: updated,
        message: "Dispute raised. Payment frozen pending review.",
      });
    } catch (error: any) {
      console.error("Error raising dispute:", error);
      return NextResponse.json({ error: "Failed to raise dispute" }, { status: 500 });
    }
  });
}
