// API middleware for authentication and authorization
import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { prisma } from '@/lib/prisma';
import type { User } from '@prisma/client';
import type { ApiResponse } from '@/types';

export interface AuthenticatedRequest extends NextRequest {
  user?: User;
  supabaseUser?: any;
}

// ============================================================================
// AUTHENTICATION MIDDLEWARE
// ============================================================================

export async function withAuth(
  request: NextRequest,
  handler: (request: AuthenticatedRequest) => Promise<NextResponse>
): Promise<NextResponse> {
  try {
    // Create Supabase client
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return request.cookies.get(name)?.value;
          },
          set() {},
          remove() {},
        },
      }
    );

    // Get user from Supabase Auth
    const { data: { user: supabaseUser }, error } = await supabase.auth.getUser();

    if (error || !supabaseUser) {
      return NextResponse.json<ApiResponse>({
        success: false,
        error: {
          message: 'Unauthorized - Please login',
          code: 'UNAUTHORIZED'
        }
      }, { status: 401 });
    }

    // Get user from database
    const user = await prisma.user.findUnique({
      where: { supabaseId: supabaseUser.id }
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

    // Attach user to request
    const authenticatedRequest = request as AuthenticatedRequest;
    authenticatedRequest.user = user;
    authenticatedRequest.supabaseUser = supabaseUser;

    // Call handler with authenticated request
    return await handler(authenticatedRequest);

  } catch (error: any) {
    console.error('Auth middleware error:', error);
    
    return NextResponse.json<ApiResponse>({
      success: false,
      error: {
        message: 'Authentication failed',
        code: 'AUTH_ERROR',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      }
    }, { status: 500 });
  }
}

// ============================================================================
// ROLE-BASED AUTHORIZATION MIDDLEWARE
// ============================================================================

import { UserRole } from '@prisma/client';

export function withRole(
  allowedRoles: UserRole[],
  handler: (request: AuthenticatedRequest) => Promise<NextResponse>
) {
  return async (request: AuthenticatedRequest): Promise<NextResponse> => {
    const user = request.user;

    if (!user) {
      return NextResponse.json<ApiResponse>({
        success: false,
        error: {
          message: 'Unauthorized',
          code: 'UNAUTHORIZED'
        }
      }, { status: 401 });
    }

    if (!allowedRoles.includes(user.primaryRole)) {
      return NextResponse.json<ApiResponse>({
        success: false,
        error: {
          message: 'Insufficient permissions',
          code: 'FORBIDDEN'
        }
      }, { status: 403 });
    }

    return await handler(request);
  };
}

// ============================================================================
// CLUB AUTHORIZATION MIDDLEWARE
// ============================================================================

import { ClubMemberRole } from '@prisma/client';

export async function withClubAccess(
  request: AuthenticatedRequest,
  clubId: string,
  requiredRoles: ClubMemberRole[],
  handler: (request: AuthenticatedRequest) => Promise<NextResponse>
): Promise<NextResponse> {
  const user = request.user;

  if (!user) {
    return NextResponse.json<ApiResponse>({
      success: false,
      error: {
        message: 'Unauthorized',
        code: 'UNAUTHORIZED'
      }
    }, { status: 401 });
  }

  // Check if user is a member of the club
  const membership = await prisma.clubMember.findUnique({
    where: {
      clubId_userId: {
        clubId,
        userId: user.id
      }
    }
  });

  if (!membership) {
    return NextResponse.json<ApiResponse>({
      success: false,
      error: {
        message: 'Not a member of this club',
        code: 'NOT_CLUB_MEMBER'
      }
    }, { status: 403 });
  }

  if (!requiredRoles.includes(membership.role)) {
    return NextResponse.json<ApiResponse>({
      success: false,
      error: {
        message: 'Insufficient club permissions',
        code: 'INSUFFICIENT_CLUB_PERMISSIONS'
      }
    }, { status: 403 });
  }

  return await handler(request);
}

// ============================================================================
// USAGE EXAMPLES
// ============================================================================

/*
// Example 1: Basic authentication
export async function GET(request: NextRequest) {
  return withAuth(request, async (req) => {
    const user = req.user!;
    
    return NextResponse.json({
      success: true,
      data: { message: `Hello ${user.username}` }
    });
  });
}

// Example 2: Role-based authorization
export async function POST(request: NextRequest) {
  return withAuth(request, async (req) => {
    return withRole(['PRODUCER'], async (req) => {
      const user = req.user!;
      // Only producers can upload beats
      
      return NextResponse.json({
        success: true,
        data: { message: 'Beat uploaded' }
      });
    })(req);
  });
}

// Example 3: Club-based authorization
export async function PUT(
  request: NextRequest,
  { params }: { params: { clubId: string } }
) {
  return withAuth(request, async (req) => {
    return withClubAccess(req, params.clubId, ['OWNER', 'ADMIN'], async (req) => {
      // Only club owners/admins can update club settings
      
      return NextResponse.json({
        success: true,
        data: { message: 'Club updated' }
      });
    });
  });
}
*/