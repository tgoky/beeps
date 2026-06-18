// src/lib/api-middleware.ts
import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { prisma } from '@/lib/prisma';
import type { UserRole, ClubMemberRole } from '@prisma/client';
import type { ApiResponse, UserPermissions, UserWithProfiles } from '@/types';

// ============================================================================
// REQUEST TYPES 
// ============================================================================

// LEAN SHAPE: Fast path. No DB hits. Use for high-traffic routes.
export interface AuthenticatedRequest extends NextRequest {
  user?: {
    id: string;
    supabaseId: string;
    primaryRole: UserRole;
  };
  permissions?: UserPermissions;
}

// RICH SHAPE: Legacy path. Hits DB for includes. Use when you need .email, .avatar, etc.
export interface FullAuthenticatedRequest extends NextRequest {
  user?: UserWithProfiles;
  supabaseUser?: any;
  permissions?: UserPermissions;
}

// ============================================================================
// SHARED JWT VERIFICATION
// ============================================================================

async function verifyClaims(request: NextRequest) {
  const { cookies } = await import('next/headers');
  const cookieStore = await cookies();
  
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options));
          } catch {
            // Ignored in edge/streaming contexts where cookies can't be set
          }
        },
      },
    }
  );

  const authHeader = request.headers.get('authorization') || request.headers.get('Authorization');
  const bearerToken = authHeader?.startsWith('Bearer ') ? authHeader.split(' ')[1] : undefined;

  // Local edge verification via getClaims() - Zero DB hits
  const { data: claimsData, error } = await supabase.auth.getClaims(bearerToken);
  
  if (error || !claimsData) return null;
  return (claimsData as any).claims || claimsData;
}

// ============================================================================
// FAST PATH: LEAN MIDDLEWARE (Default for new/optimized routes)
// ============================================================================

export async function withAuth(
  request: NextRequest,
  handler: (request: AuthenticatedRequest) => Promise<NextResponse>
): Promise<NextResponse> {
  try {
    const claims = await verifyClaims(request);
    
    if (!claims) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: { message: 'Unauthorized - Invalid or expired token', code: 'UNAUTHORIZED' } },
        { status: 401 }
      );
    }

    const appMetadata = claims.app_metadata || {};
    const internalDbId = appMetadata.internal_db_id;
    const userRole = appMetadata.role as UserRole;
    
    // Extract the exact boolean injected via our Postgres Auth Hook
    const hasStudio = appMetadata.has_studio === true;

    if (!internalDbId) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: { message: 'Profile mapping incomplete. Please sign in again.', code: 'PROFILE_INCOMPLETE' } },
        { status: 403 }
      );
    }

    const authenticatedRequest = request as AuthenticatedRequest;
    authenticatedRequest.user = { id: internalDbId, supabaseId: claims.sub, primaryRole: userRole };

    // Explicitly pass `hasStudio` to our permission generator
    const { getUserPermissions } = await import('@/lib/permissions');
    authenticatedRequest.permissions = getUserPermissions({ 
      primaryRole: userRole,
      hasStudio: hasStudio 
    } as any);

    return await handler(authenticatedRequest);
  } catch (error: any) {
    console.error("[withAuth Middleware Error]:", error);
    return NextResponse.json<ApiResponse>(
      { success: false, error: { message: 'Internal Server Error during Authentication', code: 'AUTH_SERVER_ERROR' } }, 
      { status: 500 }
    );
  }
}

// ============================================================================
// FULL PATH: LEGACY MIDDLEWARE 
// ============================================================================

export async function withFullUser(
  request: NextRequest,
  handler: (request: FullAuthenticatedRequest) => Promise<NextResponse>
): Promise<NextResponse> {
  try {
    const claims = await verifyClaims(request);
    
    if (!claims) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: { message: 'Unauthorized', code: 'UNAUTHORIZED' } }, 
        { status: 401 }
      );
    }

    const internalDbId = claims.app_metadata?.internal_db_id;
    
    if (!internalDbId) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: { message: 'Profile mapping incomplete. Please sign in again.', code: 'PROFILE_INCOMPLETE' } }, 
        { status: 403 }
      );
    }

    // Surgical Prisma hit using the indexed internal DB ID
    const user = await prisma.user.findUnique({
      where: { id: internalDbId },
      include: {
        producerProfile: true, studioProfile: true, lyricistProfile: true, artistProfile: true, gearProfile: true,
      },
    });

    if (!user) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: { message: 'User not found in DB', code: 'USER_NOT_FOUND' } }, 
        { status: 404 }
      );
    }

    const { getUserPermissions } = await import('@/lib/permissions');
    const authenticatedRequest = request as FullAuthenticatedRequest;
    authenticatedRequest.user = user as UserWithProfiles;
    authenticatedRequest.supabaseUser = claims;
    authenticatedRequest.permissions = getUserPermissions(user);

    return await handler(authenticatedRequest);
  } catch (error: any) {
    console.error("[withFullUser Middleware Error]:", error);
    return NextResponse.json<ApiResponse>(
      { success: false, error: { message: 'Internal Server Error during Authentication', code: 'AUTH_SERVER_ERROR' } }, 
      { status: 500 }
    );
  }
}

// ============================================================================
// PERMISSION / ROLE / CLUB MIDDLEWARES
// ============================================================================

type PermissionAction =
  | 'createStudios' | 'bookStudios' | 'editProducerProfile' | 'acceptJobs'
  | 'requestProducerService' | 'uploadBeats' | 'purchaseBeats' | 'reviewBeats'
  | 'commentOnBeats' | 'sendLicensingOffers' | 'viewBeatAnalytics' | 'collaborateOnBeats';

export function withPermission(
  requiredPermission: PermissionAction,
  handler: (request: AuthenticatedRequest | FullAuthenticatedRequest) => Promise<NextResponse>
) {
  return async (request: AuthenticatedRequest | FullAuthenticatedRequest): Promise<NextResponse> => {
    const permissions = request.permissions;
    if (!permissions) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: { message: 'Permissions not loaded', code: 'PERMISSIONS_ERROR' } },
        { status: 500 }
      );
    }

    const map: Record<PermissionAction, boolean> = {
      createStudios: permissions.canCreateStudios,
      bookStudios: permissions.canBookStudios,
      editProducerProfile: permissions.canEditProducerProfile,
      acceptJobs: permissions.canAcceptJobs,
      requestProducerService: permissions.canRequestProducerService,
      uploadBeats: permissions.canUploadBeats,
      purchaseBeats: permissions.canPurchaseBeats,
      reviewBeats: permissions.canReviewBeats,
      commentOnBeats: permissions.canCommentOnBeats,
      sendLicensingOffers: permissions.canSendLicensingOffers,
      viewBeatAnalytics: permissions.canViewBeatAnalytics,
      collaborateOnBeats: permissions.canCollaborateOnBeats,
    };

    if (!map[requiredPermission]) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: { message: `You don't have permission to ${requiredPermission}`, code: 'INSUFFICIENT_PERMISSIONS' } },
        { status: 403 }
      );
    }

    return await handler(request);
  };
}

export function withRole(
  allowedRoles: UserRole[],
  handler: (request: AuthenticatedRequest | FullAuthenticatedRequest) => Promise<NextResponse>
) {
  return async (request: AuthenticatedRequest | FullAuthenticatedRequest): Promise<NextResponse> => {
    if (!request.user || !allowedRoles.includes(request.user.primaryRole)) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: { message: 'Insufficient role access', code: 'FORBIDDEN' } },
        { status: 403 }
      );
    }
    return await handler(request);
  };
}

export async function withClubAccess(
  request: AuthenticatedRequest | FullAuthenticatedRequest,
  clubId: string,
  requiredRoles: ClubMemberRole[],
  handler: (request: AuthenticatedRequest | FullAuthenticatedRequest) => Promise<NextResponse>
): Promise<NextResponse> {
  if (!request.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const membership = await prisma.clubMember.findUnique({
    where: { clubId_userId: { clubId, userId: request.user.id } },
    select: { role: true },
  });

  if (!membership || !requiredRoles.includes(membership.role)) {
    return NextResponse.json<ApiResponse>(
      { success: false, error: { message: 'Insufficient club permissions', code: 'INSUFFICIENT_CLUB_PERMISSIONS' } },
      { status: 403 }
    );
  }

  return await handler(request);
}

export function hasPermission(
  request: AuthenticatedRequest | FullAuthenticatedRequest,
  permission: PermissionAction
): boolean {
  const permissions = request.permissions;
  if (!permissions) return false;
  const map: Record<PermissionAction, boolean> = {
    createStudios: permissions.canCreateStudios,
    bookStudios: permissions.canBookStudios,
    editProducerProfile: permissions.canEditProducerProfile,
    acceptJobs: permissions.canAcceptJobs,
    requestProducerService: permissions.canRequestProducerService,
    uploadBeats: permissions.canUploadBeats,
    purchaseBeats: permissions.canPurchaseBeats,
    reviewBeats: permissions.canReviewBeats,
    commentOnBeats: permissions.canCommentOnBeats,
    sendLicensingOffers: permissions.canSendLicensingOffers,
    viewBeatAnalytics: permissions.canViewBeatAnalytics,
    collaborateOnBeats: permissions.canCollaborateOnBeats,
  };
  return map[permission] ?? false;
}

/**
 * Get all permissions for a user from the request.
 * (Preserved for backwards compatibility, relied on by the client auth provider)
 */
export function getUserPermissions(request: AuthenticatedRequest | FullAuthenticatedRequest): UserPermissions {
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
    canCreateDeals: false,
    canCreateCollabs: false,
    canCreateBids: false,
    canBookSessions: false,
    canMessageSessionHosts: false,
    canNegotiateCollabTerms: false,
    canPlaceBids: false,
    canAcceptBids: false,
    canReportSessions: false,
    canAccessFlashDeals: false,
    canViewSessionAnalytics: false,
    canManageOwnSessions: false,
    canListGearForSale: false,
    canListGearForRent: false,
    canPurchaseGear: false,
    canRentGear: false,
    canCreateGearAuction: false,
    canPlaceGearBids: false,
    canAcceptGearBids: false,
    canListVintageGear: false,
    canVerifyGearOwnership: false,
    canAccessVIPGearDrops: false,
    canAddGearToClub: false,
    canRemoveGearFromClub: false,
    canRentClubGear: false,
    canManageClubGearInventory: false,
    canInitiateGroupRental: false,
    canJoinGroupRental: false,
    canSplitRentalCosts: false,
    canReviewGear: false,
    canReportGear: false,
    canViewGearAnalytics: false,
    canManageOwnGearListings: false,
    canOfferGearDelivery: false,
    canRequestLocalPickup: false,
    canAccessGeofencedGear: false,
    canAccessPremiumGear: false,
    hasGearCollectorTier: false,
    isCertifiedGearDealer: false,
    canUploadSnippets: false,
    canPostLyrics: false,
    canPostLyricsToClub: false,
    canPostLyricsToFollowers: false,
    canCreateCollabRequest: false,
    canCreateWriterGigs: false,
    canHostAuditions: false,
    canSubmitToAuditions: false,
    canSubmitAnonymousAudition: false,
    canViewLyrics: true,
    canViewPrivateLyrics: false,
    canGiveFeedback: false,
    canGiveProfessionalReview: false,
    canPostLabelOpportunity: false,
    canUseScoutingMode: false,
    canViewAuditionsByType: false,
    canProposeRevenueSplit: false,
    canJoinPaidCollabs: false,
    canInviteToCollab: false,
    canEditCollabTerms: false,
    canAccessGenreRestricted: false,
    canEarnSkillBadges: false,
    canFeatureServices: false,
    canViewServiceAnalytics: false,
    canReportServices: true,
    canModerateServices: false,
    reputationTier: 'newbie',
    isVerifiedCreator: false,
    isProfessionalReviewer: false,
    isLabelPartner: false,
    isMentor: false,
  };
}