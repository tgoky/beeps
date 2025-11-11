// hooks/usePermissions.ts
// Custom hook for checking user permissions throughout the app

import { useGetIdentity } from "@refinedev/core";

export interface UserPermissions {
  canCreateStudios: boolean;
  canBookStudios: boolean;
  role: string;
}

export const usePermissions = () => {
  const { data: identity } = useGetIdentity<any>();
  
  const permissions: UserPermissions = identity?.permissions || {
    canCreateStudios: false,
    canBookStudios: false,
    role: 'OTHER'
  };

  return {
    ...permissions,
    isArtist: permissions.role === 'ARTIST',
    isProducer: permissions.role === 'PRODUCER',
    isStudioOwner: permissions.role === 'STUDIO_OWNER',
    isGearSales: permissions.role === 'GEAR_SALES',
    isLyricist: permissions.role === 'LYRICIST',
    isOther: permissions.role === 'OTHER',
    // Helper methods
    canAccess: (action: 'createStudios' | 'bookStudios') => {
      switch (action) {
        case 'createStudios':
          return permissions.canCreateStudios;
        case 'bookStudios':
          return permissions.canBookStudios;
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
    role: 'OTHER'
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