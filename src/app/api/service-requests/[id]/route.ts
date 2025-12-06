import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/lib/api-middleware";
import { prisma } from "@/lib/prisma";

// PATCH /api/service-requests/[id] - Update service request status
export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  return withAuth(req, async (req) => {
    try {
      const user = req.user!;
      const { id } = params;
      const body = await req.json();
      const { status, producerResponse } = body;

      // Validate status
      const validStatuses = ["ACCEPTED", "REJECTED", "IN_PROGRESS", "COMPLETED", "CANCELLED"];
      if (status && !validStatuses.includes(status)) {
        return NextResponse.json(
          { error: "Invalid status" },
          { status: 400 }
        );
      }

      // Fetch the service request
      const serviceRequest = await prisma.serviceRequest.findUnique({
        where: { id },
        include: {
          client: {
            select: {
              id: true,
              username: true,
              fullName: true,
              avatar: true,
            },
          },
          producer: {
            select: {
              id: true,
              username: true,
              fullName: true,
              avatar: true,
            },
          },
        },
      });

      if (!serviceRequest) {
        return NextResponse.json(
          { error: "Service request not found" },
          { status: 404 }
        );
      }

      // Authorization: only producer can accept/reject, only client can cancel
      if (status === "CANCELLED" && serviceRequest.clientId !== user.id) {
        return NextResponse.json(
          { error: "Only the client can cancel the service request" },
          { status: 403 }
        );
      }

      if (
        (status === "ACCEPTED" || status === "REJECTED" || status === "IN_PROGRESS" || status === "COMPLETED") &&
        serviceRequest.producerId !== user.id
      ) {
        return NextResponse.json(
          { error: "Only the producer can update this service request" },
          { status: 403 }
        );
      }

      // Update the service request
      const updatedRequest = await prisma.serviceRequest.update({
        where: { id },
        data: {
          ...(status && { status }),
          ...(producerResponse && { producerResponse }),
          ...(status && (status === "ACCEPTED" || status === "REJECTED") && {
            respondedAt: new Date(),
          }),
        },
        include: {
          client: {
            select: {
              id: true,
              username: true,
              fullName: true,
              avatar: true,
            },
          },
          producer: {
            select: {
              id: true,
              username: true,
              fullName: true,
              avatar: true,
            },
          },
        },
      });

      // Create notification for the client based on status
      let notificationType: "JOB_ACCEPTED" | "JOB_REJECTED" | "JOB_UPDATED" = "JOB_UPDATED";
      let notificationMessage = "";

      if (status === "ACCEPTED") {
        notificationType = "JOB_ACCEPTED";
        notificationMessage = `${serviceRequest.producer.fullName || serviceRequest.producer.username} has accepted your service request for "${serviceRequest.projectTitle}"`;
      } else if (status === "REJECTED") {
        notificationType = "JOB_REJECTED";
        notificationMessage = `${serviceRequest.producer.fullName || serviceRequest.producer.username} has declined your service request for "${serviceRequest.projectTitle}"`;
      } else if (status === "IN_PROGRESS") {
        notificationMessage = `${serviceRequest.producer.fullName || serviceRequest.producer.username} has started working on "${serviceRequest.projectTitle}"`;
      } else if (status === "COMPLETED") {
        notificationMessage = `${serviceRequest.producer.fullName || serviceRequest.producer.username} has completed your project "${serviceRequest.projectTitle}"`;
      } else if (status === "CANCELLED") {
        notificationMessage = `Service request "${serviceRequest.projectTitle}" has been cancelled`;
      }

      if (notificationMessage) {
        // Notify the appropriate party
        const notifyUserId = status === "CANCELLED" ? serviceRequest.producerId : serviceRequest.clientId;

        await prisma.notification.create({
          data: {
            userId: notifyUserId,
            type: notificationType,
            title: status === "ACCEPTED" ? "Service Request Accepted" :
                   status === "REJECTED" ? "Service Request Declined" :
                   status === "IN_PROGRESS" ? "Work Started" :
                   status === "COMPLETED" ? "Project Completed" :
                   "Service Request Updated",
            message: notificationMessage,
            referenceId: id,
            referenceType: "SERVICE_REQUEST",
            isRead: false,
          },
        });
      }

      // Create activity log entry
      await prisma.activityLog.create({
        data: {
          userId: user.id,
          action: "SERVICE_REQUEST_UPDATED",
          details: `Updated service request status to ${status}`,
          metadata: {
            serviceRequestId: id,
            oldStatus: serviceRequest.status,
            newStatus: status,
            projectTitle: serviceRequest.projectTitle,
          },
        },
      });

      return NextResponse.json({
        serviceRequest: updatedRequest,
        message: "Service request updated successfully"
      });
    } catch (error: any) {
      console.error("Error updating service request:", error);
      return NextResponse.json(
        { error: "Failed to update service request" },
        { status: 500 }
      );
    }
  });
}

// GET /api/service-requests/[id] - Get single service request
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  return withAuth(req, async (req) => {
    try {
      const user = req.user!;
      const { id } = params;

      const serviceRequest = await prisma.serviceRequest.findUnique({
        where: { id },
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

      if (!serviceRequest) {
        return NextResponse.json(
          { error: "Service request not found" },
          { status: 404 }
        );
      }

      // Only client and producer can view the request
      if (serviceRequest.clientId !== user.id && serviceRequest.producerId !== user.id) {
        return NextResponse.json(
          { error: "You do not have permission to view this service request" },
          { status: 403 }
        );
      }

      return NextResponse.json({ serviceRequest });
    } catch (error: any) {
      console.error("Error fetching service request:", error);
      return NextResponse.json(
        { error: "Failed to fetch service request" },
        { status: 500 }
      );
    }
  });
}
