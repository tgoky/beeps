import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/lib/api-middleware";
import { prisma } from "@/lib/prisma";

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

      // Create the service request
      const serviceRequest = await prisma.serviceRequest.create({
        data: {
          clientId: user.id,
          producerId,
          projectTitle,
          projectDescription,
          budget: budget ? parseFloat(budget) : null,
          deadline: deadline ? new Date(deadline) : null,
          status: "PENDING",
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

      // Create notification for the producer
      await prisma.notification.create({
        data: {
          userId: producerId,
          type: "JOB_REQUEST",
          title: "New Service Request",
          message: `${user.fullName || user.username} has requested your services for "${projectTitle}"`,
          referenceId: serviceRequest.id,
          referenceType: "SERVICE_REQUEST",
          isRead: false,
        },
      });

      // Create activity log entry
      await prisma.activity.create({
        data: {
          userId: user.id,
          type: "JOB_REQUEST_SENT",
          title: "Service Request Sent",
          description: `Requested services from ${producer.fullName || producer.username} for project: ${projectTitle}`,
          referenceId: serviceRequest.id,
          referenceType: "SERVICE_REQUEST",
        },
      });

      return NextResponse.json({
        serviceRequest,
        message: "Service request sent successfully"
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
