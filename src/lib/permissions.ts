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
  // Equipment/Gear marketplace permissions
  canListGearForSale: boolean;          // List equipment for sale
  canListGearForRent: boolean;          // List equipment for rent
  canPurchaseGear: boolean;             // Buy equipment
  canRentGear: boolean;                 // Rent equipment
  canCreateGearAuction: boolean;        // Create auction listings
  canPlaceGearBids: boolean;            // Bid on auctions
  canAcceptGearBids: boolean;           // Accept bids on own auctions
  canListVintageGear: boolean;          // List vintage/high-value gear (requires verification)
  canVerifyGearOwnership: boolean;      // Upload proof of ownership
  canAccessVIPGearDrops: boolean;       // Access exclusive gear drops
  canAddGearToClub: boolean;            // Add gear to club inventory
  canRemoveGearFromClub: boolean;       // Remove gear from club inventory
  canRentClubGear: boolean;             // Rent gear owned by clubs
  canManageClubGearInventory: boolean;  // Manage club gear as admin
  canInitiateGroupRental: boolean;      // Start group rental (3+ people)
  canJoinGroupRental: boolean;          // Join existing group rental
  canSplitRentalCosts: boolean;         // Participate in cost splitting
  canReviewGear: boolean;               // Review equipment after rental/purchase
  canReportGear: boolean;               // Report fraudulent listings
  canViewGearAnalytics: boolean;        // View analytics on own listings
  canManageOwnGearListings: boolean;    // Edit/delete own gear listings
  canOfferGearDelivery: boolean;        // Offer delivery service
  canRequestLocalPickup: boolean;       // Request local pickup
  canAccessGeofencedGear: boolean;      // Access location-restricted gear
  canAccessPremiumGear: boolean;        // Access premium/exclusive gear
  hasGearCollectorTier: boolean;        // Gear collector tier status
  isCertifiedGearDealer: boolean;       // Certified dealer status
  // Music Services marketplace permissions
  canUploadSnippets: boolean;           // Upload music snippets/previews
  canPostLyrics: boolean;               // Share lyrics publicly
  canPostLyricsToClub: boolean;         // Share lyrics to clubs only
  canPostLyricsToFollowers: boolean;    // Share lyrics to followers only
  canCreateCollabRequest: boolean;      // Post collaboration requests
  canCreateWriterGigs: boolean;         // Post songwriter/writer opportunities
  canHostAuditions: boolean;            // Create audition postings
  canSubmitToAuditions: boolean;        // Submit to auditions
  canSubmitAnonymousAudition: boolean;  // Submit anonymously
  canViewLyrics: boolean;               // View lyrics content
  canViewPrivateLyrics: boolean;        // View club/follower-only lyrics
  canGiveFeedback: boolean;             // Leave feedback/comments
  canGiveProfessionalReview: boolean;   // Paid professional reviews
  canPostLabelOpportunity: boolean;     // Post as label/industry
  canUseScoutingMode: boolean;          // Anonymous talent scouting
  canViewAuditionsByType: boolean;      // View role-specific auditions
  canProposeRevenueSplit: boolean;      // Propose collab revenue splits
  canJoinPaidCollabs: boolean;          // Join paid collaborations
  canInviteToCollab: boolean;           // Invite others to collabs
  canEditCollabTerms: boolean;          // Edit collab terms after creation
  canAccessGenreRestricted: boolean;    // Access genre-locked content
  canEarnSkillBadges: boolean;          // Earn certification badges
  canFeatureServices: boolean;          // Feature services in trending
  canViewServiceAnalytics: boolean;     // View analytics on own services
  canReportServices: boolean;           // Report inappropriate services
  canModerateServices: boolean;         // Moderate service content
  // Reputation & Dynamic Tiers (computed)
  reputationTier: 'newbie' | 'rising' | 'verified' | 'pro' | 'industry';
  isVerifiedCreator: boolean;           // Verified creator badge
  isProfessionalReviewer: boolean;      // Professional reviewer certification
  isLabelPartner: boolean;              // Label/A&R status
  isMentor: boolean;                    // Mentor/coaching status
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
    | 'listGearForSale'
    | 'listGearForRent'
    | 'purchaseGear'
    | 'rentGear'
    | 'createGearAuction'
    | 'placeGearBids'
    | 'reviewGear'
    | 'accessVIPGearDrops'
    | 'manageClubGearInventory'
    | 'initiateGroupRental'
    // Music Services permissions
    | 'uploadSnippets'
    | 'postLyrics'
    | 'postLyricsToClub'
    | 'postLyricsToFollowers'
    | 'createCollabRequest'
    | 'createWriterGigs'
    | 'hostAuditions'
    | 'submitToAuditions'
    | 'submitAnonymousAudition'
    | 'viewLyrics'
    | 'viewPrivateLyrics'
    | 'giveFeedback'
    | 'giveProfessionalReview'
    | 'postLabelOpportunity'
    | 'useScoutingMode'
    | 'viewAuditionsByType'
    | 'proposeRevenueSplit'
    | 'joinPaidCollabs'
    | 'inviteToCollab'
    | 'editCollabTerms'
    | 'accessGenreRestricted'
    | 'earnSkillBadges'
    | 'featureServices'
    | 'viewServiceAnalytics'
    | 'reportServices'
    | 'moderateServices'
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
    case 'listGearForSale':
      return permissions.canListGearForSale;
    case 'listGearForRent':
      return permissions.canListGearForRent;
    case 'purchaseGear':
      return permissions.canPurchaseGear;
    case 'rentGear':
      return permissions.canRentGear;
    case 'createGearAuction':
      return permissions.canCreateGearAuction;
    case 'placeGearBids':
      return permissions.canPlaceGearBids;
    case 'reviewGear':
      return permissions.canReviewGear;
    case 'accessVIPGearDrops':
      return permissions.canAccessVIPGearDrops;
    case 'manageClubGearInventory':
      return permissions.canManageClubGearInventory;
    case 'initiateGroupRental':
      return permissions.canInitiateGroupRental;
    // Music Services permissions
    case 'uploadSnippets':
      return permissions.canUploadSnippets;
    case 'postLyrics':
      return permissions.canPostLyrics;
    case 'postLyricsToClub':
      return permissions.canPostLyricsToClub;
    case 'postLyricsToFollowers':
      return permissions.canPostLyricsToFollowers;
    case 'createCollabRequest':
      return permissions.canCreateCollabRequest;
    case 'createWriterGigs':
      return permissions.canCreateWriterGigs;
    case 'hostAuditions':
      return permissions.canHostAuditions;
    case 'submitToAuditions':
      return permissions.canSubmitToAuditions;
    case 'submitAnonymousAudition':
      return permissions.canSubmitAnonymousAudition;
    case 'viewLyrics':
      return permissions.canViewLyrics;
    case 'viewPrivateLyrics':
      return permissions.canViewPrivateLyrics;
    case 'giveFeedback':
      return permissions.canGiveFeedback;
    case 'giveProfessionalReview':
      return permissions.canGiveProfessionalReview;
    case 'postLabelOpportunity':
      return permissions.canPostLabelOpportunity;
    case 'useScoutingMode':
      return permissions.canUseScoutingMode;
    case 'viewAuditionsByType':
      return permissions.canViewAuditionsByType;
    case 'proposeRevenueSplit':
      return permissions.canProposeRevenueSplit;
    case 'joinPaidCollabs':
      return permissions.canJoinPaidCollabs;
    case 'inviteToCollab':
      return permissions.canInviteToCollab;
    case 'editCollabTerms':
      return permissions.canEditCollabTerms;
    case 'accessGenreRestricted':
      return permissions.canAccessGenreRestricted;
    case 'earnSkillBadges':
      return permissions.canEarnSkillBadges;
    case 'featureServices':
      return permissions.canFeatureServices;
    case 'viewServiceAnalytics':
      return permissions.canViewServiceAnalytics;
    case 'reportServices':
      return permissions.canReportServices;
    case 'moderateServices':
      return permissions.canModerateServices;
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
    // Equipment/Gear marketplace permissions
    canListGearForSale: true,            // Artists can sell personal gear
    canListGearForRent: true,            // Can rent out gear
    canPurchaseGear: true,               // Can buy equipment
    canRentGear: true,                   // Can rent equipment
    canCreateGearAuction: false,         // No auction creation
    canPlaceGearBids: true,              // Can bid on auctions
    canAcceptGearBids: false,            // Cannot accept bids
    canListVintageGear: false,           // No vintage gear listing
    canVerifyGearOwnership: true,        // Can verify ownership
    canAccessVIPGearDrops: false,        // No VIP access
    canAddGearToClub: true,              // Can add to club
    canRemoveGearFromClub: false,        // Cannot remove (admin only)
    canRentClubGear: true,               // Can rent club gear
    canManageClubGearInventory: false,   // No inventory management
    canInitiateGroupRental: true,        // Can start group rentals
    canJoinGroupRental: true,            // Can join group rentals
    canSplitRentalCosts: true,           // Can split costs
    canReviewGear: true,                 // Can review gear
    canReportGear: true,                 // Can report gear
    canViewGearAnalytics: false,         // No analytics
    canManageOwnGearListings: true,      // Can manage own listings
    canOfferGearDelivery: false,         // No delivery service
    canRequestLocalPickup: true,         // Can request pickup
    canAccessGeofencedGear: true,        // Can access local gear
    canAccessPremiumGear: false,         // No premium access
    hasGearCollectorTier: false,         // No collector status
    isCertifiedGearDealer: false,        // Not a dealer
    // Music Services permissions
    canPostLyrics: true,                 // Can share lyrics publicly
    canPostLyricsToClub: true,           // Can share lyrics to clubs
    canPostLyricsToFollowers: true,      // Can share lyrics to followers
    canCreateCollabRequest: true,        // Can post collab requests
    canCreateWriterGigs: false,          // Limited to lyricists/writers
    canHostAuditions: false,             // Producers/labels host auditions
    canSubmitToAuditions: true,          // Can submit to auditions
    canSubmitAnonymousAudition: true,    // Can submit anonymously
    canViewLyrics: true,                 // Can view public lyrics
    canViewPrivateLyrics: false,         // Needs follower/club membership
    canGiveFeedback: true,               // Can leave feedback/comments
    canGiveProfessionalReview: false,    // Needs certification
    canPostLabelOpportunity: false,      // Labels only
    canUseScoutingMode: false,           // Labels only
    canViewAuditionsByType: true,        // Can view artist auditions
    canProposeRevenueSplit: true,        // Can propose revenue splits
    canJoinPaidCollabs: true,            // Can join paid collaborations
    canInviteToCollab: true,             // Can invite others to collabs
    canEditCollabTerms: true,            // Can edit collab terms
    canAccessGenreRestricted: false,     // Needs genre certification
    canEarnSkillBadges: true,            // Can earn skill badges
    canFeatureServices: false,           // Premium/verified only
    canViewServiceAnalytics: true,       // Can view own analytics
    canReportServices: true,             // Can report inappropriate content
    canModerateServices: false,          // Admin only
    // Reputation & Dynamic Tiers (defaults, computed at runtime)
    reputationTier: 'newbie' as const,
    isVerifiedCreator: false,
    isProfessionalReviewer: false,
    isLabelPartner: false,
    isMentor: false,
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
    // Equipment/Gear marketplace permissions
    canListGearForSale: true,            // Producers can sell gear
    canListGearForRent: true,            // Can rent out gear
    canPurchaseGear: true,               // Can buy equipment
    canRentGear: true,                   // Can rent equipment
    canCreateGearAuction: true,          // Can create auctions
    canPlaceGearBids: true,              // Can bid on auctions
    canAcceptGearBids: true,             // Can accept bids on own auctions
    canListVintageGear: true,            // Can list vintage gear (with verification)
    canVerifyGearOwnership: true,        // Can verify ownership
    canAccessVIPGearDrops: true,         // VIP access for producers
    canAddGearToClub: true,              // Can add to club
    canRemoveGearFromClub: false,        // Cannot remove (admin only)
    canRentClubGear: true,               // Can rent club gear
    canManageClubGearInventory: false,   // No inventory management (admin only)
    canInitiateGroupRental: true,        // Can start group rentals
    canJoinGroupRental: true,            // Can join group rentals
    canSplitRentalCosts: true,           // Can split costs
    canReviewGear: true,                 // Can review gear
    canReportGear: true,                 // Can report gear
    canViewGearAnalytics: true,          // Can view analytics on own listings
    canManageOwnGearListings: true,      // Can manage own listings
    canOfferGearDelivery: true,          // Can offer delivery
    canRequestLocalPickup: true,         // Can request pickup
    canAccessGeofencedGear: true,        // Can access local gear
    canAccessPremiumGear: true,          // Premium gear access
    hasGearCollectorTier: false,         // No auto collector status
    isCertifiedGearDealer: false,        // Not auto certified
    // Music Services permissions
    canPostLyrics: true,                 // Can share lyrics publicly
    canPostLyricsToClub: true,           // Can share lyrics to clubs
    canPostLyricsToFollowers: true,      // Can share lyrics to followers
    canCreateCollabRequest: true,        // Can post collab requests
    canCreateWriterGigs: true,           // Producers can post writer gigs
    canHostAuditions: true,              // FULL - Producers host auditions
    canSubmitToAuditions: true,          // Can also submit to auditions
    canSubmitAnonymousAudition: true,    // Can submit anonymously
    canViewLyrics: true,                 // Can view public lyrics
    canViewPrivateLyrics: false,         // Needs follower/club membership
    canGiveFeedback: true,               // Can leave feedback/comments
    canGiveProfessionalReview: false,    // Needs certification
    canPostLabelOpportunity: false,      // Labels only
    canUseScoutingMode: false,           // Labels only
    canViewAuditionsByType: true,        // Can view producer auditions
    canProposeRevenueSplit: true,        // FULL - Can propose revenue splits
    canJoinPaidCollabs: true,            // Can join paid collaborations
    canInviteToCollab: true,             // FULL - Can invite others to collabs
    canEditCollabTerms: true,            // Can edit collab terms
    canAccessGenreRestricted: false,     // Needs genre certification
    canEarnSkillBadges: true,            // Can earn skill badges
    canFeatureServices: false,           // Premium/verified only
    canViewServiceAnalytics: true,       // FULL - Can view own analytics
    canReportServices: true,             // Can report inappropriate content
    canModerateServices: false,          // Admin only
    // Reputation & Dynamic Tiers (defaults, computed at runtime)
    reputationTier: 'newbie' as const,
    isVerifiedCreator: false,
    isProfessionalReviewer: false,
    isLabelPartner: false,
    isMentor: false,
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
    // Equipment/Gear marketplace permissions
    canListGearForSale: true,            // Can list professional gear
    canListGearForRent: true,            // Can rent out studio equipment
    canPurchaseGear: true,               // Can buy equipment
    canRentGear: true,                   // Can rent equipment
    canCreateGearAuction: true,          // Can create auctions
    canPlaceGearBids: true,              // Can bid on auctions
    canAcceptGearBids: true,             // Can accept bids
    canListVintageGear: true,            // Can list vintage gear
    canVerifyGearOwnership: true,        // Can verify ownership
    canAccessVIPGearDrops: true,         // VIP access
    canAddGearToClub: true,              // Can add to club
    canRemoveGearFromClub: true,         // Studio owners can manage club inventory
    canRentClubGear: false,              // Owns, doesn't rent
    canManageClubGearInventory: true,    // Can manage inventory as business owner
    canInitiateGroupRental: false,       // Doesn't rent
    canJoinGroupRental: false,           // Doesn't rent
    canSplitRentalCosts: false,          // Doesn't rent
    canReviewGear: true,                 // Can review gear
    canReportGear: true,                 // Can report gear
    canViewGearAnalytics: true,          // Full analytics
    canManageOwnGearListings: true,      // Can manage own listings
    canOfferGearDelivery: true,          // Can offer delivery
    canRequestLocalPickup: false,        // Doesn't need pickup
    canAccessGeofencedGear: true,        // Can access local gear
    canAccessPremiumGear: true,          // Premium access
    hasGearCollectorTier: false,         // Business, not collector
    isCertifiedGearDealer: false,        // Not auto certified (business entity)
    // Music Services permissions - LIMITED (business-focused)
    canPostLyrics: false,                // Limited creative content
    canPostLyricsToClub: false,          // Limited creative content
    canPostLyricsToFollowers: false,     // Limited creative content
    canCreateCollabRequest: false,       // Business entity
    canCreateWriterGigs: false,          // Limited posting
    canHostAuditions: true,              // Can host auditions for studio work
    canSubmitToAuditions: false,         // Business entity
    canSubmitAnonymousAudition: false,   // Business entity
    canViewLyrics: true,                 // Can view public lyrics
    canViewPrivateLyrics: false,         // Limited access
    canGiveFeedback: true,               // Can leave feedback
    canGiveProfessionalReview: false,    // Needs certification
    canPostLabelOpportunity: false,      // Not a label
    canUseScoutingMode: false,           // Limited talent scouting
    canViewAuditionsByType: true,        // Can view all auditions
    canProposeRevenueSplit: false,       // Business model
    canJoinPaidCollabs: false,           // Business entity
    canInviteToCollab: false,            // Business entity
    canEditCollabTerms: false,           // Business entity
    canAccessGenreRestricted: false,     // Limited access
    canEarnSkillBadges: false,           // Business entity
    canFeatureServices: false,           // Premium/verified only
    canViewServiceAnalytics: true,       // Can view analytics
    canReportServices: true,             // Can report content
    canModerateServices: false,          // Admin only
    // Reputation & Dynamic Tiers (defaults, computed at runtime)
    reputationTier: 'newbie' as const,
    isVerifiedCreator: false,
    isProfessionalReviewer: false,
    isLabelPartner: false,
    isMentor: false,
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
    // Equipment/Gear marketplace permissions - FULL ACCESS (Primary marketplace)
    canListGearForSale: true,            // FULL - primary function
    canListGearForRent: true,            // FULL - can rent gear
    canPurchaseGear: true,               // Can buy for inventory
    canRentGear: true,                   // Can rent equipment
    canCreateGearAuction: true,          // FULL - can create auctions
    canPlaceGearBids: true,              // Can bid on auctions
    canAcceptGearBids: true,             // FULL - can accept bids
    canListVintageGear: true,            // FULL - specialty vintage gear
    canVerifyGearOwnership: true,        // FULL - can verify authenticity
    canAccessVIPGearDrops: true,         // FULL - VIP dealer access
    canAddGearToClub: true,              // Can add to club
    canRemoveGearFromClub: true,         // Can manage club inventory
    canRentClubGear: true,               // Can rent club gear
    canManageClubGearInventory: true,    // FULL - can manage as dealer
    canInitiateGroupRental: true,        // Can start group rentals
    canJoinGroupRental: true,            // Can join group rentals
    canSplitRentalCosts: true,           // Can split costs
    canReviewGear: true,                 // Can review gear
    canReportGear: true,                 // Can report gear
    canViewGearAnalytics: true,          // FULL - analytics on own listings
    canManageOwnGearListings: true,      // FULL - manage all listings
    canOfferGearDelivery: true,          // FULL - professional delivery
    canRequestLocalPickup: true,         // Can request pickup
    canAccessGeofencedGear: true,        // Can access local gear
    canAccessPremiumGear: true,          // FULL - premium dealer access
    hasGearCollectorTier: true,          // FULL - gear collector tier
    isCertifiedGearDealer: true,         // FULL - certified dealer status
    // Music Services permissions - VERY LIMITED (gear sales focus)
    canPostLyrics: false,                // No creative content
    canPostLyricsToClub: false,          // No creative content
    canPostLyricsToFollowers: false,     // No creative content
    canCreateCollabRequest: false,       // Gear sales don't collab
    canCreateWriterGigs: false,          // No gig posting
    canHostAuditions: false,             // No audition hosting
    canSubmitToAuditions: false,         // Gear sales role
    canSubmitAnonymousAudition: false,   // Gear sales role
    canViewLyrics: true,                 // Can view public lyrics
    canViewPrivateLyrics: false,         // Limited access
    canGiveFeedback: true,               // Can leave feedback
    canGiveProfessionalReview: false,    // Not a music reviewer
    canPostLabelOpportunity: false,      // Not a label
    canUseScoutingMode: false,           // Limited access
    canViewAuditionsByType: false,       // Limited access
    canProposeRevenueSplit: false,       // No collab features
    canJoinPaidCollabs: false,           // No collab features
    canInviteToCollab: false,            // No collab features
    canEditCollabTerms: false,           // No collab features
    canAccessGenreRestricted: false,     // Limited access
    canEarnSkillBadges: false,           // Gear sales role
    canFeatureServices: false,           // Limited access
    canViewServiceAnalytics: false,      // Limited access
    canReportServices: true,             // Can report content
    canModerateServices: false,          // Admin only
    // Reputation & Dynamic Tiers (defaults, computed at runtime)
    reputationTier: 'newbie' as const,
    isVerifiedCreator: false,
    isProfessionalReviewer: false,
    isLabelPartner: false,
    isMentor: false,
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
    // Equipment/Gear marketplace permissions
    canListGearForSale: true,            // Can sell personal gear
    canListGearForRent: true,            // Can rent out gear
    canPurchaseGear: true,               // Can buy equipment
    canRentGear: true,                   // Can rent equipment
    canCreateGearAuction: false,         // No auction creation
    canPlaceGearBids: true,              // Can bid on auctions
    canAcceptGearBids: false,            // Cannot accept bids
    canListVintageGear: false,           // No vintage gear
    canVerifyGearOwnership: true,        // Can verify ownership
    canAccessVIPGearDrops: false,        // No VIP access
    canAddGearToClub: true,              // Can add to club
    canRemoveGearFromClub: false,        // Cannot remove
    canRentClubGear: true,               // Can rent club gear
    canManageClubGearInventory: false,   // No inventory management
    canInitiateGroupRental: true,        // Can start group rentals
    canJoinGroupRental: true,            // Can join group rentals
    canSplitRentalCosts: true,           // Can split costs
    canReviewGear: true,                 // Can review gear
    canReportGear: true,                 // Can report gear
    canViewGearAnalytics: false,         // No analytics
    canManageOwnGearListings: true,      // Can manage own listings
    canOfferGearDelivery: false,         // No delivery service
    canRequestLocalPickup: true,         // Can request pickup
    canAccessGeofencedGear: true,        // Can access local gear
    canAccessPremiumGear: false,         // No premium access
    hasGearCollectorTier: false,         // No collector status
    isCertifiedGearDealer: false,        // Not a dealer
    // Music Services permissions - FULL LYRICS & WRITING ACCESS
    canPostLyrics: true,                 // FULL - primary function
    canPostLyricsToClub: true,           // FULL - privacy controls
    canPostLyricsToFollowers: true,      // FULL - privacy controls
    canCreateCollabRequest: true,        // Can post collab requests
    canCreateWriterGigs: true,           // FULL - writer gig posting
    canHostAuditions: false,             // Limited audition hosting
    canSubmitToAuditions: true,          // Can submit to auditions
    canSubmitAnonymousAudition: true,    // Can submit anonymously
    canViewLyrics: true,                 // Can view public lyrics
    canViewPrivateLyrics: false,         // Needs follower/club membership
    canGiveFeedback: true,               // Can leave feedback/comments
    canGiveProfessionalReview: false,    // Needs certification
    canPostLabelOpportunity: false,      // Labels only
    canUseScoutingMode: false,           // Labels only
    canViewAuditionsByType: true,        // Can view lyricist auditions
    canProposeRevenueSplit: true,        // FULL - Can propose revenue splits
    canJoinPaidCollabs: true,            // Can join paid collaborations
    canInviteToCollab: true,             // Can invite others to collabs
    canEditCollabTerms: true,            // Can edit collab terms
    canAccessGenreRestricted: false,     // Needs genre certification
    canEarnSkillBadges: true,            // Can earn skill badges
    canFeatureServices: false,           // Premium/verified only
    canViewServiceAnalytics: true,       // Can view own analytics
    canReportServices: true,             // Can report inappropriate content
    canModerateServices: false,          // Admin only
    // Reputation & Dynamic Tiers (defaults, computed at runtime)
    reputationTier: 'newbie' as const,
    isVerifiedCreator: false,
    isProfessionalReviewer: false,
    isLabelPartner: false,
    isMentor: false,
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
    // Equipment/Gear marketplace permissions
    canListGearForSale: false,           // Very limited - cannot sell
    canListGearForRent: false,           // Cannot rent out
    canPurchaseGear: true,               // Can buy equipment
    canRentGear: true,                   // Can rent equipment
    canCreateGearAuction: false,         // No auction creation
    canPlaceGearBids: false,             // Cannot bid
    canAcceptGearBids: false,            // Cannot accept bids
    canListVintageGear: false,           // No vintage gear
    canVerifyGearOwnership: false,       // No verification
    canAccessVIPGearDrops: false,        // No VIP access
    canAddGearToClub: false,             // Cannot add to club
    canRemoveGearFromClub: false,        // Cannot remove
    canRentClubGear: true,               // Can rent club gear
    canManageClubGearInventory: false,   // No inventory management
    canInitiateGroupRental: false,       // Cannot start group rentals
    canJoinGroupRental: true,            // Can join existing group rentals
    canSplitRentalCosts: true,           // Can split costs
    canReviewGear: true,                 // Can review gear
    canReportGear: true,                 // Can report gear
    canViewGearAnalytics: false,         // No analytics
    canManageOwnGearListings: false,     // No listings to manage
    canOfferGearDelivery: false,         // No delivery service
    canRequestLocalPickup: true,         // Can request pickup
    canAccessGeofencedGear: true,        // Can access local gear
    canAccessPremiumGear: false,         // No premium access
    hasGearCollectorTier: false,         // No collector status
    isCertifiedGearDealer: false,        // Not a dealer
    // Music Services permissions - VERY LIMITED (view-only mostly)
    canPostLyrics: false,                // No posting
    canPostLyricsToClub: false,          // No posting
    canPostLyricsToFollowers: false,     // No posting
    canCreateCollabRequest: false,       // No posting
    canCreateWriterGigs: false,          // No posting
    canHostAuditions: false,             // No hosting
    canSubmitToAuditions: false,         // No submissions
    canSubmitAnonymousAudition: false,   // No submissions
    canViewLyrics: true,                 // Can view public lyrics
    canViewPrivateLyrics: false,         // No private access
    canGiveFeedback: false,              // Limited feedback
    canGiveProfessionalReview: false,    // No reviewing
    canPostLabelOpportunity: false,      // No label features
    canUseScoutingMode: false,           // No scouting
    canViewAuditionsByType: false,       // Limited audition viewing
    canProposeRevenueSplit: false,       // No collab features
    canJoinPaidCollabs: false,           // No collab features
    canInviteToCollab: false,            // No collab features
    canEditCollabTerms: false,           // No collab features
    canAccessGenreRestricted: false,     // No restricted access
    canEarnSkillBadges: false,           // No skill progression
    canFeatureServices: false,           // No featuring
    canViewServiceAnalytics: false,      // No analytics
    canReportServices: true,             // Can report content
    canModerateServices: false,          // Admin only
    // Reputation & Dynamic Tiers (defaults, computed at runtime)
    reputationTier: 'newbie' as const,
    isVerifiedCreator: false,
    isProfessionalReviewer: false,
    isLabelPartner: false,
    isMentor: false,
  }
} as const;

// ============================================================================
// PERMISSION CHECK FUNCTIONS (Legacy)
// ============================================================================

// Type to exclude non-boolean fields from roleCapabilities
type BooleanPermissionKeys = {
  [K in keyof typeof roleCapabilities.ARTIST]: typeof roleCapabilities.ARTIST[K] extends boolean ? K : never;
}[keyof typeof roleCapabilities.ARTIST];

export function canUserPerformAction(
  user: Pick<User, 'primaryRole'>,
  action: BooleanPermissionKeys
): boolean {
  return roleCapabilities[user.primaryRole][action] as boolean;
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
    // Equipment/Gear marketplace permissions
    canListGearForSale: capabilities.canListGearForSale,
    canListGearForRent: capabilities.canListGearForRent,
    canPurchaseGear: capabilities.canPurchaseGear,
    canRentGear: capabilities.canRentGear,
    canCreateGearAuction: capabilities.canCreateGearAuction,
    canPlaceGearBids: capabilities.canPlaceGearBids,
    canAcceptGearBids: capabilities.canAcceptGearBids,
    canListVintageGear: capabilities.canListVintageGear,
    canVerifyGearOwnership: capabilities.canVerifyGearOwnership,
    canAccessVIPGearDrops: capabilities.canAccessVIPGearDrops,
    canAddGearToClub: capabilities.canAddGearToClub,
    canRemoveGearFromClub: capabilities.canRemoveGearFromClub,
    canRentClubGear: capabilities.canRentClubGear,
    canManageClubGearInventory: capabilities.canManageClubGearInventory,
    canInitiateGroupRental: capabilities.canInitiateGroupRental,
    canJoinGroupRental: capabilities.canJoinGroupRental,
    canSplitRentalCosts: capabilities.canSplitRentalCosts,
    canReviewGear: capabilities.canReviewGear,
    canReportGear: capabilities.canReportGear,
    canViewGearAnalytics: capabilities.canViewGearAnalytics,
    canManageOwnGearListings: capabilities.canManageOwnGearListings,
    canOfferGearDelivery: capabilities.canOfferGearDelivery,
    canRequestLocalPickup: capabilities.canRequestLocalPickup,
    canAccessGeofencedGear: capabilities.canAccessGeofencedGear,
    canAccessPremiumGear: capabilities.canAccessPremiumGear,
    hasGearCollectorTier: capabilities.hasGearCollectorTier,
    isCertifiedGearDealer: capabilities.isCertifiedGearDealer,
    // Music Services marketplace permissions
    canUploadSnippets: capabilities.canUploadSnippets,
    canPostLyrics: capabilities.canPostLyrics,
    canPostLyricsToClub: capabilities.canPostLyricsToClub,
    canPostLyricsToFollowers: capabilities.canPostLyricsToFollowers,
    canCreateCollabRequest: capabilities.canCreateCollabRequest,
    canCreateWriterGigs: capabilities.canCreateWriterGigs,
    canHostAuditions: capabilities.canHostAuditions,
    canSubmitToAuditions: capabilities.canSubmitToAuditions,
    canSubmitAnonymousAudition: capabilities.canSubmitAnonymousAudition,
    canViewLyrics: capabilities.canViewLyrics,
    canViewPrivateLyrics: capabilities.canViewPrivateLyrics,
    canGiveFeedback: capabilities.canGiveFeedback,
    canGiveProfessionalReview: capabilities.canGiveProfessionalReview,
    canPostLabelOpportunity: capabilities.canPostLabelOpportunity,
    canUseScoutingMode: capabilities.canUseScoutingMode,
    canViewAuditionsByType: capabilities.canViewAuditionsByType,
    canProposeRevenueSplit: capabilities.canProposeRevenueSplit,
    canJoinPaidCollabs: capabilities.canJoinPaidCollabs,
    canInviteToCollab: capabilities.canInviteToCollab,
    canEditCollabTerms: capabilities.canEditCollabTerms,
    canAccessGenreRestricted: capabilities.canAccessGenreRestricted,
    canEarnSkillBadges: capabilities.canEarnSkillBadges,
    canFeatureServices: capabilities.canFeatureServices,
    canViewServiceAnalytics: capabilities.canViewServiceAnalytics,
    canReportServices: capabilities.canReportServices,
    canModerateServices: capabilities.canModerateServices,
    // Reputation & Dynamic Tiers (computed from capabilities defaults)
    reputationTier: capabilities.reputationTier,
    isVerifiedCreator: capabilities.isVerifiedCreator,
    isProfessionalReviewer: capabilities.isProfessionalReviewer,
    isLabelPartner: capabilities.isLabelPartner,
    isMentor: capabilities.isMentor,
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