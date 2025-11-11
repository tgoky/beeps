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
}

/**
 * Check if user can perform an action based on their permissions
 * This is the NEW recommended way to check permissions
 */
export function canPerformAction(
  permissions: UserPermissions,
  action: 'createStudios' | 'bookStudios'
): boolean {
  switch (action) {
    case 'createStudios':
      return permissions.canCreateStudios;
    case 'bookStudios':
      return permissions.canBookStudios;
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
    canCreateClubs: true
  },
  PRODUCER: {
    canUploadSnippets: true,
    canCreateBeats: true,
    canCreateStudios: false, // Default false, can be true if they have a studio
    canSellEquipment: false,
    canBookStudios: true,
    canPurchaseBeats: true,
    canJoinCollabs: true,
    canCreateClubs: true
  },
  STUDIO_OWNER: {
    canUploadSnippets: false,
    canCreateBeats: false,
    canCreateStudios: true,
    canSellEquipment: false,
    canBookStudios: false,
    canPurchaseBeats: true,
    canJoinCollabs: false,
    canCreateClubs: true
  },
  GEAR_SALES: {
    canUploadSnippets: false,
    canCreateBeats: false,
    canCreateStudios: false,
    canSellEquipment: true,
    canBookStudios: true, // Updated: they can book studios
    canPurchaseBeats: true,
    canJoinCollabs: false,
    canCreateClubs: true
  },
  LYRICIST: {
    canUploadSnippets: true,
    canCreateBeats: false,
    canCreateStudios: false,
    canSellEquipment: false,
    canBookStudios: true,
    canPurchaseBeats: true,
    canJoinCollabs: true,
    canCreateClubs: true
  },
  OTHER: {
    canUploadSnippets: false,
    canCreateBeats: false,
    canCreateStudios: false,
    canSellEquipment: false,
    canBookStudios: true,
    canPurchaseBeats: true,
    canJoinCollabs: true,
    canCreateClubs: true
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
  return {
    canCreateStudios: determineCanCreateStudios(user),
    canBookStudios: determineCanBookStudios(user.primaryRole),
    role: user.primaryRole
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