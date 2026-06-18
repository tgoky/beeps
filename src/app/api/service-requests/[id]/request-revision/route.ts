// beeps/src/app/api/service-requests/[id]/request-revision/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { withFullUser, withAuth } from "@/lib/api-middleware";

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  return withAuth(request, async (req) => {
    try {
      // `req.user` is automatically provided and verified by `withAuth`
      const dbUser = req.user!;
      const { id } = params;
      
      const body = await request.json();
      const { notes } = body;

      if (!notes || notes.trim().length < 5) {
        return NextResponse.json(
          { error: "Revision notes are too short. Please provide more detail." },
          { status: 400 }
        );
      }

      // 1. Fetch the service request
      const serviceRequest = await prisma.serviceRequest.findUnique({
        where: { id },
        include: {
          producer: true,
        },
      });

      if (!serviceRequest) {
        return NextResponse.json(
          { error: "Service request not found" },
          { status: 404 }
        );
      }

      // 2. STRICT RBAC CHECK: Only the Client can request revisions
      if (serviceRequest.clientId !== dbUser.id) {
        return NextResponse.json(
          { error: "Forbidden: Only the client can request revisions." },
          { status: 403 }
        );
      }

      // 3. STATE CHECK: Can only request revisions if currently DELIVERED
      if (serviceRequest.status !== "DELIVERED") {
        return NextResponse.json(
          { error: `Cannot request revision. Current status is ${serviceRequest.status}, expected DELIVERED.` },
          { status: 400 }
        );
      }

      // 4. Update the Service Request
      // Append the client's revision notes to the producerResponse field so the producer can read them.
      const updatedResponseText = serviceRequest.producerResponse 
        ? `${serviceRequest.producerResponse}\n\n--- Client Revision Request ---\n${notes}`
        : `--- Client Revision Request ---\n${notes}`;

      const updatedRequest = await prisma.serviceRequest.update({
        where: { id },
        data: {
          status: "IN_PROGRESS", // Kick it back to the producer
          autoReleaseAt: null,   // VERY IMPORTANT: Clear the auto-release timer!
          producerResponse: updatedResponseText,
          updatedAt: new Date(),
        },
      });

      // 5. Create a Notification for the Producer
      await prisma.notification.create({
        data: {
          userId: serviceRequest.producerId,
          type: "JOB_UPDATED",
          title: "Revision Requested",
          message: `The client has requested revisions on "${serviceRequest.projectTitle}". Please check the project notes.`,
          referenceId: serviceRequest.id,
          referenceType: "SERVICE_REQUEST",
        },
      });

      return NextResponse.json({ 
        success: true, 
        serviceRequest: updatedRequest 
      });

    } catch (error: any) {
      console.error("[REQUEST_REVISION_ERROR]", error);
      return NextResponse.json(
        { error: "Internal server error", details: error.message },
        { status: 500 }
      );
    }
  });
}