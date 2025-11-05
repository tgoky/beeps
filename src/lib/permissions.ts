// Role-based access control utilities
import type { User, UserRole, ClubMember, ClubMemberRole } from '@prisma/client';

// ============================================================================
// ROLE CAPABILITIES
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
    canCreateStudios: false,
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
    canBookStudios: false,
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
// PERMISSION CHECK FUNCTIONS
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

export function canCreateStudio(user: Pick<User, 'primaryRole'>): boolean {
  return canUserPerformAction(user, 'canCreateStudios');
}

export function canSellEquipment(user: Pick<User, 'primaryRole'>): boolean {
  return canUserPerformAction(user, 'canSellEquipment');
}

export function canUploadSnippets(user: Pick<User, 'primaryRole'>): boolean {
  return canUserPerformAction(user, 'canUploadSnippets');
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
      return canCreateStudio(user);
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
  CANNOT_CREATE_STUDIOS: 'Only studio owners can create studios',
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
      const user = args[0] as User; // Assuming first arg is user

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