// API middleware for authentication and authorization
// Production-ready with automatic user creation for missing Supabase Auth users
import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { prisma } from '@/lib/prisma';
import type { User, UserRole, ClubMemberRole } from '@prisma/client';
import type { ApiResponse, UserPermissions } from '@/types';

export interface AuthenticatedRequest extends NextRequest {
  user?: User;
  supabaseUser?: any;
  permissions?: UserPermissions;
}

// ============================================================================
// HELPER: Generate unique username
// ============================================================================

async function generateUniqueUsername(baseUsername: string): Promise<string> {
  let username = baseUsername.toLowerCase().replace(/[^a-z0-9_]/g, '');
  let counter = 1;

  // Ensure minimum length
  if (username.length < 3) {
    username = `user_${username}`;
  }

  while (true) {
    const existing = await prisma.user.findUnique({
      where: { username }
    });

    if (!existing) {
      return username;
    }

    username = `${baseUsername}${counter}`;
    counter++;
  }
}

// ============================================================================
// AUTHENTICATION MIDDLEWARE
// ============================================================================

export async function withAuth(
  request: NextRequest,
  handler: (request: AuthenticatedRequest) => Promise<NextResponse>
): Promise<NextResponse> {
  try {
    // Dynamically import cookies to avoid build error
    const { cookies } = await import('next/headers');
    const cookieStore = cookies();
    
    // Create Supabase client
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value;
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

    // Get user from database OR create if doesn't exist
    let user = await prisma.user.findUnique({
      where: { supabaseId: supabaseUser.id },
      include: {
        producerProfile: true,
        studioProfile: true,
        lyricistProfile: true,
        artistProfile: true,
        gearProfile: true
      }
    });

    // If user doesn't exist in database, create them
    if (!user) {
      console.log(`🔧 Creating new user record for Supabase user: ${supabaseUser.id}`);
      
      try {
        // Generate base username from email or metadata
        const baseUsername = supabaseUser.user_metadata?.username 
          || supabaseUser.email?.split('@')[0] 
          || `user${supabaseUser.id.slice(0, 8)}`;

        // Ensure username is unique
        const uniqueUsername = await generateUniqueUsername(baseUsername);

        // Determine primary role from metadata or default to OTHER
        const primaryRole = (supabaseUser.user_metadata?.primaryRole || 
                            supabaseUser.user_metadata?.role || 
                            'OTHER') as UserRole;

        // Create user with all required fields
        user = await prisma.user.create({
          data: {
            supabaseId: supabaseUser.id,
            email: supabaseUser.email!,
            username: uniqueUsername,
            fullName: supabaseUser.user_metadata?.full_name 
              || supabaseUser.user_metadata?.fullName 
              || supabaseUser.user_metadata?.display_name
              || null,
            avatar: supabaseUser.user_metadata?.avatar_url 
              || supabaseUser.user_metadata?.avatar 
              || null,
            primaryRole: primaryRole,
            bio: supabaseUser.user_metadata?.bio || null,
            location: supabaseUser.user_metadata?.location || null,
            website: supabaseUser.user_metadata?.website || null,
            socialLinks: supabaseUser.user_metadata?.socialLinks || null,
            membershipTier: 'FREE',
            verified: false,
          },
          include: {
            producerProfile: true,
            studioProfile: true,
            lyricistProfile: true,
            artistProfile: true,
            gearProfile: true
          }
        });
        
        console.log(`✅ Created user record: ${user.id} (${user.username}) - Role: ${user.primaryRole}`);

        // Create role-specific profile based on primaryRole
        if (user.primaryRole === 'PRODUCER' && !user.producerProfile) {
          await prisma.producerProfile.create({
            data: {
              userId: user.id,
              genres: supabaseUser.user_metadata?.genres || [],
              specialties: supabaseUser.user_metadata?.specialties || [],
              equipment: supabaseUser.user_metadata?.equipment || [],
            }
          });
          console.log(`✅ Created producer profile for: ${user.username}`);
        } else if (user.primaryRole === 'ARTIST' && !user.artistProfile) {
          await prisma.artistProfile.create({
            data: {
              userId: user.id,
              genres: supabaseUser.user_metadata?.genres || [],
              skills: supabaseUser.user_metadata?.skills || [],
            }
          });
          console.log(`✅ Created artist profile for: ${user.username}`);
        } else if (user.primaryRole === 'STUDIO_OWNER' && !user.studioProfile) {
          await prisma.studioOwnerProfile.create({
            data: {
              userId: user.id,
              studioName: supabaseUser.user_metadata?.studioName 
                || `${user.fullName || user.username}'s Studio`,
              equipment: supabaseUser.user_metadata?.equipment || [],
              capacity: supabaseUser.user_metadata?.capacity || null,
              hourlyRate: supabaseUser.user_metadata?.hourlyRate || null,
            }
          });
          console.log(`✅ Created studio owner profile for: ${user.username}`);
        } else if (user.primaryRole === 'LYRICIST' && !user.lyricistProfile) {
          await prisma.lyricistProfile.create({
            data: {
              userId: user.id,
              genres: supabaseUser.user_metadata?.genres || [],
              writingStyle: supabaseUser.user_metadata?.writingStyle || null,
              collaborationStyle: supabaseUser.user_metadata?.collaborationStyle || null,
            }
          });
          console.log(`✅ Created lyricist profile for: ${user.username}`);
        } else if (user.primaryRole === 'GEAR_SALES' && !user.gearProfile) {
          await prisma.gearSalesProfile.create({
            data: {
              userId: user.id,
              businessName: supabaseUser.user_metadata?.businessName 
                || `${user.fullName || user.username}'s Gear`,
              specialties: supabaseUser.user_metadata?.specialties || [],
              inventory: supabaseUser.user_metadata?.inventory || null,
            }
          });
          console.log(`✅ Created gear sales profile for: ${user.username}`);
        }

        // Refetch user with newly created profiles
        const refetchedUser = await prisma.user.findUnique({
          where: { id: user.id },
          include: {
            producerProfile: true,
            studioProfile: true,
            lyricistProfile: true,
            artistProfile: true,
            gearProfile: true
          }
        });

        if (refetchedUser) {
          user = refetchedUser;
        }

      } catch (createError: any) {
        console.error('❌ Error creating user record:', createError);
        
        // Handle race condition - another request may have created the user
        if (createError.code === 'P2002') {
          console.log('⚠️  Race condition detected, fetching existing user...');
          user = await prisma.user.findUnique({
            where: { supabaseId: supabaseUser.id },
            include: {
              producerProfile: true,
              studioProfile: true,
              lyricistProfile: true,
              artistProfile: true,
              gearProfile: true
            }
          });
        }
        
        if (!user) {
          return NextResponse.json<ApiResponse>({
            success: false,
            error: {
              message: 'Failed to create user record',
              code: 'USER_CREATION_FAILED',
              details: process.env.NODE_ENV === 'development' ? createError.message : undefined
            }
          }, { status: 500 });
        }
      }
    }

    // Get user permissions using the centralized permission system
    const { getUserPermissions } = await import('@/lib/permissions');
    const allPermissions = getUserPermissions(user);

    const permissions: UserPermissions = allPermissions;

    // Attach user and permissions to request
    const authenticatedRequest = request as AuthenticatedRequest;
    authenticatedRequest.user = user;
    authenticatedRequest.supabaseUser = supabaseUser;
    authenticatedRequest.permissions = permissions;

    // Call handler with authenticated request
    return await handler(authenticatedRequest);

  } catch (error: any) {
    console.error('❌ Auth middleware error:', error);
    
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
// ROLE-BASED AUTHORIZATION MIDDLEWARE
// ============================================================================

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
 * Get all permissions for a user from the request
 */
export function getUserPermissions(request: AuthenticatedRequest): UserPermissions {
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
    // Collabs & Deals permissions
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
    // Equipment/Gear marketplace permissions
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
    // Music Services marketplace permissions
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
    // Reputation & Dynamic Tiers
    reputationTier: 'newbie',
    isVerifiedCreator: false,
    isProfessionalReviewer: false,
    isLabelPartner: false,
    isMentor: false,
  };
}