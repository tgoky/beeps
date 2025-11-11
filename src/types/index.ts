// Type definitions for Beeps platform
// Merged with permission system types
import type { 
  User, 
  UserRole,
  MembershipTier,
  ArtistProfile,
  ProducerProfile,
  StudioOwnerProfile,
  GearSalesProfile,
  LyricistProfile,
  Club,
  ClubType,
  ClubMemberRole,
  Beat,
  BeatType,
  Studio,
  Equipment,
  Booking,
  BookingStatus,
  Transaction,
  TransactionType,
  TransactionStatus,
  Review,
  Activity,
  ActivityType,
  Notification,
  NotificationType
} from '@prisma/client';

// ============================================================================
// NEW: PERMISSION TYPES (for new permission system)
// ============================================================================

export interface UserPermissions {
  canCreateStudios: boolean;
  canBookStudios: boolean;
  role: UserRole;
}

export interface PermissionCheckResult {
  allowed: boolean;
  reason?: string;
}

// ============================================================================
// REGISTRATION & AUTH TYPES (Updated with permissions)
// ============================================================================

export interface RegistrationFormData {
  // Step 1: Account & Role
  email: string;
  username: string;
  password: string;
  confirmPassword?: string;
  role: UserRole;
  
  // Step 2: Profile Info
  fullName: string;
  bio?: string;
  location: string;
  avatar?: string;
  
  // Role-specific fields
  genres?: string[];
  specialties?: string[];
  equipment?: string[];
  experience?: string;
  hasStudio?: boolean; // NEW: For producers
  studioName?: string;
  capacity?: string;
  hourlyRate?: string;
  businessName?: string;
  inventory?: string;
  writingStyle?: string;
  collaborationStyle?: string;
  portfolio?: string;
  customRole?: string;
  interests?: string;
  socialLinks?: {
    instagram?: string;
    youtube?: string;
    soundcloud?: string;
    spotify?: string;
  };
  
  // NEW: Permission flags (calculated during registration)
  canCreateStudios?: boolean;
  canBookStudios?: boolean;
}

export interface LoginFormData {
  email: string;
  password: string;
  rememberMe?: boolean;
}

// ============================================================================
// USER & PROFILE TYPES (Updated)
// ============================================================================

export type UserWithProfiles = User & {
  artistProfile?: ArtistProfile | null;
  producerProfile?: ProducerProfile | null;
  studioProfile?: StudioOwnerProfile | null;
  gearProfile?: GearSalesProfile | null;
  lyricistProfile?: LyricistProfile | null;
};

// NEW: User with permissions
export type UserWithPermissions = UserWithProfiles & {
  permissions?: UserPermissions;
};

export interface UserStats {
  followers: number;
  following: number;
  snippets: number;
  collabs: number;
  completedProjects: number;
  avgRating: number;
}

export interface CreateUserProfilePayload {
  userId: string;
  role: UserRole;
  profileData: Partial<RegistrationFormData>;
}

// ============================================================================
// CLUB / WORKSPACE TYPES
// ============================================================================

export interface CreateClubPayload {
  name: string;
  type: ClubType;
  description?: string;
  icon?: string;
  ownerId: string;
}

export interface ClubWithMembers extends Club {
  members: {
    id: string;
    role: ClubMemberRole;
    user: {
      id: string;
      username: string;
      avatar: string | null;
    };
  }[];
  _count: {
    members: number;
  };
}

// ============================================================================
// MARKETPLACE TYPES
// ============================================================================

export interface CreateBeatPayload {
  title: string;
  description?: string;
  producerId: string;
  clubId?: string;
  bpm: number;
  key?: string;
  price: number;
  type: BeatType;
  genres: string[];
  moods: string[];
  tags?: string[];
  imageUrl?: string;
  audioUrl: string;
}

export interface BeatWithProducer extends Beat {
  producer: {
    id: string;
    username: string;
    fullName: string | null;
    avatar: string | null;
    verified: boolean;
  };
}

export interface CreateStudioPayload {
  name: string;
  description?: string;
  ownerId: string;
  clubId?: string;
  location: string;
  latitude?: number;
  longitude?: number;
  hourlyRate: number;
  equipment: string[];
  capacity?: string;
  imageUrl?: string;
}

export interface StudioWithOwner extends Studio {
  owner: {
    id: string;
    userId: string;
    user: {
      username: string;
      fullName: string | null;
      avatar: string | null;
      verified: boolean;
    };
  };
}

// ============================================================================
// BOOKING TYPES
// ============================================================================

export interface CreateBookingPayload {
  studioId: string;
  userId: string;
  startTime: Date;
  endTime: Date;
  notes?: string;
}

export interface BookingWithDetails extends Booking {
  studio: {
    id: string;
    name: string;
    location: string;
    hourlyRate: number;
  };
  user: {
    id: string;
    username: string;
    fullName: string | null;
    avatar: string | null;
  };
}

// ============================================================================
// TRANSACTION TYPES
// ============================================================================

export interface CreateTransactionPayload {
  userId: string;
  type: TransactionType;
  amount: number;
  referenceId?: string;
  referenceType?: string;
  paymentMethod?: string;
}

// ============================================================================
// SOCIAL TYPES
// ============================================================================

export interface CreateReviewPayload {
  authorId: string;
  targetId: string;
  studioId?: string;
  rating: number;
  comment: string;
  projectName?: string;
}

export interface ReviewWithAuthor extends Review {
  author: {
    id: string;
    username: string;
    fullName: string | null;
    avatar: string | null;
    verified: boolean;
  };
}

export interface CreateActivityPayload {
  userId: string;
  type: ActivityType;
  title: string;
  description?: string;
  referenceId?: string;
  referenceType?: string;
}

// ============================================================================
// AUDITION TYPES (Your existing types)
// ============================================================================

export type AuditionType = 'artist' | 'producer' | 'lyricist' | 'writer' | 'general';

export interface AuditionBaseProps {
  jobTitle: string;
  clientName: string;
  budget: string;
  deadline: string;
  requirements: string[];
  type: AuditionType;
}

export interface AuditionSpecificFields {
  artist?: {
    vocalRange?: string;  // string as per your spec
    performanceType?: string[];
    influences?: string[];
  };
  producer?: {
    genres: string[];
    equipment?: string;
  };
  lyricist?: {
    languages: string[];
    specialties?: string[];
  };
}

// ============================================================================
// API RESPONSE TYPES
// ============================================================================

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: {
    message: string;
    code?: string;
    details?: any;
  };
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// ============================================================================
// FILTER & QUERY TYPES
// ============================================================================

export interface BeatFilters {
  genres?: string[];
  moods?: string[];
  minPrice?: number;
  maxPrice?: number;
  bpmRange?: { min: number; max: number };
  type?: BeatType;
  search?: string;
}

export interface StudioFilters {
  location?: string;
  maxDistance?: number;
  minHourlyRate?: number;
  maxHourlyRate?: number;
  equipment?: string[];
  search?: string;
}

export interface PaginationParams {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

// ============================================================================
// NEW: PERMISSION CHECKER CLASS
// ============================================================================

export class PermissionChecker {
  private permissions: UserPermissions;

  constructor(permissions: UserPermissions) {
    this.permissions = permissions;
  }

  canCreateStudios(): PermissionCheckResult {
    if (this.permissions.canCreateStudios) {
      return { allowed: true };
    }
    return {
      allowed: false,
      reason: 'You need studio owner access or be a producer with a studio to create listings'
    };
  }

  canBookStudios(): PermissionCheckResult {
    if (this.permissions.canBookStudios) {
      return { allowed: true };
    }
    return {
      allowed: false,
      reason: 'Your account type does not have studio booking access'
    };
  }

  canAccessFeature(feature: 'createStudios' | 'bookStudios'): boolean {
    switch (feature) {
      case 'createStudios':
        return this.permissions.canCreateStudios;
      case 'bookStudios':
        return this.permissions.canBookStudios;
      default:
        return false;
    }
  }

  getRoleName(): string {
    const roleNames: Record<UserRole, string> = {
      ARTIST: 'Artist',
      PRODUCER: 'Producer',
      STUDIO_OWNER: 'Studio Owner',
      GEAR_SALES: 'Gear Specialist',
      LYRICIST: 'Lyricist',
      OTHER: 'Music Enthusiast'
    };
    return roleNames[this.permissions.role] || 'User';
  }
}

// ============================================================================
// UTILITY TYPES
// ============================================================================

export type Optional<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;

export type RequireAtLeastOne<T, Keys extends keyof T = keyof T> = 
  Pick<T, Exclude<keyof T, Keys>> & 
  {
    [K in Keys]-?: Required<Pick<T, K>> & Partial<Pick<T, Exclude<Keys, K>>>
  }[Keys];

// ============================================================================
// ENUMS EXPORT (for easier imports)
// ============================================================================

export {
  UserRole,
  MembershipTier,
  ClubType,
  ClubMemberRole,
  BeatType,
  BookingStatus,
  TransactionType,
  TransactionStatus,
  ActivityType,
  NotificationType
};