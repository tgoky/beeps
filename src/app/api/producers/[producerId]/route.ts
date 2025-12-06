import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET /api/producers/[producerId] - Fetch single producer
export async function GET(
  req: NextRequest,
  { params }: { params: { producerId: string } }
) {
  try {
    const { producerId } = params;

    const producerProfile = await prisma.producerProfile.findUnique({
      where: {
        userId: producerId,
      },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            fullName: true,
            avatar: true,
            bio: true,
            location: true,
            isVerified: true,
            email: true,
          },
        },
        beats: {
          where: { isActive: true },
          select: {
            id: true,
            title: true,
            imageUrl: true,
            plays: true,
            likes: true,
            price: true,
          },
          take: 10,
          orderBy: {
            createdAt: "desc",
          },
        },
        serviceRequests: {
          select: {
            id: true,
            status: true,
          },
        },
        _count: {
          select: {
            beats: true,
            serviceRequests: true,
          },
        },
      },
    });

    if (!producerProfile) {
      return NextResponse.json(
        { error: "Producer not found" },
        { status: 404 }
      );
    }

    // Get user's studios if they have any
    const studios = await prisma.studio.findMany({
      where: {
        owner: {
          userId: producerId,
        },
      },
      select: {
        id: true,
        name: true,
        location: true,
        hourlyRate: true,
      },
      take: 5,
    });

    // Get services - For now we'll return an empty array
    // You can extend this when you have a services table
    const services: any[] = [];

    // Transform to match the Producer interface
    const producer = {
      id: producerProfile.user.id,
      name: producerProfile.user.fullName,
      email: producerProfile.user.email,
      imageUrl: producerProfile.user.avatar,
      bio: producerProfile.user.bio,
      location: producerProfile.user.location,
      studios: studios.map((studio) => ({
        id: studio.id,
        name: studio.name,
        location: studio.location,
        hourlyRate: Number(studio.hourlyRate),
      })),
      beats: producerProfile.beats.map((beat) => ({
        id: beat.id,
        title: beat.title,
        price: Number(beat.price || 0),
        likeCount: beat.likes || 0,
      })),
      services: services.map((service) => ({
        id: service.id,
        title: service.title,
        price: Number(service.price || 0),
      })),
      createdAt: producerProfile.createdAt.toISOString(),
    };

    return NextResponse.json({ producer });
  } catch (error: any) {
    console.error("Error fetching producer:", error);
    return NextResponse.json(
      { error: "Failed to fetch producer" },
      { status: 500 }
    );
  }
}
