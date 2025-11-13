// API Route: /api/communities/[role]/posts
// Handles community posts for role-specific communities

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { withAuth } from '@/lib/api-middleware';
import type { ApiResponse } from '@/types';
import { UserRole as PrismaUserRole } from '@prisma/client';

export async function POST(
  request: NextRequest,
  { params }: { params: { role: string } }
) {
  return withAuth(request, async (req) => {
    try {
      const body = await req.json();
      const { content, imageUrl, videoUrl } = body;

      if (!content?.trim()) {
        return NextResponse.json<ApiResponse>({
          success: false,
          error: {
            message: 'Post content is required',
            code: 'VALIDATION_ERROR',
          },
        }, { status: 400 });
      }

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

      const userId = req.user!.id;
      const communityRole = roleUpper as PrismaUserRole;

      // Check if user has access to this community (has the role)
      const userRoleGrant = await prisma.userRoleGrant.findUnique({
        where: {
          userId_roleType: {
            userId,
            roleType: communityRole,
          },
        },
      }).catch(() => null);

      if (!userRoleGrant && req.user!.primaryRole !== communityRole) {
        return NextResponse.json<ApiResponse>({
          success: false,
          error: {
            message: 'You do not have access to this community',
            code: 'INSUFFICIENT_PERMISSIONS',
          },
        }, { status: 403 });
      }

      // Create the post
      const post = await prisma.communityPost.create({
        data: {
          authorId: userId,
          communityRole,
          content: content.trim(),
          imageUrl: imageUrl || null,
          videoUrl: videoUrl || null,
        },
        include: {
          author: {
            select: {
              id: true,
              username: true,
              fullName: true,
              avatar: true,
              primaryRole: true,
              verified: true,
            },
          },
        },
      }).catch((error) => {
        console.error('Error creating post:', error);
        throw new Error('Could not create post. Database table may not exist yet.');
      });

      return NextResponse.json<ApiResponse>({
        success: true,
        data: post,
      }, { status: 201 });

    } catch (error: any) {
      console.error('Create post error:', error);
      return NextResponse.json<ApiResponse>({
        success: false,
        error: {
          message: error.message || 'Failed to create post',
          code: 'INTERNAL_ERROR',
        },
      }, { status: 500 });
    }
  });
}

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
      const { searchParams } = new URL(req.url);
      const limit = parseInt(searchParams.get('limit') || '20');
      const offset = parseInt(searchParams.get('offset') || '0');

      // Fetch posts for this community
      const posts = await prisma.communityPost.findMany({
        where: {
          communityRole,
          isActive: true,
        },
        include: {
          author: {
            select: {
              id: true,
              username: true,
              fullName: true,
              avatar: true,
              primaryRole: true,
              verified: true,
            },
          },
          _count: {
            select: {
              comments: true,
              likes: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
        take: limit,
        skip: offset,
      }).catch(() => []);

      return NextResponse.json<ApiResponse>({
        success: true,
        data: posts,
      });

    } catch (error: any) {
      console.error('Fetch posts error:', error);
      return NextResponse.json<ApiResponse>({
        success: false,
        error: {
          message: 'Failed to fetch posts',
          code: 'INTERNAL_ERROR',
        },
      }, { status: 500 });
    }
  });
}
