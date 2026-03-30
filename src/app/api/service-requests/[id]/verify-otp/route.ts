import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/lib/api-middleware";
import { prisma } from "@/lib/prisma";

// POST /api/service-requests/[id]/verify-otp
// 2FA gate: client must verify OTP before producer is notified of the booking request
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  return withAuth(request, async (req) => {
    try {
      const user = req.user!;
      const { id } = params;
      const body = await req.json();
      const { otpCode } = body;

      if (!otpCode) {
        return NextResponse.json(
          { error: "OTP code is required" },
          { status: 400 }
        );
      }

      const serviceRequest = await prisma.serviceRequest.findUnique({
        where: { id },
        include: {
          client: {
            select: { id: true, username: true, fullName: true },
          },
          producer: {
            select: { id: true, username: true, fullName: true },
          },
        },
      });

      if (!serviceRequest) {
        return NextResponse.json(
          { error: "Service request not found" },
          { status: 404 }
        );
      }

      // Only the client who created the request can verify it
      if (serviceRequest.clientId !== user.id) {
        return NextResponse.json(
          { error: "You are not authorised to verify this request" },
          { status: 403 }
        );
      }

      if (serviceRequest.otpVerified) {
        return NextResponse.json(
          { error: "This request has already been verified" },
          { status: 400 }
        );
      }

      if (!serviceRequest.otpCode || !serviceRequest.otpExpiresAt) {
        return NextResponse.json(
          { error: "No verification code found for this request" },
          { status: 400 }
        );
      }

      // Check expiry
      if (new Date() > serviceRequest.otpExpiresAt) {
        return NextResponse.json(
          { error: "Verification code has expired. Please create a new booking request." },
          { status: 400 }
        );
      }

      // Validate OTP
      if (otpCode.trim() !== serviceRequest.otpCode) {
        return NextResponse.json(
          { error: "Invalid verification code. Please check your notifications and try again." },
          { status: 400 }
        );
      }

      // Mark as verified, clear OTP for security
      const updatedRequest = await prisma.serviceRequest.update({
        where: { id },
        data: {
          otpVerified: true,
          otpCode: null,
          otpExpiresAt: null,
        },
      });

      // NOW notify the producer — OTP gate has been passed
      await prisma.notification.create({
        data: {
          userId: serviceRequest.producerId,
          type: "JOB_REQUEST",
          title: "New Service Request",
          message: `${serviceRequest.client.fullName || serviceRequest.client.username} has requested your services for "${serviceRequest.projectTitle}"`,
          referenceId: serviceRequest.id,
          referenceType: "SERVICE_REQUEST",
          isRead: false,
        },
      });

      // Activity log
      await prisma.activity.create({
        data: {
          userId: user.id,
          type: "JOB_REQUEST_SENT",
          title: "Service Request Sent",
          description: `Verified and sent booking request to ${serviceRequest.producer.fullName || serviceRequest.producer.username} for project: ${serviceRequest.projectTitle}`,
          referenceId: serviceRequest.id,
          referenceType: "SERVICE_REQUEST",
        },
      });

      // Confirm to client
      await prisma.notification.create({
        data: {
          userId: user.id,
          type: "SERVICE_REQUEST_CONFIRMED",
          title: "Booking Request Sent",
          message: `Your booking request for "${serviceRequest.projectTitle}" has been verified and sent to the producer. You will be notified when they respond.`,
          referenceId: serviceRequest.id,
          referenceType: "SERVICE_REQUEST",
          isRead: false,
        },
      });

      return NextResponse.json({
        success: true,
        serviceRequest: updatedRequest,
        message: "Verification successful. Your booking request has been sent to the producer.",
      });
    } catch (error: any) {
      console.error("Error verifying OTP:", error);
      return NextResponse.json(
        { error: "Failed to verify code" },
        { status: 500 }
      );
    }
  });
}
