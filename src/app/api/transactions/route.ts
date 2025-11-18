import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/lib/api-middleware";
import { prisma } from "@/lib/prisma";

// GET /api/transactions - Fetch user transactions
export const GET = withAuth(async (req: NextRequest, { user }) => {
  try {
    const { searchParams } = new URL(req.url);
    const type = searchParams.get("type"); // BEAT, EQUIPMENT, BOOKING, SERVICE
    const asSeller = searchParams.get("asSeller") === "true";

    let where: any = {};

    if (asSeller) {
      where.sellerId = user.id;
    } else {
      where.buyerId = user.id;
    }

    if (type) {
      where.type = type;
    }

    const transactions = await prisma.transaction.findMany({
      where,
      include: {
        buyer: {
          select: {
            id: true,
            username: true,
            fullName: true,
            avatar: true,
          },
        },
        seller: {
          select: {
            id: true,
            username: true,
            fullName: true,
            avatar: true,
          },
        },
        beat: {
          select: {
            id: true,
            title: true,
            imageUrl: true,
          },
        },
        equipment: {
          select: {
            id: true,
            name: true,
            imageUrl: true,
          },
        },
        booking: {
          select: {
            id: true,
            studio: {
              select: {
                id: true,
                name: true,
                imageUrl: true,
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json({ transactions });
  } catch (error: any) {
    console.error("Error fetching transactions:", error);
    return NextResponse.json(
      { error: "Failed to fetch transactions" },
      { status: 500 }
    );
  }
});

// POST /api/transactions - Create a transaction (purchase)
export const POST = withAuth(async (req: NextRequest, { user }) => {
  try {
    const body = await req.json();
    const { type, referenceId, amount, paymentMethod } = body;

    // Validate required fields
    if (!type || !referenceId || !amount) {
      return NextResponse.json(
        { error: "Missing required fields: type, referenceId, amount" },
        { status: 400 }
      );
    }

    // Validate transaction type
    if (!["BEAT", "EQUIPMENT", "BOOKING", "SERVICE"].includes(type)) {
      return NextResponse.json(
        { error: "Invalid transaction type" },
        { status: 400 }
      );
    }

    let sellerId: string;
    let transactionData: any = {
      buyerId: user.id,
      type,
      amount: parseFloat(amount),
      paymentMethod: paymentMethod || "CARD",
      status: "COMPLETED", // In production, would be PENDING until payment confirmed
    };

    // Get seller based on type and set reference
    switch (type) {
      case "BEAT":
        const beat = await prisma.beat.findUnique({
          where: { id: referenceId },
          include: { producer: true },
        });
        if (!beat) {
          return NextResponse.json({ error: "Beat not found" }, { status: 404 });
        }
        sellerId = beat.producer.userId;
        transactionData.beatId = referenceId;
        break;

      case "EQUIPMENT":
        const equipment = await prisma.equipment.findUnique({
          where: { id: referenceId },
          include: { seller: true },
        });
        if (!equipment) {
          return NextResponse.json(
            { error: "Equipment not found" },
            { status: 404 }
          );
        }
        sellerId = equipment.seller.userId;
        transactionData.equipmentId = referenceId;
        break;

      case "BOOKING":
        const booking = await prisma.booking.findUnique({
          where: { id: referenceId },
          include: { studio: { include: { owner: true } } },
        });
        if (!booking) {
          return NextResponse.json(
            { error: "Booking not found" },
            { status: 404 }
          );
        }
        sellerId = booking.studio.owner.userId;
        transactionData.bookingId = referenceId;

        // Update booking status to CONFIRMED
        await prisma.booking.update({
          where: { id: referenceId },
          data: { status: "CONFIRMED" },
        });
        break;

      case "SERVICE":
        const serviceRequest = await prisma.serviceRequest.findUnique({
          where: { id: referenceId },
        });
        if (!serviceRequest) {
          return NextResponse.json(
            { error: "Service request not found" },
            { status: 404 }
          );
        }
        sellerId = serviceRequest.producerId;
        transactionData.serviceRequestId = referenceId;

        // Update service request status
        await prisma.serviceRequest.update({
          where: { id: referenceId },
          data: { status: "IN_PROGRESS" },
        });
        break;

      default:
        return NextResponse.json(
          { error: "Invalid transaction type" },
          { status: 400 }
        );
    }

    transactionData.sellerId = sellerId;

    // Create transaction
    const transaction = await prisma.transaction.create({
      data: transactionData,
      include: {
        buyer: {
          select: {
            id: true,
            username: true,
            fullName: true,
            avatar: true,
          },
        },
        seller: {
          select: {
            id: true,
            username: true,
            fullName: true,
            avatar: true,
          },
        },
      },
    });

    // Create notifications for both parties
    const itemName = type === "BEAT" ? "beat" : type === "EQUIPMENT" ? "equipment" : type === "BOOKING" ? "studio booking" : "service";

    // Notify seller
    await prisma.notification.create({
      data: {
        userId: sellerId,
        type: "TRANSACTION_COMPLETED",
        title: "New Purchase!",
        message: `${user.fullName || user.username} purchased your ${itemName} for $${amount}`,
        referenceId: transaction.id,
        referenceType: "TRANSACTION",
      },
    });

    // Notify buyer
    await prisma.notification.create({
      data: {
        userId: user.id,
        type: "TRANSACTION_COMPLETED",
        title: "Purchase Confirmed",
        message: `Your purchase of ${itemName} for $${amount} has been confirmed`,
        referenceId: transaction.id,
        referenceType: "TRANSACTION",
      },
    });

    // Create activity
    await prisma.activity.create({
      data: {
        userId: user.id,
        type: "COMPLETE",
        title: `Purchased ${itemName}`,
        description: `Transaction completed for $${amount}`,
        referenceId: transaction.id,
        referenceType: "transaction",
      },
    });

    return NextResponse.json({ transaction }, { status: 201 });
  } catch (error: any) {
    console.error("Error creating transaction:", error);
    return NextResponse.json(
      { error: "Failed to create transaction", details: error.message },
      { status: 500 }
    );
  }
});
