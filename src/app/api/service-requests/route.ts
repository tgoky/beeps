import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/lib/api-middleware";
import { prisma } from "@/lib/prisma";

// GET /api/service-requests
export async function GET(req: NextRequest) {
  return withAuth(req, async (req) => {
    try {
      const user = req.user!;
      const { searchParams } = new URL(req.url);
      const status = searchParams.get("status");
      const asProducer = searchParams.get("asProducer") === "true";
      const view = searchParams.get("view");

      // Check both query formats to be safe
      const isProviderView = asProducer || view === "provider";

      const where: any = isProviderView 
        ? { producerId: user.id } 
        : { clientId: user.id };

      if (status && status !== "all") {
        where.status = status.toUpperCase();
      }

      const serviceRequests = await prisma.serviceRequest.findMany({
        where,
        include: {
          client: { select: { id: true, username: true, fullName: true, avatar: true, primaryRole: true } },
          producer: { select: { id: true, username: true, fullName: true, avatar: true, primaryRole: true } },
        },
        orderBy: { createdAt: "desc" },
      });

      return NextResponse.json({ serviceRequests });
    } catch (error: any) {
      console.error("Error fetching service requests:", error);
      return NextResponse.json({ error: "Failed to fetch service requests" }, { status: 500 });
    }
  });
}

// POST /api/service-requests - Create a service request
export async function POST(req: NextRequest) {
  return withAuth(req, async (req) => {
    try {
      const user = req.user!;
      const permissions = req.permissions;

      // Safe permission check (prevents TypeError crash if permissions is undefined)
      if (permissions && permissions.canRequestProducerService === false) {
        return NextResponse.json({ error: "You do not have permission to request producer services" }, { status: 403 });
      }

      const body = await req.json();
      const { producerId, projectTitle, projectDescription, budget, deadline } = body;

      if (!producerId || !projectTitle || !projectDescription) {
        return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
      }

      if (producerId === user.id) {
        return NextResponse.json({ error: "You cannot request services from yourself" }, { status: 400 });
      }

      // Safe Budget Parsing (Strips $ and commas so Prisma doesn't crash)
      let parsedBudget = null;
      if (budget) {
        const cleanBudget = budget.toString().replace(/[^0-9.]/g, '');
        parsedBudget = parseFloat(cleanBudget);
        if (isNaN(parsedBudget)) parsedBudget = null;
      }

      // Ensure we have the actual User ID (in case frontend passed the ProducerProfile ID)
      let resolvedProducerId = producerId;
      const producerCheck = await prisma.user.findUnique({ where: { id: resolvedProducerId } });
      
      if (!producerCheck) {
        const profileCheck = await prisma.producerProfile.findUnique({ 
          where: { id: resolvedProducerId }, include: { user: true } 
        });
        if (profileCheck) {
          resolvedProducerId = profileCheck.user.id;
        } else {
          return NextResponse.json({ error: "Producer not found" }, { status: 404 });
        }
      }

      // Create the service request
      const serviceRequest = await prisma.serviceRequest.create({
        data: {
          clientId: user.id,
          producerId: resolvedProducerId,
          projectTitle,
          projectDescription,
          budget: parsedBudget,
          deadline: deadline ? new Date(deadline) : null,
          status: "PENDING",
          paymentStatus: "UNPAID",
        },
        include: {
          client: { select: { id: true, username: true, fullName: true, avatar: true } },
          producer: { select: { id: true, username: true, fullName: true, avatar: true } },
        },
      });

      // Notifications
      await prisma.notification.create({
        data: {
          userId: resolvedProducerId,
          type: "JOB_REQUEST",
          title: "New Service Request",
          message: `${user.fullName || user.username} has requested your services for "${projectTitle}"`,
          referenceId: serviceRequest.id,
          referenceType: "SERVICE_REQUEST",
          isRead: false,
        },
      });

      await prisma.activity.create({
        data: {
          userId: user.id,
          type: "JOB_REQUEST_SENT",
          title: "Service Request Sent",
          description: `Requested services for project: ${projectTitle}`,
          referenceId: serviceRequest.id,
          referenceType: "SERVICE_REQUEST",
        },
      });

      return NextResponse.json({ serviceRequest, message: "Service request sent successfully" }, { status: 201 });
    } catch (error: any) {
      console.error("Error creating service request:", error);
      return NextResponse.json({ error: "Failed to create service request" }, { status: 500 });
    }
  });
}