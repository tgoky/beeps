// API Route: /api/communities/[role]/stats
// Get statistics for a role-specific community

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { withAuth } from '@/lib/api-middleware';
import type { ApiResponse } from '@/types';
import { UserRole as PrismaUserRole, ClubType } from '@prisma/client';

// Map roles to their club types
const ROLE_TO_CLUB_TYPES: Record<PrismaUserRole, ClubType[]> = {
  ARTIST: ['RECORDING'],
  PRODUCER: ['PRODUCTION'],
  STUDIO_OWNER: ['RENTAL'],
  LYRICIST: ['CREATIVE'],
  GEAR_SALES: [],
  OTHER: ['MANAGEMENT', 'DISTRIBUTION'],
};

export async function GET(
  request: NextRequest,
  { params }: { params: { role: string } }
) {
  return withAuth(request, async (req) => {
    try {
      // Validate role
      const roleUpper = params.role.toUpperCase();
      if (!(roleUpper in PrismaUserRole)) {
        return NextResponse.json<ApiResponse>({
          success: false,
          error: {
            message: 'Invalid community role',
            code: 'VALIDATION_ERROR',
          },
        }, { status: 400 });
      }

      const communityRole = roleUpper as PrismaUserRole;
      const clubTypes = ROLE_TO_CLUB_TYPES[communityRole];

      // Get total members with this role (primary + granted)
      const usersWithPrimaryRole = await prisma.user.count({
        where: {
          primaryRole: communityRole,
        },
      });

      const usersWithGrantedRole = await prisma.userRoleGrant.count({
        where: {
          roleType: communityRole,
        },
        distinct: ['userId'],
      }).catch(() => 0);

      const totalMembers = usersWithPrimaryRole + usersWithGrantedRole;

      // Get total active clubs for this community
      const totalClubs = await prisma.club.count({
        where: {
          type: { in: clubTypes },
          isActive: true,
        },
      });

      // Get posts this week
      const oneWeekAgo = new Date();
      oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

      const postsThisWeek = await prisma.communityPost.count({
        where: {
          communityRole,
          createdAt: {
            gte: oneWeekAgo,
          },
          isActive: true,
        },
      }).catch(() => 0);

      // Get trending clubs (most members, created in last month)
      const oneMonthAgo = new Date();
      oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);

      const trendingClubs = await prisma.club.findMany({
        where: {
          type: { in: clubTypes },
          isActive: true,
          createdAt: {
            gte: oneMonthAgo,
          },
        },
        include: {
          owner: {
            select: {
              id: true,
              username: true,
              avatar: true,
            },
          },
          _count: {
            select: {
              members: true,
            },
          },
        },
        orderBy: {
          members: {
            _count: 'desc',
          },
        },
        take: 5,
      });

      const stats = {
        totalMembers,
        totalClubs,
        postsThisWeek,
        trendingClubs: trendingClubs.map((club) => ({
          id: club.id,
          name: club.name,
          icon: club.icon,
          description: club.description,
          membersCount: club._count.members,
          owner: club.owner,
        })),
      };

      return NextResponse.json<ApiResponse>({
        success: true,
        data: stats,
      });

    } catch (error: any) {
      console.error('Fetch community stats error:', error);
      return NextResponse.json<ApiResponse>({
        success: false,
        error: {
          message: 'Failed to fetch community stats',
          code: 'INTERNAL_ERROR',
        },
      }, { status: 500 });
    }
  });
}
