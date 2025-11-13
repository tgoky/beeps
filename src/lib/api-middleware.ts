// API middleware for authentication and authorization
// Updated to work with new permission system
import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { prisma } from '@/lib/prisma';
import type { User } from '@prisma/client';
import type { ApiResponse } from '@/types';

export interface AuthenticatedRequest extends NextRequest {
  user?: User;
  supabaseUser?: any;
  permissions?: {
    canCreateStudios: boolean;
    canBookStudios: boolean;
    role: string;
    // Producer permissions
    canEditProducerProfile: boolean;
    canAcceptJobs: boolean;
    canUploadWorks: boolean;
    canManagePortfolio: boolean;
    // Client permissions
    canRequestProducerService: boolean;
    canMessageProducers: boolean;
    canViewProducerDetails: boolean;
    // Beat marketplace permissions
    canUploadBeats: boolean;
    canPurchaseBeats: boolean;
    canReviewBeats: boolean;
    canSplitRoyalties: boolean;
    canListEquipment: boolean;
    canCommentOnBeats: boolean;
    canSendLicensingOffers: boolean;
    canSetAdvancedPricing: boolean;
    canCreateBeatCollections: boolean;
    canViewBeatAnalytics: boolean;
    canCollaborateOnBeats: boolean;
    canRequestRemixRights: boolean;
    // Collabs & Deals marketplace permissions
    canCreateDeals: boolean;
    canCreateCollabs: boolean;
    canCreateBids: boolean;
    canBookSessions: boolean;
    canMessageSessionHosts: boolean;
    canNegotiateCollabTerms: boolean;
    canPlaceBids: boolean;
    canAcceptBids: boolean;
    canReportSessions: boolean;
    canAccessFlashDeals: boolean;
    canViewSessionAnalytics: boolean;
    canManageOwnSessions: boolean;
  };
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

    // Get user from database with profiles
    const user = await prisma.user.findUnique({
      where: { supabaseId: supabaseUser.id },
      include: {
        producerProfile: true,
        studioProfile: true
      }
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

    // 🆕 ENHANCED: Use getUserPermissions from permissions.ts for consistent permission logic
    const { getUserPermissions } = await import('@/lib/permissions');
    const allPermissions = getUserPermissions(user);

    const permissions = {
      ...allPermissions,
    };

    // Attach user and permissions to request
    const authenticatedRequest = request as AuthenticatedRequest;
    authenticatedRequest.user = user;
    authenticatedRequest.supabaseUser = supabaseUser;
    authenticatedRequest.permissions = permissions;

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
// PERMISSION-BASED AUTHORIZATION MIDDLEWARE
// ============================================================================

type PermissionAction =
  | 'createStudios'
  | 'bookStudios'
  | 'editProducerProfile'
  | 'acceptJobs'
  | 'requestProducerService'
  | 'uploadBeats'
  | 'purchaseBeats'
  | 'reviewBeats'
  | 'commentOnBeats'
  | 'sendLicensingOffers'
  | 'viewBeatAnalytics'
  | 'collaborateOnBeats';

export function withPermission(
  requiredPermission: PermissionAction,
  handler: (request: AuthenticatedRequest) => Promise<NextResponse>
) {
  return async (request: AuthenticatedRequest): Promise<NextResponse> => {
    const permissions = request.permissions;

    if (!permissions) {
      return NextResponse.json<ApiResponse>({
        success: false,
        error: {
          message: 'Permissions not loaded',
          code: 'PERMISSIONS_ERROR'
        }
      }, { status: 500 });
    }

    // Check specific permission
    let hasPermission = false;
    switch (requiredPermission) {
      case 'createStudios':
        hasPermission = permissions.canCreateStudios;
        break;
      case 'bookStudios':
        hasPermission = permissions.canBookStudios;
        break;
      case 'editProducerProfile':
        hasPermission = permissions.canEditProducerProfile;
        break;
      case 'acceptJobs':
        hasPermission = permissions.canAcceptJobs;
        break;
      case 'requestProducerService':
        hasPermission = permissions.canRequestProducerService;
        break;
      case 'uploadBeats':
        hasPermission = permissions.canUploadBeats;
        break;
      case 'purchaseBeats':
        hasPermission = permissions.canPurchaseBeats;
        break;
      case 'reviewBeats':
        hasPermission = permissions.canReviewBeats;
        break;
      case 'commentOnBeats':
        hasPermission = permissions.canCommentOnBeats;
        break;
      case 'sendLicensingOffers':
        hasPermission = permissions.canSendLicensingOffers;
        break;
      case 'viewBeatAnalytics':
        hasPermission = permissions.canViewBeatAnalytics;
        break;
      case 'collaborateOnBeats':
        hasPermission = permissions.canCollaborateOnBeats;
        break;
    }

    if (!hasPermission) {
      return NextResponse.json<ApiResponse>({
        success: false,
        error: {
          message: `You don't have permission to ${requiredPermission.replace('Studios', ' studios')}`,
          code: 'INSUFFICIENT_PERMISSIONS'
        }
      }, { status: 403 });
    }

    return await handler(request);
  };
}

// ============================================================================
// ROLE-BASED AUTHORIZATION MIDDLEWARE (Legacy - Use withPermission instead)
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

// Example 2: NEW - Permission-based authorization (RECOMMENDED)
export async function POST(request: NextRequest) {
  return withAuth(request, async (req) => {
    return withPermission('createStudios', async (req) => {
      const user = req.user!;
      // Only users with studio creation permission can access
      
      return NextResponse.json({
        success: true,
        data: { message: 'Studio created' }
      });
    })(req);
  });
}

// Example 3: Role-based authorization (LEGACY - still works)
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

// Example 4: Club-based authorization
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

// Example 5: Multiple permission checks
export async function POST(request: NextRequest) {
  return withAuth(request, async (req) => {
    // Check permissions manually if you need complex logic
    const { permissions } = req;
    
    if (!permissions?.canCreateStudios && !permissions?.canBookStudios) {
      return NextResponse.json({
        success: false,
        error: { message: 'No studio access', code: 'NO_ACCESS' }
      }, { status: 403 });
    }
    
    // Proceed with custom logic
    return NextResponse.json({
      success: true,
      data: { canCreate: permissions.canCreateStudios, canBook: permissions.canBookStudios }
    });
  });
}
*/

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Check if user has specific permission
 */
export function hasPermission(
  request: AuthenticatedRequest,
  permission: PermissionAction
): boolean {
  const permissions = request.permissions;
  if (!permissions) return false;

  switch (permission) {
    case 'createStudios':
      return permissions.canCreateStudios;
    case 'bookStudios':
      return permissions.canBookStudios;
    case 'editProducerProfile':
      return permissions.canEditProducerProfile;
    case 'acceptJobs':
      return permissions.canAcceptJobs;
    case 'requestProducerService':
      return permissions.canRequestProducerService;
    case 'uploadBeats':
      return permissions.canUploadBeats;
    case 'purchaseBeats':
      return permissions.canPurchaseBeats;
    case 'reviewBeats':
      return permissions.canReviewBeats;
    case 'commentOnBeats':
      return permissions.canCommentOnBeats;
    case 'sendLicensingOffers':
      return permissions.canSendLicensingOffers;
    case 'viewBeatAnalytics':
      return permissions.canViewBeatAnalytics;
    case 'collaborateOnBeats':
      return permissions.canCollaborateOnBeats;
    default:
      return false;
  }
}

/**
 * Get all permissions for a user
 */
export function getUserPermissions(request: AuthenticatedRequest) {
  return request.permissions || {
    canCreateStudios: false,
    canBookStudios: false,
    role: 'OTHER',
    canEditProducerProfile: false,
    canAcceptJobs: false,
    canUploadWorks: false,
    canManagePortfolio: false,
    canRequestProducerService: false,
    canMessageProducers: true,
    canViewProducerDetails: true,
    canUploadBeats: false,
    canPurchaseBeats: false,
    canReviewBeats: false,
    canSplitRoyalties: false,
    canListEquipment: false,
    canCommentOnBeats: false,
    canSendLicensingOffers: false,
    canSetAdvancedPricing: false,
    canCreateBeatCollections: false,
    canViewBeatAnalytics: false,
    canCollaborateOnBeats: false,
    canRequestRemixRights: false,
  };
}