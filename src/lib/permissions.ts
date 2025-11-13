// Role-based access control utilities
// Updated to work with new permission system
import type { User, UserRole, ClubMember, ClubMemberRole } from '@prisma/client';

// ============================================================================
// NEW: PERMISSION-BASED CAPABILITIES (Recommended)
// ============================================================================

export interface UserPermissions {
  canCreateStudios: boolean;
  canBookStudios: boolean;
  role: UserRole;
  // Producer-specific permissions
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
  canCreateDeals: boolean;              // Studio owners, producers
  canCreateCollabs: boolean;            // Producers, artists, lyricists
  canCreateBids: boolean;               // Studio owners, producers
  canBookSessions: boolean;             // Most users except studio owners
  canMessageSessionHosts: boolean;      // Communication rights
  canNegotiateCollabTerms: boolean;     // Collab agreement drafting
  canPlaceBids: boolean;                // For bidding sessions
  canAcceptBids: boolean;               // For session hosts only
  canReportSessions: boolean;           // All users for moderation
  canAccessFlashDeals: boolean;         // Premium feature
  canViewSessionAnalytics: boolean;     // Session creators only
  canManageOwnSessions: boolean;        // Edit/delete own sessions
}

/**
 * Check if user can perform an action based on their permissions
 * This is the NEW recommended way to check permissions
 */
export function canPerformAction(
  permissions: UserPermissions,
  action:
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
    | 'collaborateOnBeats'
    | 'createDeals'
    | 'createCollabs'
    | 'createBids'
    | 'bookSessions'
    | 'messageSessionHosts'
    | 'negotiateCollabTerms'
    | 'placeBids'
    | 'acceptBids'
    | 'viewSessionAnalytics'
): boolean {
  switch (action) {
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
    case 'createDeals':
      return permissions.canCreateDeals;
    case 'createCollabs':
      return permissions.canCreateCollabs;
    case 'createBids':
      return permissions.canCreateBids;
    case 'bookSessions':
      return permissions.canBookSessions;
    case 'messageSessionHosts':
      return permissions.canMessageSessionHosts;
    case 'negotiateCollabTerms':
      return permissions.canNegotiateCollabTerms;
    case 'placeBids':
      return permissions.canPlaceBids;
    case 'acceptBids':
      return permissions.canAcceptBids;
    case 'viewSessionAnalytics':
      return permissions.canViewSessionAnalytics;
    default:
      return false;
  }
}

// ============================================================================
// ROLE CAPABILITIES (Legacy - still works but use permissions instead)
// ============================================================================

export const roleCapabilities = {
  ARTIST: {
    canUploadSnippets: true,
    canCreateBeats: false,
    canCreateStudios: false,
    canSellEquipment: false,
    canBookStudios: true,
    canPurchaseBeats: true,
    canJoinCollabs: true,
    canCreateClubs: true,
    // Producer permissions
    canEditProducerProfile: false,
    canAcceptJobs: false,
    canUploadWorks: false,
    canManagePortfolio: false,
    // Client permissions
    canRequestProducerService: true,
    canMessageProducers: true,
    canViewProducerDetails: true,
    // Beat marketplace permissions
    canUploadBeats: false,
    canReviewBeats: true,
    canSplitRoyalties: true,
    canListEquipment: false,
    canCommentOnBeats: true,
    canSendLicensingOffers: true,
    canSetAdvancedPricing: false,
    canCreateBeatCollections: true,
    canViewBeatAnalytics: false,
    canCollaborateOnBeats: true,
    canRequestRemixRights: true,
    // Collabs & Deals permissions
    canCreateDeals: false,
    canCreateCollabs: true,              // Artists can create collabs
    canCreateBids: false,
    canBookSessions: true,               // Can book sessions
    canMessageSessionHosts: true,        // Can message hosts
    canNegotiateCollabTerms: true,       // Can negotiate collab terms
    canPlaceBids: true,                  // Can place bids
    canAcceptBids: false,
    canReportSessions: true,             // Can report sessions
    canAccessFlashDeals: false,          // Upgrade for premium
    canViewSessionAnalytics: false,
    canManageOwnSessions: true,          // Can manage own collabs
  },
  PRODUCER: {
    canUploadSnippets: true,
    canCreateBeats: true,
    canCreateStudios: false, // Default false, can be true if they have a studio
    canSellEquipment: false,
    canBookStudios: true,
    canPurchaseBeats: true,
    canJoinCollabs: true,
    canCreateClubs: true,
    // Producer permissions
    canEditProducerProfile: true,
    canAcceptJobs: true,
    canUploadWorks: true,
    canManagePortfolio: true,
    // Client permissions
    canRequestProducerService: false,
    canMessageProducers: true,
    canViewProducerDetails: true,
    // Beat marketplace permissions
    canUploadBeats: true,
    canReviewBeats: true,
    canSplitRoyalties: true,
    canListEquipment: false,
    canCommentOnBeats: true,
    canSendLicensingOffers: true,
    canSetAdvancedPricing: true,
    canCreateBeatCollections: true,
    canViewBeatAnalytics: true,
    canCollaborateOnBeats: true,
    canRequestRemixRights: true,
    // Collabs & Deals permissions
    canCreateDeals: true,                // Producers can create deals
    canCreateCollabs: true,              // Producers can create collabs
    canCreateBids: true,                 // Producers can create bid sessions
    canBookSessions: true,               // Can book sessions
    canMessageSessionHosts: true,        // Can message hosts
    canNegotiateCollabTerms: true,       // Can negotiate collab terms
    canPlaceBids: true,                  // Can place bids
    canAcceptBids: true,                 // Producers can accept bids on their sessions
    canReportSessions: true,             // Can report sessions
    canAccessFlashDeals: true,           // Producers get premium access
    canViewSessionAnalytics: true,       // Can view analytics on own sessions
    canManageOwnSessions: true,          // Can manage own sessions
  },
  STUDIO_OWNER: {
    canUploadSnippets: false,
    canCreateBeats: false,
    canCreateStudios: true,
    canSellEquipment: false,
    canBookStudios: false,
    canPurchaseBeats: true,
    canJoinCollabs: false,
    canCreateClubs: true,
    // Producer permissions
    canEditProducerProfile: false,
    canAcceptJobs: false,
    canUploadWorks: false,
    canManagePortfolio: false,
    // Client permissions
    canRequestProducerService: false,
    canMessageProducers: true,
    canViewProducerDetails: true,
    // Beat marketplace permissions
    canUploadBeats: false,
    canReviewBeats: true,
    canSplitRoyalties: false,
    canListEquipment: true,
    canCommentOnBeats: false,
    canSendLicensingOffers: false,
    canSetAdvancedPricing: false,
    canCreateBeatCollections: true,
    canViewBeatAnalytics: false,
    canCollaborateOnBeats: false,
    canRequestRemixRights: false,
    // Collabs & Deals permissions
    canCreateDeals: true,                // Studio owners can create deals
    canCreateCollabs: false,             // Studios don't collab
    canCreateBids: true,                 // Can create bid sessions
    canBookSessions: false,              // Studio owners host, don't book
    canMessageSessionHosts: false,       // They are the hosts
    canNegotiateCollabTerms: false,
    canPlaceBids: false,
    canAcceptBids: true,                 // Can accept bids on their sessions
    canReportSessions: true,
    canAccessFlashDeals: true,           // Studio owners get premium access
    canViewSessionAnalytics: true,       // Can view analytics on own sessions
    canManageOwnSessions: true,
  },
  GEAR_SALES: {
    canUploadSnippets: false,
    canCreateBeats: false,
    canCreateStudios: false,
    canSellEquipment: true,
    canBookStudios: true,
    canPurchaseBeats: true,
    canJoinCollabs: false,
    canCreateClubs: true,
    // Producer permissions
    canEditProducerProfile: false,
    canAcceptJobs: false,
    canUploadWorks: false,
    canManagePortfolio: false,
    // Client permissions
    canRequestProducerService: true,
    canMessageProducers: true,
    canViewProducerDetails: true,
    // Beat marketplace permissions
    canUploadBeats: false,
    canReviewBeats: true,
    canSplitRoyalties: false,
    canListEquipment: true,
    canCommentOnBeats: false,
    canSendLicensingOffers: false,
    canSetAdvancedPricing: false,
    canCreateBeatCollections: true,
    canViewBeatAnalytics: false,
    canCollaborateOnBeats: false,
    canRequestRemixRights: false,
    // Collabs & Deals permissions
    canCreateDeals: false,               // Gear sales don't create deals
    canCreateCollabs: false,             // Gear sales don't collab
    canCreateBids: false,
    canBookSessions: true,               // Can book sessions
    canMessageSessionHosts: true,        // Can message hosts
    canNegotiateCollabTerms: false,
    canPlaceBids: true,                  // Can place bids
    canAcceptBids: false,
    canReportSessions: true,             // Can report sessions
    canAccessFlashDeals: false,          // Basic tier
    canViewSessionAnalytics: false,
    canManageOwnSessions: false,
  },
  LYRICIST: {
    canUploadSnippets: true,
    canCreateBeats: false,
    canCreateStudios: false,
    canSellEquipment: false,
    canBookStudios: true,
    canPurchaseBeats: true,
    canJoinCollabs: true,
    canCreateClubs: true,
    // Producer permissions
    canEditProducerProfile: false,
    canAcceptJobs: false,
    canUploadWorks: false,
    canManagePortfolio: false,
    // Client permissions
    canRequestProducerService: true,
    canMessageProducers: true,
    canViewProducerDetails: true,
    // Beat marketplace permissions
    canUploadBeats: false,
    canReviewBeats: true,
    canSplitRoyalties: true,
    canListEquipment: false,
    canCommentOnBeats: true,
    canSendLicensingOffers: true,
    canSetAdvancedPricing: false,
    canCreateBeatCollections: true,
    canViewBeatAnalytics: false,
    canCollaborateOnBeats: true,
    canRequestRemixRights: true,
    // Collabs & Deals permissions
    canCreateDeals: false,
    canCreateCollabs: true,              // Lyricists can create collabs
    canCreateBids: false,
    canBookSessions: true,               // Can book sessions
    canMessageSessionHosts: true,        // Can message hosts
    canNegotiateCollabTerms: true,       // Can negotiate collab terms
    canPlaceBids: true,                  // Can place bids
    canAcceptBids: false,
    canReportSessions: true,             // Can report sessions
    canAccessFlashDeals: false,          // Upgrade for premium
    canViewSessionAnalytics: false,
    canManageOwnSessions: true,          // Can manage own collabs
  },
  OTHER: {
    canUploadSnippets: false,
    canCreateBeats: false,
    canCreateStudios: false,
    canSellEquipment: false,
    canBookStudios: true,
    canPurchaseBeats: true,
    canJoinCollabs: true,
    canCreateClubs: true,
    // Producer permissions
    canEditProducerProfile: false,
    canAcceptJobs: false,
    canUploadWorks: false,
    canManagePortfolio: false,
    // Client permissions
    canRequestProducerService: true,
    canMessageProducers: true,
    canViewProducerDetails: true,
    // Beat marketplace permissions
    canUploadBeats: false,
    canReviewBeats: false,
    canSplitRoyalties: false,
    canListEquipment: false,
    canCommentOnBeats: false,
    canSendLicensingOffers: false,
    canSetAdvancedPricing: false,
    canCreateBeatCollections: true,
    canViewBeatAnalytics: false,
    canCollaborateOnBeats: false,
    canRequestRemixRights: false,
    // Collabs & Deals permissions
    canCreateDeals: false,
    canCreateCollabs: false,             // Other users have limited access
    canCreateBids: false,
    canBookSessions: true,               // Can book sessions
    canMessageSessionHosts: false,       // Limited messaging
    canNegotiateCollabTerms: false,
    canPlaceBids: false,                 // Cannot bid
    canAcceptBids: false,
    canReportSessions: true,             // Can report for moderation
    canAccessFlashDeals: false,
    canViewSessionAnalytics: false,
    canManageOwnSessions: false,
  }
} as const;

// ============================================================================
// PERMISSION CHECK FUNCTIONS (Legacy)
// ============================================================================

export function canUserPerformAction(
  user: Pick<User, 'primaryRole'>,
  action: keyof typeof roleCapabilities.ARTIST
): boolean {
  return roleCapabilities[user.primaryRole][action];
}

export function canUploadBeats(user: Pick<User, 'primaryRole'>): boolean {
  return canUserPerformAction(user, 'canCreateBeats');
}

// Updated: Use new permission system for studio creation
export function canCreateStudio(user: Pick<User, 'primaryRole'>): boolean {
  // This is now deprecated - use permissions.canCreateStudios instead
  // Keeping for backwards compatibility
  return user.primaryRole === 'STUDIO_OWNER';
}

export function canSellEquipment(user: Pick<User, 'primaryRole'>): boolean {
  return canUserPerformAction(user, 'canSellEquipment');
}

export function canUploadSnippets(user: Pick<User, 'primaryRole'>): boolean {
  return canUserPerformAction(user, 'canUploadSnippets');
}

// Updated: Use new permission system for booking
export function canBookStudio(user: Pick<User, 'primaryRole'>): boolean {
  // This is now deprecated - use permissions.canBookStudios instead
  // Keeping for backwards compatibility
  return user.primaryRole !== 'STUDIO_OWNER';
}

// ============================================================================
// NEW: PERMISSION HELPERS
// ============================================================================

/**
 * Determine if a user can create studios based on role and profile
 */
export function determineCanCreateStudios(user: {
  primaryRole: UserRole;
  studioProfile?: { id: string } | null;
}): boolean {
  // Studio owners can always create
  if (user.primaryRole === 'STUDIO_OWNER') {
    return true;
  }

  // Producers can create if they have a studio profile
  if (user.primaryRole === 'PRODUCER' && user.studioProfile) {
    return true;
  }

  return false;
}

/**
 * Determine if a user can book studios based on role
 */
export function determineCanBookStudios(role: UserRole): boolean {
  // Studio owners don't book (they own them)
  return role !== 'STUDIO_OWNER';
}

/**
 * Get full permissions object for a user
 */
export function getUserPermissions(user: {
  primaryRole: UserRole;
  studioProfile?: { id: string } | null;
}): UserPermissions {
  const role = user.primaryRole;
  const capabilities = roleCapabilities[role];

  return {
    canCreateStudios: determineCanCreateStudios(user),
    canBookStudios: determineCanBookStudios(user.primaryRole),
    role: role,
    // Producer permissions
    canEditProducerProfile: capabilities.canEditProducerProfile,
    canAcceptJobs: capabilities.canAcceptJobs,
    canUploadWorks: capabilities.canUploadWorks,
    canManagePortfolio: capabilities.canManagePortfolio,
    // Client permissions
    canRequestProducerService: capabilities.canRequestProducerService,
    canMessageProducers: capabilities.canMessageProducers,
    canViewProducerDetails: capabilities.canViewProducerDetails,
    // Beat marketplace permissions
    canUploadBeats: capabilities.canUploadBeats,
    canPurchaseBeats: capabilities.canPurchaseBeats,
    canReviewBeats: capabilities.canReviewBeats,
    canSplitRoyalties: capabilities.canSplitRoyalties,
    canListEquipment: capabilities.canListEquipment,
    canCommentOnBeats: capabilities.canCommentOnBeats,
    canSendLicensingOffers: capabilities.canSendLicensingOffers,
    canSetAdvancedPricing: capabilities.canSetAdvancedPricing,
    canCreateBeatCollections: capabilities.canCreateBeatCollections,
    canViewBeatAnalytics: capabilities.canViewBeatAnalytics,
    canCollaborateOnBeats: capabilities.canCollaborateOnBeats,
    canRequestRemixRights: capabilities.canRequestRemixRights,
    // Collabs & Deals permissions
    canCreateDeals: capabilities.canCreateDeals,
    canCreateCollabs: capabilities.canCreateCollabs,
    canCreateBids: capabilities.canCreateBids,
    canBookSessions: capabilities.canBookSessions,
    canMessageSessionHosts: capabilities.canMessageSessionHosts,
    canNegotiateCollabTerms: capabilities.canNegotiateCollabTerms,
    canPlaceBids: capabilities.canPlaceBids,
    canAcceptBids: capabilities.canAcceptBids,
    canReportSessions: capabilities.canReportSessions,
    canAccessFlashDeals: capabilities.canAccessFlashDeals,
    canViewSessionAnalytics: capabilities.canViewSessionAnalytics,
    canManageOwnSessions: capabilities.canManageOwnSessions,
  };
}

// ============================================================================
// CLUB PERMISSION CHECKS
// ============================================================================

export function canManageClub(memberRole: ClubMemberRole): boolean {
  return memberRole === 'OWNER' || memberRole === 'ADMIN';
}

export function canInviteMembers(memberRole: ClubMemberRole): boolean {
  return memberRole === 'OWNER' || memberRole === 'ADMIN';
}

export function canRemoveMembers(memberRole: ClubMemberRole): boolean {
  return memberRole === 'OWNER' || memberRole === 'ADMIN';
}

export function canDeleteClub(memberRole: ClubMemberRole): boolean {
  return memberRole === 'OWNER';
}

export function canEditClubResources(memberRole: ClubMemberRole): boolean {
  return memberRole === 'OWNER' || memberRole === 'ADMIN';
}

// ============================================================================
// COMBINED PERMISSION CHECKS
// ============================================================================

interface ClubPermissionCheck {
  user: Pick<User, 'id' | 'primaryRole'>;
  clubMember?: Pick<ClubMember, 'role'> | null;
}

export function canUserManageClubResource(
  { user, clubMember }: ClubPermissionCheck,
  resourceType: 'beat' | 'studio' | 'equipment'
): boolean {
  // Must be a member of the club
  if (!clubMember) return false;

  // Club admins/owners can manage all resources
  if (canManageClub(clubMember.role)) return true;

  // Regular members can only manage resources they're allowed to create
  switch (resourceType) {
    case 'beat':
      return canUploadBeats(user);
    case 'studio':
      return canCreateStudio(user); // Note: This should use new permission system
    case 'equipment':
      return canSellEquipment(user);
    default:
      return false;
  }
}

// ============================================================================
// ERROR MESSAGES
// ============================================================================

export const permissionErrors = {
  CANNOT_UPLOAD_BEATS: 'Only producers can upload beats',
  CANNOT_CREATE_STUDIOS: 'You need studio owner access or be a producer with a studio to create listings',
  CANNOT_BOOK_STUDIOS: 'Your account does not have studio booking access',
  CANNOT_SELL_EQUIPMENT: 'Only gear specialists can sell equipment',
  CANNOT_MANAGE_CLUB: 'You must be an admin or owner to manage this club',
  NOT_CLUB_MEMBER: 'You must be a member of this club',
  CANNOT_DELETE_CLUB: 'Only club owners can delete clubs',
  INSUFFICIENT_PERMISSIONS: 'You do not have permission to perform this action'
} as const;

// ============================================================================
// PERMISSION GUARD DECORATOR
// ============================================================================

export function requirePermission<T extends (...args: any[]) => any>(
  permissionCheck: (user: User) => boolean,
  errorMessage: string
) {
  return function (
    target: any,
    propertyKey: string,
    descriptor: PropertyDescriptor
  ) {
    const originalMethod = descriptor.value;

    descriptor.value = async function (...args: any[]) {
      const user = args[0] as User;

      if (!permissionCheck(user)) {
        throw new Error(errorMessage);
      }

      return originalMethod.apply(this, args);
    };

    return descriptor;
  };
}

// ============================================================================
// TYPE GUARDS
// ============================================================================

export function isProducer(user: Pick<User, 'primaryRole'>): boolean {
  return user.primaryRole === 'PRODUCER';
}

export function isStudioOwner(user: Pick<User, 'primaryRole'>): boolean {
  return user.primaryRole === 'STUDIO_OWNER';
}

export function isArtist(user: Pick<User, 'primaryRole'>): boolean {
  return user.primaryRole === 'ARTIST';
}

export function isGearSpecialist(user: Pick<User, 'primaryRole'>): boolean {
  return user.primaryRole === 'GEAR_SALES';
}

export function isLyricist(user: Pick<User, 'primaryRole'>): boolean {
  return user.primaryRole === 'LYRICIST';
}

// ============================================================================
// ROLE DISPLAY NAMES
// ============================================================================

export const roleDisplayNames: Record<UserRole, string> = {
  ARTIST: 'Artist',
  PRODUCER: 'Producer',
  STUDIO_OWNER: 'Studio Owner',
  GEAR_SALES: 'Gear Specialist',
  LYRICIST: 'Lyricist',
  OTHER: 'Other'
};

export function getRoleDisplayName(role: UserRole): string {
  return roleDisplayNames[role];
}

// ============================================================================
// CLUB ROLE DISPLAY NAMES
// ============================================================================

export const clubRoleDisplayNames: Record<ClubMemberRole, string> = {
  OWNER: 'Owner',
  ADMIN: 'Admin',
  MEMBER: 'Member'
};

export function getClubRoleDisplayName(role: ClubMemberRole): string {
  return clubRoleDisplayNames[role];
}

// ============================================================================
// MIGRATION GUIDE
// ============================================================================

/*
MIGRATION FROM OLD TO NEW SYSTEM:

OLD WAY (Role-based):
```typescript
if (canCreateStudio(user)) {
  // Create studio
}
```

NEW WAY (Permission-based):
```typescript
const permissions = getUserPermissions(user);
if (permissions.canCreateStudios) {
  // Create studio
}
```

OR in API routes with middleware:
```typescript
export async function POST(request: NextRequest) {
  return withAuth(request, async (req) => {
    return withPermission('createStudios', async (req) => {
      // Create studio
    })(req);
  });
}
```

OR manually check permissions:
```typescript
export async function POST(request: NextRequest) {
  return withAuth(request, async (req) => {
    if (!req.permissions?.canCreateStudios) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }
    // Create studio
  });
}
```

BENEFITS OF NEW SYSTEM:
1. Producers with studios can create listings
2. More flexible permission management
3. Cached in Supabase metadata (faster)
4. Easy to extend with new permissions
5. Consistent across client and server
*/