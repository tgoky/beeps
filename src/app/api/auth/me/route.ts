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
