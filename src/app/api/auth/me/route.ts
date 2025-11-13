// API Route: /api/auth/me
// Returns current authenticated user with complete permissions

import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/api-middleware';
import type { ApiResponse } from '@/types';

export async function GET(request: NextRequest) {
  return withAuth(request, async (req) => {
    try {
      const user = req.user!;
      const permissions = req.permissions!;

      // Return user data with complete permissions
      return NextResponse.json<ApiResponse>({
        success: true,
        data: {
          id: user.id,
          supabaseId: user.supabaseId,
          email: user.email,
          username: user.username,
          fullName: user.fullName,
          avatar: user.avatar,
          primaryRole: user.primaryRole,
          bio: user.bio,
          location: user.location,
          website: user.website,
          socialLinks: user.socialLinks,
          createdAt: user.createdAt,
          updatedAt: user.updatedAt,
          // ✅ Complete permissions object
          permissions: {
            canCreateStudios: permissions.canCreateStudios,
            canBookStudios: permissions.canBookStudios,
            role: permissions.role,
            // Producer permissions
            canEditProducerProfile: permissions.canEditProducerProfile,
            canAcceptJobs: permissions.canAcceptJobs,
            canUploadWorks: permissions.canUploadWorks,
            canManagePortfolio: permissions.canManagePortfolio,
            // Client permissions
            canRequestProducerService: permissions.canRequestProducerService,
            canMessageProducers: permissions.canMessageProducers,
            canViewProducerDetails: permissions.canViewProducerDetails,
            // Beat marketplace permissions
            canUploadBeats: permissions.canUploadBeats,
            canPurchaseBeats: permissions.canPurchaseBeats,
            canReviewBeats: permissions.canReviewBeats,
            canSplitRoyalties: permissions.canSplitRoyalties,
            canListEquipment: permissions.canListEquipment,
            canCommentOnBeats: permissions.canCommentOnBeats,
            canSendLicensingOffers: permissions.canSendLicensingOffers,
            canSetAdvancedPricing: permissions.canSetAdvancedPricing,
            canCreateBeatCollections: permissions.canCreateBeatCollections,
            canViewBeatAnalytics: permissions.canViewBeatAnalytics,
            canCollaborateOnBeats: permissions.canCollaborateOnBeats,
            canRequestRemixRights: permissions.canRequestRemixRights,
            // Collabs & Deals marketplace permissions
            canCreateDeals: permissions.canCreateDeals,
            canCreateCollabs: permissions.canCreateCollabs,
            canCreateBids: permissions.canCreateBids,
            canBookSessions: permissions.canBookSessions,
            canMessageSessionHosts: permissions.canMessageSessionHosts,
            canNegotiateCollabTerms: permissions.canNegotiateCollabTerms,
            canPlaceBids: permissions.canPlaceBids,
            canAcceptBids: permissions.canAcceptBids,
            canReportSessions: permissions.canReportSessions,
            canAccessFlashDeals: permissions.canAccessFlashDeals,
            canViewSessionAnalytics: permissions.canViewSessionAnalytics,
            canManageOwnSessions: permissions.canManageOwnSessions,
            // Equipment/Gear marketplace permissions
            canListGearForSale: permissions.canListGearForSale,
            canListGearForRent: permissions.canListGearForRent,
            canPurchaseGear: permissions.canPurchaseGear,
            canRentGear: permissions.canRentGear,
            canCreateGearAuction: permissions.canCreateGearAuction,
            canPlaceGearBids: permissions.canPlaceGearBids,
            canAcceptGearBids: permissions.canAcceptGearBids,
            canListVintageGear: permissions.canListVintageGear,
            canVerifyGearOwnership: permissions.canVerifyGearOwnership,
            canAccessVIPGearDrops: permissions.canAccessVIPGearDrops,
            canAddGearToClub: permissions.canAddGearToClub,
            canRemoveGearFromClub: permissions.canRemoveGearFromClub,
            canRentClubGear: permissions.canRentClubGear,
            canManageClubGearInventory: permissions.canManageClubGearInventory,
            canInitiateGroupRental: permissions.canInitiateGroupRental,
            canJoinGroupRental: permissions.canJoinGroupRental,
            canSplitRentalCosts: permissions.canSplitRentalCosts,
            canReviewGear: permissions.canReviewGear,
            canReportGear: permissions.canReportGear,
            canViewGearAnalytics: permissions.canViewGearAnalytics,
            canManageOwnGearListings: permissions.canManageOwnGearListings,
            canOfferGearDelivery: permissions.canOfferGearDelivery,
            canRequestLocalPickup: permissions.canRequestLocalPickup,
            canAccessGeofencedGear: permissions.canAccessGeofencedGear,
            canAccessPremiumGear: permissions.canAccessPremiumGear,
            hasGearCollectorTier: permissions.hasGearCollectorTier,
            isCertifiedGearDealer: permissions.isCertifiedGearDealer,
            // Music Services marketplace permissions
            canUploadSnippets: permissions.canUploadSnippets,
            canPostLyrics: permissions.canPostLyrics,
            canPostLyricsToClub: permissions.canPostLyricsToClub,
            canPostLyricsToFollowers: permissions.canPostLyricsToFollowers,
            canCreateCollabRequest: permissions.canCreateCollabRequest,
            canCreateWriterGigs: permissions.canCreateWriterGigs,
            canHostAuditions: permissions.canHostAuditions,
            canSubmitToAuditions: permissions.canSubmitToAuditions,
            canSubmitAnonymousAudition: permissions.canSubmitAnonymousAudition,
            canViewLyrics: permissions.canViewLyrics,
            canViewPrivateLyrics: permissions.canViewPrivateLyrics,
            canGiveFeedback: permissions.canGiveFeedback,
            canGiveProfessionalReview: permissions.canGiveProfessionalReview,
            canPostLabelOpportunity: permissions.canPostLabelOpportunity,
            canUseScoutingMode: permissions.canUseScoutingMode,
            canViewAuditionsByType: permissions.canViewAuditionsByType,
            canProposeRevenueSplit: permissions.canProposeRevenueSplit,
            canJoinPaidCollabs: permissions.canJoinPaidCollabs,
            canInviteToCollab: permissions.canInviteToCollab,
            canEditCollabTerms: permissions.canEditCollabTerms,
            canAccessGenreRestricted: permissions.canAccessGenreRestricted,
            canEarnSkillBadges: permissions.canEarnSkillBadges,
            canFeatureServices: permissions.canFeatureServices,
            canViewServiceAnalytics: permissions.canViewServiceAnalytics,
            canReportServices: permissions.canReportServices,
            canModerateServices: permissions.canModerateServices,
            // Reputation & Dynamic Tiers
            reputationTier: permissions.reputationTier,
            isVerifiedCreator: permissions.isVerifiedCreator,
            isProfessionalReviewer: permissions.isProfessionalReviewer,
            isLabelPartner: permissions.isLabelPartner,
            isMentor: permissions.isMentor,
          }
        }
      });

    } catch (error: any) {
      console.error('Get current user error:', error);
      return NextResponse.json<ApiResponse>({
        success: false,
        error: {
          message: 'Failed to fetch user data',
          code: 'INTERNAL_ERROR',
          details: process.env.NODE_ENV === 'development' ? error.message : undefined
        }
      }, { status: 500 });
    }
  });
}
