import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/lib/api-middleware";
import { prisma } from "@/lib/prisma";
import crypto from "crypto";

// POST /api/service-requests/[id]/pay
// Client pays after producer accepts → funds held in escrow
// Generates a unique delivery code (like the QR code in studio bookings)
// The delivery code is stored but NOT revealed until the producer marks work as delivered
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  return withAuth(request, async (req) => {
    try {
      const user = req.user!;
      const { id } = params;

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

      // Only the client can pay
      if (serviceRequest.clientId !== user.id) {
        return NextResponse.json({ error: "Only the client can pay for this request" }, { status: 403 });
      }

      // Must be ACCEPTED before payment
      if (serviceRequest.status !== "ACCEPTED") {
        return NextResponse.json(
          { error: `Cannot pay for a request with status: ${serviceRequest.status}. Producer must accept first.` },
          { status: 400 }
        );
      }

      if (serviceRequest.paymentStatus !== "UNPAID") {
        return NextResponse.json({ error: "Payment has already been processed for this request" }, { status: 400 });
      }

      if (!serviceRequest.budget) {
        return NextResponse.json({ error: "No budget set on this request — agree on a price first" }, { status: 400 });
      }

      const totalAmount = parseFloat(serviceRequest.budget.toString());
      const platformFee = Math.round(totalAmount * 0.10 * 100) / 100;

      // Generate a unique delivery code (producer will share this with the client when work is done)
      // Acts like the QR code in studio bookings
      const deliveryCode = `BEEPS-DEL-${serviceRequest.id.slice(0, 8).toUpperCase()}-${crypto.randomBytes(4).toString("hex").toUpperCase()}`;

      // Simulate Stripe PaymentIntent with capture_method: manual (escrow hold)
      const simulatedPaymentIntentId = `pi_simulated_${crypto.randomBytes(12).toString("hex")}`;

      const updated = await prisma.serviceRequest.update({
        where: { id },
        data: {
          paymentStatus: "PAYMENT_HELD",
          paymentIntentId: simulatedPaymentIntentId,
          platformFee,
          deliveryCode,
          status: "IN_PROGRESS", // Move to in-progress once paid
        },
      });

      // Create transaction record
      await prisma.transaction.create({
        data: {
          userId: user.id,
          type: "SERVICE_PAYMENT",
          status: "PENDING",
          amount: totalAmount,
          referenceId: id,
          referenceType: "SERVICE_REQUEST",
          paymentMethod: "card",
        },
      });

      // Notify producer that payment is secured — they can start work
      await prisma.notification.create({
        data: {
          userId: serviceRequest.producerId,
          type: "PAYMENT_HELD",
          title: "Payment Secured — Start Working!",
          message: `${serviceRequest.client.fullName || serviceRequest.client.username} has paid $${totalAmount.toFixed(2)} for "${serviceRequest.projectTitle}". Funds are held in escrow. Deliver your work and mark it as delivered to receive payment.`,
          referenceId: id,
          referenceType: "SERVICE_REQUEST",
          isRead: false,
        },
      });

      // Notify client that payment is held
      await prisma.notification.create({
        data: {
          userId: user.id,
          type: "PAYMENT_HELD",
          title: "Payment Secured",
          message: `Your $${totalAmount.toFixed(2)} payment for "${serviceRequest.projectTitle}" is held securely in escrow. It will only be released when you confirm the producer's delivery.`,
          referenceId: id,
          referenceType: "SERVICE_REQUEST",
          isRead: false,
        },
      });

      return NextResponse.json({
        success: true,
        serviceRequest: updated,
        escrow: {
          totalAmount,
          platformFee,
          producerPayout: totalAmount - platformFee,
        },
        message: "Payment held in escrow. Funds release only when you confirm delivery.",
      });
    } catch (error: any) {
      console.error("Error processing service payment:", error);
      return NextResponse.json({ error: "Failed to process payment" }, { status: 500 });
    }
  });
}
