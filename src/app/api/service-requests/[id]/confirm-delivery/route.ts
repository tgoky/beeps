import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/lib/api-middleware";
import { prisma } from "@/lib/prisma";

// POST /api/service-requests/[id]/confirm-delivery
// Client enters the delivery code to confirm they received the work.
// This releases the escrowed payment to the producer (minus platform fee).
// Mirrors: artist entering confirmation code after studio check-in → session payment protected.
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  return withAuth(request, async (req) => {
    try {
      const user = req.user!;
      const { id } = params;
      const body = await req.json();
      const { deliveryCode } = body;

      if (!deliveryCode) {
        return NextResponse.json({ error: "Delivery code is required" }, { status: 400 });
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

      // Only the client can confirm delivery
      if (serviceRequest.clientId !== user.id) {
        return NextResponse.json({ error: "Only the client can confirm delivery" }, { status: 403 });
      }

      if (serviceRequest.status !== "DELIVERED") {
        return NextResponse.json(
          { error: "Cannot confirm delivery — the producer has not marked the work as delivered yet" },
          { status: 400 }
        );
      }

      if (serviceRequest.clientConfirmedDelivery) {
        return NextResponse.json({ error: "Delivery has already been confirmed" }, { status: 400 });
      }

      if (serviceRequest.paymentStatus !== "PAYMENT_HELD") {
        return NextResponse.json(
          { error: "Payment is not in escrow — nothing to release" },
          { status: 400 }
        );
      }

      // Block confirmation if there is an open dispute
      if (serviceRequest.disputeStatus === "OPEN" || serviceRequest.disputeStatus === "UNDER_REVIEW") {
        return NextResponse.json(
          { error: "Cannot confirm delivery while a dispute is open" },
          { status: 400 }
        );
      }

      // Validate the delivery code — same logic as QR code check-in in studio bookings
      if (!serviceRequest.deliveryCode || deliveryCode.trim() !== serviceRequest.deliveryCode) {
        return NextResponse.json(
          { error: "Invalid delivery code. Check your notification for the correct code from the producer." },
          { status: 400 }
        );
      }

      const totalAmount = parseFloat(serviceRequest.budget!.toString());
      const platformFee = parseFloat(serviceRequest.platformFee?.toString() || "0");
      const producerPayout = totalAmount - platformFee;

      // In production: Stripe capture + transfer to producer's connected account
      // await stripe.paymentIntents.capture(serviceRequest.paymentIntentId);
      // await stripe.transfers.create({ amount: producerPayout * 100, currency: 'usd', destination: producerStripeId });

      const updated = await prisma.serviceRequest.update({
        where: { id },
        data: {
          status: "COMPLETED",
          paymentStatus: "PAYMENT_RELEASED",
          clientConfirmedDelivery: true,
        },
      });

      // Update the transaction to COMPLETED
      await prisma.transaction.updateMany({
        where: { referenceId: id, referenceType: "SERVICE_REQUEST" },
        data: { status: "COMPLETED" },
      });

      // Notify producer that payment has been released
      await prisma.notification.create({
        data: {
          userId: serviceRequest.producerId,
          type: "PAYMENT_RELEASED",
          title: "Payment Released!",
          message: `${serviceRequest.client.fullName || serviceRequest.client.username} confirmed delivery of "${serviceRequest.projectTitle}". $${producerPayout.toFixed(2)} has been released to you (after ${(platformFee / totalAmount * 100).toFixed(0)}% platform fee).`,
          referenceId: id,
          referenceType: "SERVICE_REQUEST",
          isRead: false,
        },
      });

      // Confirm to client
      await prisma.notification.create({
        data: {
          userId: user.id,
          type: "PAYMENT_RELEASED",
          title: "Delivery Confirmed",
          message: `You confirmed delivery of "${serviceRequest.projectTitle}". Payment of $${producerPayout.toFixed(2)} has been released to the producer.`,
          referenceId: id,
          referenceType: "SERVICE_REQUEST",
          isRead: false,
        },
      });

      return NextResponse.json({
        success: true,
        serviceRequest: updated,
        payout: {
          totalAmount,
          platformFee,
          producerPayout,
        },
        message: "Delivery confirmed. Payment released to producer.",
      });
    } catch (error: any) {
      console.error("Error confirming delivery:", error);
      return NextResponse.json({ error: "Failed to confirm delivery" }, { status: 500 });
    }
  });
}