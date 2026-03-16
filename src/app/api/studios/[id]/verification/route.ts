import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/lib/api-middleware";
import { prisma } from "@/lib/prisma";

// POST /api/studios/[id]/verification - Request verification for a studio
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  return withAuth(request, async (req) => {
    try {
      const user = req.user!;
      const { id } = params;
      const body = await req.json();
      const { documents } = body;

      // Fetch the studio and verify ownership
      const studio = await prisma.studio.findUnique({
        where: { id },
        include: {
          owner: {
            include: {
              user: {
                select: { id: true },
              },
            },
          },
        },
      });

      if (!studio) {
        return NextResponse.json(
          { error: "Studio not found" },
          { status: 404 }
        );
      }

      if (studio.owner.user.id !== user.id) {
        return NextResponse.json(
          { error: "You can only request verification for your own studio" },
          { status: 403 }
        );
      }

      if (studio.verificationStatus === "VERIFIED") {
        return NextResponse.json(
          { error: "Studio is already verified" },
          { status: 400 }
        );
      }

      if (studio.verificationStatus === "PENDING") {
        return NextResponse.json(
          { error: "Verification is already pending" },
          { status: 400 }
        );
      }

      // Update studio verification status
      const updatedStudio = await prisma.studio.update({
        where: { id },
        data: {
          verificationStatus: "PENDING",
          verificationDocuments: documents || [],
          verificationRequestedAt: new Date(),
          verificationNotes: null,
        },
      });

      // Create notification for the studio owner
      await prisma.notification.create({
        data: {
          userId: user.id,
          type: "STUDIO_VERIFICATION_SUBMITTED",
          title: "Verification Request Submitted",
          message: `Your verification request for "${studio.name}" has been submitted and is under review.`,
          referenceId: studio.id,
          referenceType: "studio",
        },
      });

      return NextResponse.json({
        success: true,
        studio: updatedStudio,
        message: "Verification request submitted successfully",
      });
    } catch (error: any) {
      console.error("Error requesting verification:", error);
      return NextResponse.json(
        { error: "Failed to submit verification request" },
        { status: 500 }
      );
    }
  });
}

// GET /api/studios/[id]/verification - Get verification status
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    const studio = await prisma.studio.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        verificationStatus: true,
        verificationNotes: true,
        verifiedAt: true,
        verificationRequestedAt: true,
      },
    });

    if (!studio) {
      return NextResponse.json(
        { error: "Studio not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ verification: studio });
  } catch (error: any) {
    console.error("Error fetching verification:", error);
    return NextResponse.json(
      { error: "Failed to fetch verification status" },
      { status: 500 }
    );
  }
}

// PATCH /api/studios/[id]/verification - Admin approve/reject verification
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  return withAuth(request, async (req) => {
    try {
      const user = req.user!;
      const { id } = params;
      const body = await req.json();
      const { action, notes } = body;

      // Only allow admin actions (check user role or admin flag)
      // For now, we'll check if the user is verified (admin-level)
      if (!user.verified) {
        return NextResponse.json(
          { error: "Admin access required" },
          { status: 403 }
        );
      }

      if (!action || !["approve", "reject"].includes(action)) {
        return NextResponse.json(
          { error: "Action must be 'approve' or 'reject'" },
          { status: 400 }
        );
      }

      const studio = await prisma.studio.findUnique({
        where: { id },
        include: {
          owner: {
            include: {
              user: {
                select: { id: true },
              },
            },
          },
        },
      });

      if (!studio) {
        return NextResponse.json(
          { error: "Studio not found" },
          { status: 404 }
        );
      }

      if (studio.verificationStatus !== "PENDING") {
        return NextResponse.json(
          { error: "Studio verification is not pending" },
          { status: 400 }
        );
      }

      const isApproval = action === "approve";

      const updatedStudio = await prisma.studio.update({
        where: { id },
        data: {
          verificationStatus: isApproval ? "VERIFIED" : "REJECTED",
          verificationNotes: notes || null,
          verifiedAt: isApproval ? new Date() : null,
        },
      });

      // Notify studio owner
      await prisma.notification.create({
        data: {
          userId: studio.owner.user.id,
          type: isApproval
            ? "STUDIO_VERIFIED"
            : "STUDIO_VERIFICATION_REJECTED",
          title: isApproval
            ? "Studio Verified!"
            : "Verification Not Approved",
          message: isApproval
            ? `Your studio "${studio.name}" has been verified. A verified badge will now appear on your listing.`
            : `Your verification request for "${studio.name}" was not approved.${notes ? ` Reason: ${notes}` : ""}`,
          referenceId: studio.id,
          referenceType: "studio",
        },
      });

      return NextResponse.json({
        success: true,
        studio: updatedStudio,
        message: isApproval
          ? "Studio verified successfully"
          : "Verification rejected",
      });
    } catch (error: any) {
      console.error("Error updating verification:", error);
      return NextResponse.json(
        { error: "Failed to update verification status" },
        { status: 500 }
      );
    }
  });
}
