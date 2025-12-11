// API Route: /api/users/[id]/communities
// Get user's communities (roles they have access to)

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { withAuth } from '@/lib/api-middleware';
import type { ApiResponse } from '@/types';
import { UserRole as PrismaUserRole, ClubType } from '@prisma/client';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  return withAuth(request, async (req) => {
    try {
      const userId = params.id;

      // Get user's primary role
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: {
          primaryRole: true,
        },
      });

      if (!user) {
        return NextResponse.json<ApiResponse>({
          success: false,
          error: {
            message: 'User not found',
            code: 'USER_NOT_FOUND',
          },
        }, { status: 404 });
      }

      // Get additional roles granted by clubs
      const roleGrants = await prisma.userRoleGrant.findMany({
        where: { userId },
        select: {
          roleType: true,
        },
      }).catch(() => []);

      // Combine primary role + granted roles
      const roles = new Set<PrismaUserRole>([user.primaryRole]);
      roleGrants.forEach((grant) => roles.add(grant.roleType));

      // Get club counts for each community
      const communities = await Promise.all(
        Array.from(roles).map(async (role) => {
          const clubTypes = getClubTypesForRole(role);
          
          const clubCount = clubTypes.length > 0 
            ? await prisma.club.count({
                where: {
                  type: {
                    in: clubTypes,
                  },
                  isActive: true,
                },
              }).catch(() => 0)
            : 0;

          const membershipCount = clubTypes.length > 0
            ? await prisma.clubMember.count({
                where: {
                  userId,
                  club: {
                    type: {
                      in: clubTypes,
                    },
                  },
                },
              }).catch(() => 0)
            : 0;

          return {
            role,
            label: getRoleLabel(role),
            route: `/community/${role.toLowerCase()}`,
            icon: getRoleIcon(role),
            clubCount,
            membershipCount,
            isPrimary: role === user.primaryRole,
          };
        })
      );

      return NextResponse.json<ApiResponse>({
        success: true,
        data: communities,
      });

    } catch (error: any) {
      console.error('Fetch communities error:', error);
      return NextResponse.json<ApiResponse>({
        success: false,
        error: {
          message: 'Failed to fetch communities',
          code: 'INTERNAL_ERROR',
          details: process.env.NODE_ENV === 'development' ? error.message : undefined,
        },
      }, { status: 500 });
    }
  });
}

// Helper: Get club types that grant a specific role
function getClubTypesForRole(role: PrismaUserRole): ClubType[] {
  const ROLE_TO_CLUB_TYPES: Record<PrismaUserRole, ClubType[]> = {
    ARTIST: [ClubType.RECORDING],
    PRODUCER: [ClubType.PRODUCTION],
    STUDIO_OWNER: [ClubType.RENTAL],
    LYRICIST: [ClubType.CREATIVE],
    GEAR_SALES: [],
    OTHER: [ClubType.MANAGEMENT, ClubType.DISTRIBUTION],
  };

  return ROLE_TO_CLUB_TYPES[role] || [];
}

// Helper: Get role display label
function getRoleLabel(role: PrismaUserRole): string {
  const labels: Record<PrismaUserRole, string> = {
    ARTIST: 'Artists',
    PRODUCER: 'Producers',
    STUDIO_OWNER: 'Studio Owners',
    GEAR_SALES: 'Gear Specialists',
    LYRICIST: 'Lyricists',
    OTHER: 'Music Enthusiasts',
  };

  return labels[role] || role;
}

// Helper: Get role icon name (for frontend)
function getRoleIcon(role: PrismaUserRole): string {
  const icons: Record<PrismaUserRole, string> = {
    ARTIST: 'mic',
    PRODUCER: 'music',
    STUDIO_OWNER: 'building',
    GEAR_SALES: 'package',
    LYRICIST: 'file-text',
    OTHER: 'users',
  };

  return icons[role] || 'users';
}