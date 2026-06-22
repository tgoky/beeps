import { NextRequest, NextResponse } from "next/server";
import { withFullUser } from "@/lib/api-middleware";
import { prisma } from "@/lib/prisma";
import type { ApiResponse } from "@/types";
import { UserRole } from "@prisma/client";

// Only ever load the ONE role-profile table the user actually has,
// not all five of them on every page load.
const ROLE_PROFILE_SELECT: Record<UserRole, any> = {
  PRODUCER: { producerProfile: true },
  ARTIST: { artistProfile: true },
  LYRICIST: { lyricistProfile: true },
  GEAR_SALES: {
    gearProfile: {
      select: {
        id: true,
        businessName: true,
        specialties: true,
        inventory: true,
        _count: { select: { equipment: true } },
      },
    },
  },
  STUDIO_OWNER: {
    studioProfile: {
      select: {
        id: true,
        studioName: true,
        capacity: true,
        hourlyRate: true,
        _count: { select: { studios: true } },
      },
    },
  },
  OTHER: {},
};

export async function GET(req: NextRequest) {
  return withFullUser(req, async (req) => {
    const me = req.user!;

    try {
      const roleSelect = ROLE_PROFILE_SELECT[me.primaryRole] ?? {};

      const [extra, recentActivity, reviewStats, roleContent, roleGrants] = await Promise.all([
        // Anything not guaranteed to already be on req.user — fetched once,
        // merged below. Not cached via unstable_cache: wallet balance and
        // counts are per-user mutable state, caching them is the wrong call.
        prisma.user.findUnique({
          where: { id: me.id },
          select: {
            coverImage: true,
            membershipTier: true,
            followersCount: true,
            followingCount: true,
            verified: true,
            socialLinks: true,
            website: true,
            ...roleSelect,
            wallet: {
              select: {
                availableBalance: true,
                pendingBalance: true,
                totalEarned: true,
                totalWithdrawn: true,
                currency: true,
              },
            },
            _count: {
              select: {
                uploadedBeats: true,
                createdCollaborations: true,
                receivedServiceRequests: true,
                sentServiceRequests: true,
                transactions: true,
                purchasedLicenses: true,
                communityPosts: true,
                followers: true,
                following: true,
              },
            },
          },
        }),

        // This is what Activity exists for — you're already writing to it
        // from beats/bookings/collabs/service-requests. No reconstruction needed.
        prisma.activity.findMany({
          where: { userId: me.id },
          orderBy: { createdAt: "desc" },
          take: 15,
        }),

        // Real reputation instead of a hardcoded 5.0.
        prisma.review.aggregate({
          where: { targetId: me.id },
          _avg: { rating: true },
          _count: { rating: true },
        }),

        getRoleContent(me.id, me.primaryRole),

        // Real hybrid-role support — UserRoleGrant is the actual schema
        // feature for this, not a mock secondaryRoles array.
        prisma.userRoleGrant.findMany({
          where: { userId: me.id },
          select: { roleType: true },
        }),
      ]);

      if (!extra) {
        return NextResponse.json<ApiResponse>(
          { success: false, error: { message: "User not found", code: "NOT_FOUND" } },
          { status: 404 }
        );
      }

      const user = { ...me, ...extra };

      return NextResponse.json<ApiResponse>({
        success: true,
        data: {
          user,
          activity: recentActivity,
          reputation: {
            avgRating: reviewStats._avg.rating,
            reviewCount: reviewStats._count.rating,
          },
          roleContent,
          secondaryRoles: roleGrants.map((g) => g.roleType),
        },
      });
    } catch (error: any) {
      console.error("Error fetching profile:", error);
      return NextResponse.json<ApiResponse>(
        {
          success: false,
          error: {
            message: "Failed to fetch profile",
            code: "SERVER_ERROR",
            details: process.env.NODE_ENV === "development" ? error.message : undefined,
          },
        },
        { status: 500 }
      );
    }
  });
}

async function getRoleContent(userId: string, role: UserRole) {
  switch (role) {
    case "PRODUCER": {
      const [beats, licensesSold] = await Promise.all([
        prisma.beat.findMany({
          where: { producerId: userId, isActive: true },
          orderBy: { createdAt: "desc" },
          take: 6,
          select: {
            id: true, title: true, imageUrl: true, plays: true, likes: true,
            bpm: true, genres: true, basicPrice: true, exclusivePrice: true,
            isExclusiveSold: true, createdAt: true,
          },
        }),
        // "Beats Licensed" should mean sold, not uploaded.
        prisma.licenseAgreement.count({ where: { beat: { producerId: userId } } }),
      ]);
      return { type: "beats" as const, items: beats, meta: { licensesSold } };
    }

    case "STUDIO_OWNER": {
      const studios = await prisma.studio.findMany({
        where: { owner: { userId }, isActive: true },
        orderBy: { createdAt: "desc" },
        take: 6,
        select: {
          id: true, name: true, imageUrl: true, hourlyRate: true, currency: true,
          rating: true, reviewsCount: true, verificationStatus: true,
          _count: { select: { bookings: true } },
        },
      });
      const bookingsTotal = studios.reduce((sum, s) => sum + s._count.bookings, 0);
      return { type: "studios" as const, items: studios, meta: { bookingsTotal } };
    }

    case "GEAR_SALES": {
      const equipment = await prisma.equipment.findMany({
        where: { seller: { userId }, isActive: true },
        orderBy: { createdAt: "desc" },
        take: 6,
        select: { id: true, name: true, imageUrl: true, price: true, rentalRate: true, condition: true },
      });
      return { type: "equipment" as const, items: equipment, meta: {} };
    }

    case "ARTIST":
    case "LYRICIST":
    case "OTHER":
    default: {
      const posts = await prisma.communityPost.findMany({
        where: { authorId: userId, isActive: true },
        orderBy: { createdAt: "desc" },
        take: 6,
        select: {
          id: true, content: true, imageUrl: true, videoUrl: true,
          likesCount: true, commentsCount: true, createdAt: true,
        },
      });
      return { type: "posts" as const, items: posts, meta: {} };
    }
  }
}