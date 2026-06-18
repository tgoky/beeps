export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET /api/producers/[producerId] - Fetch single producer (Unified for Web & Mobile)
export async function GET(
  req: NextRequest,
  { params }: { params: { producerId: string } }
) {
  try {
    const { producerId } = params;

    // Fetch the user and include all associated profiles and assets
    const user = await prisma.user.findUnique({
      where: { id: producerId },
      include: {
        producerProfile: true,
        studioProfile: {
          include: { studios: { where: { isActive: true } } }
        },
        uploadedBeats: {
          where: { isActive: true },
          take: 10,
          orderBy: { createdAt: 'desc' }
        },
        offeredServices: {
          where: { isActive: true }
        }
      }
    });

    // If the user doesn't exist or isn't a producer
    if (!user || !user.producerProfile) {
      return NextResponse.json(
        { error: "Producer not found" },
        { status: 404 }
      );
    }

    const profile = user.producerProfile;

    // Build the Unified Object
    const unifiedProducer = {
      // ----------------------------------------------------
      // WEB APP EXPECTED FIELDS (Flat Structure)
      // ----------------------------------------------------
      id: user.id, // Web uses User ID as the main ID
      name: user.fullName || user.username,
      email: user.email,
      imageUrl: user.avatar,
      bio: user.bio,
      location: user.location,
      lat: user.latitude,
      lng: user.longitude,
      verified: user.verified,
      createdAt: profile.createdAt.toISOString(),

      // ----------------------------------------------------
      // MOBILE APP EXPECTED FIELDS (Nested Structure)
      // ----------------------------------------------------
      userId: user.id,
      genres: profile.genres || [],
      specialties: profile.specialties || [],
      equipment: profile.equipment || [],
      experience: profile.experience,
      productionRate: profile.productionRate,
      songwritingRate: profile.songwritingRate,
      mixingRate: profile.mixingRate,
      currency: user.currency || "USD",
      availability: profile.availability || "AVAILABLE",
      user: {
        id: user.id,
        username: user.username,
        fullName: user.fullName,
        avatar: user.avatar,
        location: user.location,
        bio: user.bio,
        verified: user.verified,
        followersCount: user.followersCount || 0,
        rating: 5.0
      },

      // ----------------------------------------------------
      // SHARED COLLECTIONS (Studios, Beats, Services)
      // ----------------------------------------------------
      studios: user.studioProfile?.studios.map(s => ({
        id: s.id,
        name: s.name,
        location: s.location,
        hourlyRate: Number(s.hourlyRate || 0),
        currency: s.currency,
        imageUrl: s.imageUrl,
        rating: Number(s.rating || 0)
      })) || [],

      beats: user.uploadedBeats.map(b => ({
        id: b.id,
        title: b.title,
        bpm: b.bpm,
        price: Number(b.basicPrice || b.price || 0), 
        likeCount: b.likes || 0, // Web expects likeCount
        likes: b.likes || 0,     // Mobile expects likes
        plays: b.plays || 0,
        currency: user.currency,
        imageUrl: b.imageUrl
      })) || [],

      services: user.offeredServices.map(s => ({
        id: s.id,
        title: s.title,
        category: s.category,
        price: Number(s.price || 0),
        currency: user.currency
      })) || []
    };

    return NextResponse.json({ producer: unifiedProducer });
  } catch (error: any) {
    console.error("Error fetching producer:", error);
    return NextResponse.json(
      { error: "Failed to fetch producer details" },
      { status: 500 }
    );
  }
}