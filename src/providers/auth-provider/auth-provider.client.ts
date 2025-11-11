"use client";

import type { AuthProvider } from "@refinedev/core";
import { supabaseBrowserClient } from "@utils/supabase/client";

// Permission interface
export interface UserPermissions {
  canCreateStudios: boolean;
  canBookStudios: boolean;
  role: string;
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
  
  getPermissions: async (): Promise<UserPermissions | null> => {
    const { data } = await supabaseBrowserClient.auth.getUser();

    if (data?.user) {
      const metadata = data.user.user_metadata || {};
      
      return {
        canCreateStudios: metadata.can_create_studios || false,
        canBookStudios: metadata.can_book_studios || false,
        role: metadata.role || 'OTHER'
      };
    }

    return null;
  },
  
  getIdentity: async () => {
    const { data } = await supabaseBrowserClient.auth.getUser();

    if (data?.user) {
      return {
        ...data.user,
        name: data.user.email,
        // Include permissions in identity for easy access
        permissions: {
          canCreateStudios: data.user.user_metadata?.can_create_studios || false,
          canBookStudios: data.user.user_metadata?.can_book_studios || false,
          role: data.user.user_metadata?.role || 'OTHER'
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