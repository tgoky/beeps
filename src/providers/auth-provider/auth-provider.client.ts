"use client";

import type { AuthProvider } from "@refinedev/core";
import { supabaseBrowserClient } from "@utils/supabase/client";
import type { UserPermissions } from "@/types";

// ✅ NEW: Helper function to fetch user permissions from your API
async function fetchUserPermissions(): Promise<UserPermissions | null> {
  try {
    const response = await fetch('/api/auth/me', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include', // Important for cookies
    });

    if (!response.ok) {
      console.error('Failed to fetch user permissions');
      return null;
    }

    const result = await response.json();

    if (result.success && result.data?.permissions) {
      return result.data.permissions;
    }

    return null;
  } catch (error) {
    console.error('Error fetching user permissions:', error);
    return null;
  }
}

export const authProviderClient: AuthProvider = {
  login: async ({ email, password }) => {
    const { data, error } = await supabaseBrowserClient.auth.signInWithPassword(
      {
        email,
        password,
      }
    );

    if (error) {
      return {
        success: false,
        error,
      };
    }

    if (data?.session) {
      await supabaseBrowserClient.auth.setSession(data.session);

      return {
        success: true,
        redirectTo: "/",
      };
    }

    // for third-party login
    return {
      success: false,
      error: {
        name: "LoginError",
        message: "Invalid username or password",
      },
    };
  },
  
  logout: async () => {
    const { error } = await supabaseBrowserClient.auth.signOut();

    if (error) {
      return {
        success: false,
        error,
      };
    }

    return {
      success: true,
      redirectTo: "/login",
    };
  },
  
  register: async (params) => {
    try {
      // Call YOUR custom API route instead of Supabase directly
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(params),
      });

      const result = await response.json();

      if (!result.success) {
        return {
          success: false,
          error: {
            name: 'RegistrationError',
            message: result.error?.message || 'Registration failed',
          },
        };
      }

      // After successful registration, log the user in
      const { data: sessionData, error: signInError } = 
        await supabaseBrowserClient.auth.signInWithPassword({
          email: params.email,
          password: params.password,
        });

      if (signInError) {
        return {
          success: false,
          error: signInError,
        };
      }

      return {
        success: true,
        redirectTo: "/",
      };
    } catch (error: any) {
      return {
        success: false,
        error: {
          name: 'RegistrationError',
          message: error.message || 'Registration failed',
        },
      };
    }
  },
  
  check: async () => {
    const { data, error } = await supabaseBrowserClient.auth.getUser();
    const { user } = data;

    if (error) {
      return {
        authenticated: false,
        redirectTo: "/login",
        logout: true,
      };
    }

    if (user) {
      return {
        authenticated: true,
      };
    }

    return {
      authenticated: false,
      redirectTo: "/login",
    };
  },
  
  // ✅ FIXED: Fetch complete permissions from your database
  getPermissions: async (): Promise<UserPermissions | null> => {
    const { data } = await supabaseBrowserClient.auth.getUser();

    if (data?.user) {
      // Fetch from your API instead of user_metadata
      const permissions = await fetchUserPermissions();

      if (permissions) {
        return permissions;
      }

      // Fallback to default permissions if API call fails - import from api-middleware to ensure consistency
      const { getUserPermissions: getDefaultPermissions } = await import('@/lib/api-middleware');
      return getDefaultPermissions({} as any);
    }

    return null;
  },
  
  // ✅ FIXED: Include complete permissions in identity
  getIdentity: async () => {
    const { data } = await supabaseBrowserClient.auth.getUser();

    if (data?.user) {
      // Fetch complete permissions from your API
      const permissions = await fetchUserPermissions();

      return {
        ...data.user,
        name: data.user.email,
        // Include ALL permissions in identity for easy access
        permissions: permissions || {
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
        }
      };
    }

    return null;
  },
  
  onError: async (error) => {
    if (error?.code === "PGRST301" || error?.code === 401) {
      return {
        logout: true,
      };
    }

    return { error };
  },
};