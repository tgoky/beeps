import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/lib/api-middleware";
import { prisma } from "@/lib/prisma";
import crypto from "crypto";

// GET /api/service-requests - Fetch service requests
export async function GET(req: NextRequest) {
  return withAuth(req, async (req) => {
    try {
      const user = req.user!;
      const { searchParams } = new URL(req.url);
      const status = searchParams.get("status");
      const asProducer = searchParams.get("asProducer") === "true";

      let where: any = {};

      if (asProducer) {
        // Fetch service requests received by the producer
        where = {
          producerId: user.id,
        };
      } else {
        // Fetch service requests made by the user
        where = {
          clientId: user.id,
        };
      }

      if (status) {
        where.status = status;
      }

      const serviceRequests = await prisma.serviceRequest.findMany({
        where,
        include: {
          client: {
            select: {
              id: true,
              username: true,
              fullName: true,
              avatar: true,
              primaryRole: true,
            },
          },
          producer: {
            select: {
              id: true,
              username: true,
              fullName: true,
              avatar: true,
              primaryRole: true,
            },
          },
        },
        orderBy: {
          createdAt: "desc",
        },
      });

      return NextResponse.json({ serviceRequests });
    } catch (error: any) {
      console.error("Error fetching service requests:", error);
      return NextResponse.json(
        { error: "Failed to fetch service requests" },
        { status: 500 }
      );
    }
  });
}

// POST /api/service-requests - Create a service request
export async function POST(req: NextRequest) {
  return withAuth(req, async (req) => {
    try {
      const user = req.user!;
      const permissions = req.permissions!;

      // Check if user has permission to request producer services
      if (!permissions.canRequestProducerService) {
        return NextResponse.json(
          { error: "You do not have permission to request producer services" },
          { status: 403 }
        );
      }

      const body = await req.json();
      const {
        producerId,
        projectTitle,
        projectDescription,
        budget,
        deadline
      } = body;

      // Validate required fields
      if (!producerId || !projectTitle || !projectDescription) {
        return NextResponse.json(
          { error: "Missing required fields: producerId, projectTitle, projectDescription" },
          { status: 400 }
        );
      }

      // Verify producer exists and has a producer profile
      const producer = await prisma.user.findUnique({
        where: { id: producerId },
        include: {
          producerProfile: true,
        },
      });

      if (!producer) {
        return NextResponse.json(
          { error: "Producer not found" },
          { status: 404 }
        );
      }

      if (!producer.producerProfile) {
        return NextResponse.json(
          { error: "User is not a producer" },
          { status: 400 }
        );
      }

      // Prevent users from requesting their own services
      if (producerId === user.id) {
        return NextResponse.json(
          { error: "You cannot request services from yourself" },
          { status: 400 }
        );
      }

      // Generate a 6-digit OTP for 2FA verification
      const otpCode = crypto.randomInt(100000, 999999).toString();
      const otpExpiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

      // Create the service request (NOT notifying producer yet - pending 2FA)
      const serviceRequest = await prisma.serviceRequest.create({
        data: {
          clientId: user.id,
          producerId,
          projectTitle,
          projectDescription,
          budget: budget ? parseFloat(budget) : null,
          deadline: deadline ? new Date(deadline) : null,
          status: "PENDING",
          otpCode,
          otpExpiresAt,
          otpVerified: false,
        },
        include: {
          client: {
            select: {
              id: true,
              username: true,
              fullName: true,
              avatar: true,
              primaryRole: true,
            },
          },
          producer: {
            select: {
              id: true,
              username: true,
              fullName: true,
              avatar: true,
              primaryRole: true,
            },
          },
        },
      });

      // Send OTP to the CLIENT via notification (2FA gate before producer is notified)
      await prisma.notification.create({
        data: {
          userId: user.id,
          type: "OTP_VERIFICATION",
          title: "Verify Your Booking Request",
          message: `Your verification code for booking "${projectTitle}" is: ${otpCode}. This code expires in 10 minutes. Do not share this code.`,
          referenceId: serviceRequest.id,
          referenceType: "SERVICE_REQUEST",
          isRead: false,
        },
      });

      return NextResponse.json({
        serviceRequest: {
          id: serviceRequest.id,
          projectTitle: serviceRequest.projectTitle,
          producerId: serviceRequest.producerId,
          status: serviceRequest.status,
          otpVerified: serviceRequest.otpVerified,
          createdAt: serviceRequest.createdAt,
        },
        requiresVerification: true,
        otpExpiresAt,
        message: "Service request created. Please verify with the OTP sent to your notifications.",
      }, { status: 201 });
    } catch (error: any) {
      console.error("Error creating service request:", error);
      return NextResponse.json(
        { error: "Failed to create service request" },
        { status: 500 }
      );
    }
  });
}
