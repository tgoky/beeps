// API Route: /api/clubs
// Handles club creation and management with role assignment

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import type { CreateClubPayload, ApiResponse, ClubWithMembers } from '@/types';
import { ClubType, UserRole as PrismaUserRole } from '@prisma/client';

// Mapping from ClubType to the UserRole it grants
const CLUB_TYPE_TO_ROLE_MAP: Record<ClubType, PrismaUserRole> = {
  RECORDING: 'ARTIST',
  PRODUCTION: 'PRODUCER',
  RENTAL: 'STUDIO_OWNER',
  MANAGEMENT: 'OTHER',
  DISTRIBUTION: 'OTHER',
  CREATIVE: 'LYRICIST',
};

export async function POST(request: NextRequest) {
  try {
    const body: CreateClubPayload = await request.json();
    
    // Validate required fields
    const { name, type, ownerId } = body;
    
    if (!name || !type || !ownerId) {
      return NextResponse.json<ApiResponse>({
        success: false,
        error: {
          message: 'Missing required fields',
          code: 'VALIDATION_ERROR'
        }
      }, { status: 400 });
    }

    // Verify user exists
    const user = await prisma.user.findUnique({
      where: { id: ownerId }
    });

    if (!user) {
      return NextResponse.json<ApiResponse>({
        success: false,
        error: {
          message: 'User not found',
          code: 'USER_NOT_FOUND'
        }
      }, { status: 404 });
    }

    // Get the role this club grants
    const grantedRole = CLUB_TYPE_TO_ROLE_MAP[type as ClubType];

    // Create club with transaction
    const club = await prisma.$transaction(async (tx) => {
      // Create the club
      const newClub = await tx.club.create({
        data: {
          name,
          type: type as ClubType,
          description: body.description,
          icon: body.icon || '🎵',
          ownerId
        },
        include: {
          owner: {
            select: {
              id: true,
              username: true,
              fullName: true,
              avatar: true
            }
          }
        }
      });

      // Automatically add owner as admin member
      await tx.clubMember.create({
        data: {
          clubId: newClub.id,
          userId: ownerId,
          role: 'OWNER'
        }
      });

      // Grant the user the role (using upsert to avoid conflicts)
      await tx.userRoleGrant.upsert({
        where: {
          userId_roleType: {
            userId: ownerId,
            roleType: grantedRole,
          },
        },
        update: {
          // If it exists, update the grantedBy to the latest club
          grantedBy: newClub.id,
        },
        create: {
          userId: ownerId,
          roleType: grantedRole,
          grantedBy: newClub.id,
        },
      });

      // Create activity for club creation
      await tx.activity.create({
        data: {
          userId: ownerId,
          type: 'JOIN_CLUB',
          title: `Created club "${name}"`,
          description: `New ${type.toLowerCase()} workspace - granted ${grantedRole} role`,
          referenceId: newClub.id,
          referenceType: 'club'
        }
      });

      return { club: newClub, grantedRole };
    });

    // Fetch complete club data with members
    const clubWithMembers = await prisma.club.findUnique({
      where: { id: club.club.id },
      include: {
        members: {
          include: {
            user: {
              select: {
                id: true,
                username: true,
                avatar: true
              }
            }
          }
        },
        _count: {
          select: {
            members: true
          }
        }
      }
    });

    return NextResponse.json<ApiResponse>({
      success: true,
      data: {
        club: clubWithMembers,
        grantedRole: club.grantedRole,
      },
    }, { status: 201 });

  } catch (error: any) {
    console.error('Club creation error:', error);
    
    return NextResponse.json<ApiResponse>({
      success: false,
      error: {
        message: 'Internal server error',
        code: 'INTERNAL_ERROR',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      }
    }, { status: 500 });
  }
}

// GET endpoint to fetch user's clubs
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json<ApiResponse>({
        success: false,
        error: {
          message: 'User ID is required',
          code: 'VALIDATION_ERROR'
        }
      }, { status: 400 });
    }

    const clubs = await prisma.club.findMany({
      where: {
        OR: [
          { ownerId: userId },
          {
            members: {
              some: {
                userId
              }
            }
          }
        ],
        isActive: true
      },
      include: {
        owner: {
          select: {
            id: true,
            username: true,
            fullName: true,
            avatar: true
          }
        },
        members: {
          where: { userId },
          select: {
            role: true
          }
        },
        _count: {
          select: {
            members: true,
            studios: true,
            beats: true,
            equipment: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    return NextResponse.json<ApiResponse<typeof clubs>>({
      success: true,
      data: clubs
    });

  } catch (error: any) {
    console.error('Fetch clubs error:', error);
    
    return NextResponse.json<ApiResponse>({
      success: false,
      error: {
        message: 'Internal server error',
        code: 'INTERNAL_ERROR',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      }
    }, { status: 500 });
  }
}