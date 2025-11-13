// hooks/usePermissions.ts
// Custom hook for checking user permissions throughout the app


"use client";

import { useGetIdentity } from "@refinedev/core";

export interface UserPermissions {
  canCreateStudios: boolean;
  canBookStudios: boolean;
  role: string;
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
}

export const usePermissions = () => {
  const { data: identity } = useGetIdentity<any>();

  const permissions: UserPermissions = identity?.permissions || {
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

  return {
    permissions,
    isArtist: permissions.role === 'ARTIST',
    isProducer: permissions.role === 'PRODUCER',
    isStudioOwner: permissions.role === 'STUDIO_OWNER',
    isGearSales: permissions.role === 'GEAR_SALES',
    isLyricist: permissions.role === 'LYRICIST',
    isOther: permissions.role === 'OTHER',
    // Helper methods
    canAccess: (action:
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
    ) => {
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
        default:
          return false;
      }
    }
  };
};

// Alternative: React Context approach for permissions
import { createContext, useContext, ReactNode } from 'react';

interface PermissionsContextValue {
  permissions: UserPermissions;
  isLoading: boolean;
}

const PermissionsContext = createContext<PermissionsContextValue | undefined>(undefined);

export const PermissionsProvider = ({ children }: { children: ReactNode }) => {
  const { data: identity, isLoading } = useGetIdentity<any>();

  const permissions: UserPermissions = identity?.permissions || {
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

  return (
    <PermissionsContext.Provider value={{ permissions, isLoading }}>
      {children}
    </PermissionsContext.Provider>
  );
};

export const usePermissionsContext = () => {
  const context = useContext(PermissionsContext);
  if (!context) {
    throw new Error('usePermissionsContext must be used within PermissionsProvider');
  }
  return context;
};