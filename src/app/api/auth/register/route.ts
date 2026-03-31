// API Route: /api/auth/register
// Handles user registration with role-based profile creation and permissions

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { supabaseBrowserClient } from '@/utils/supabase/client';
import { getPaymentConfig } from '@/lib/payment-router';
import type { RegistrationFormData, ApiResponse, UserWithProfiles } from '@/types';
import { UserRole } from '@prisma/client';

export async function POST(request: NextRequest) {
  try {
    const body: RegistrationFormData = await request.json();
    
    // Validate required fields
    const { email, username, password, role, fullName, location } = body;
    
    if (!email || !username || !password || !role || !fullName || !location) {
      return NextResponse.json<ApiResponse>({
        success: false,
        error: {
          message: 'Missing required fields',
          code: 'VALIDATION_ERROR'
        }
      }, { status: 400 });
    }

    // Check if email or username is already taken
    const existingUser = await prisma.user.findFirst({
      where: { OR: [{ username }, { email }] },
      select: { username: true, email: true }
    });

    if (existingUser) {
      const isEmailTaken = existingUser.email === email;
      return NextResponse.json<ApiResponse>({
        success: false,
        error: {
          message: isEmailTaken ? 'Email already in use' : 'Username already taken',
          code: isEmailTaken ? 'EMAIL_EXISTS' : 'USERNAME_EXISTS'
        }
      }, { status: 409 });
    }

    // Create user in Supabase Auth
    const { data: authData, error: authError } = await supabaseBrowserClient.auth.signUp({
      email,
      password,
      options: {
        data: {
          username,
          full_name: fullName,
          role,
          // Store permissions in Supabase user metadata
          can_create_studios: body.canCreateStudios,
          can_book_studios: body.canBookStudios
        }
      }
    });

    if (authError) {
      return NextResponse.json<ApiResponse>({
        success: false,
        error: {
          message: authError.message,
          code: 'AUTH_ERROR'
        }
      }, { status: 400 });
    }

    if (!authData.user) {
      return NextResponse.json<ApiResponse>({
        success: false,
        error: {
          message: 'Failed to create user',
          code: 'AUTH_ERROR'
        }
      }, { status: 500 });
    }

    // Derive payment config from user's country
    const countryCode = body.countryCode ?? null;
    const paymentConfig = getPaymentConfig(countryCode);

    // Create user in database with transaction for atomicity
    const user = await prisma.$transaction(async (tx) => {
      // Create base user with permissions + payment config
      const newUser = await tx.user.create({
        data: {
          email,
          username,
          supabaseId: authData.user!.id,
          fullName,
          location,
          primaryRole: role as UserRole,
          bio: body.bio,
          avatar: body.avatar,
          countryCode,
          currency: paymentConfig.currency,
          paymentProvider: paymentConfig.provider,
        }
      });

      // Create wallet for the new user
      await tx.wallet.create({
        data: {
          userId: newUser.id,
          currency: paymentConfig.currency,
        },
      });

      // Create role-specific profile with permissions
      await createRoleProfile(tx, newUser.id, role as UserRole, body);

      // Create initial activity
      await tx.activity.create({
        data: {
          userId: newUser.id,
          type: 'UPLOAD',
          title: `${username} joined Beeps!`,
          description: `Welcome to the music community as ${getRoleLabel(role as UserRole)}`
        }
      });

      return newUser;
    });

    // Fetch complete user with profiles
    const userWithProfiles = await prisma.user.findUnique({
      where: { id: user.id },
      include: {
        artistProfile: true,
        producerProfile: true,
        studioProfile: true,
        gearProfile: true,
        lyricistProfile: true
      }
    });

    return NextResponse.json<ApiResponse<UserWithProfiles>>({
      success: true,
      data: userWithProfiles as UserWithProfiles
    }, { status: 201 });

  } catch (error: any) {
    console.error('Registration error:', error);

    // Handle Prisma unique constraint violations
    if (error.code === 'P2002') {
      const field = error.meta?.target?.[0];
      const message = field === 'email' ? 'Email already in use' : 'Username already taken';
      const code = field === 'email' ? 'EMAIL_EXISTS' : 'USERNAME_EXISTS';
      return NextResponse.json<ApiResponse>({
        success: false,
        error: { message, code }
      }, { status: 409 });
    }

    return NextResponse.json<ApiResponse>({
      success: false,
      error: {
        message: 'Internal server error',
        code: 'INTERNAL_ERROR',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      }
    }, { status: 500 });
  }
}

// Helper function to create role-specific profiles
async function createRoleProfile(
  tx: any,
  userId: string,
  role: UserRole,
  data: RegistrationFormData
) {
  switch (role) {
    case 'ARTIST':
      await tx.artistProfile.create({
        data: {
          userId,
          genres: data.genres || [],
          skills: data.specialties || [],
          socialLinks: data.socialLinks || {}
        }
      });
      break;

    case 'PRODUCER':
      await tx.producerProfile.create({
        data: {
          userId,
          genres: data.genres || [],
          specialties: data.specialties || [],
          equipment: data.equipment || [],
          experience: data.experience,
          productionRate: data.hourlyRate,
          availability: data.hasStudio 
            ? 'Available - Own studio' 
            : 'Available for projects'
        }
      });

      // If producer has a studio, create studio profile
      if (data.hasStudio) {
        await tx.studioOwnerProfile.create({
          data: {
            userId,
            studioName: data.studioName || `${data.fullName}'s Studio`,
            capacity: data.capacity,
            equipment: data.equipment || [],
            hourlyRate: data.hourlyRate
          }
        });
      }
      break;

    case 'STUDIO_OWNER':
      await tx.studioOwnerProfile.create({
        data: {
          userId,
          studioName: data.studioName || `${data.fullName}'s Studio`,
          capacity: data.capacity,
          equipment: data.equipment || [],
          hourlyRate: data.hourlyRate
        }
      });
      break;

    case 'GEAR_SALES':
      await tx.gearSalesProfile.create({
        data: {
          userId,
          businessName: data.businessName || `${data.fullName}'s Gear`,
          specialties: data.specialties || [],
          inventory: data.inventory
        }
      });
      break;

    case 'LYRICIST':
      await tx.lyricistProfile.create({
        data: {
          userId,
          genres: data.genres || [],
          writingStyle: data.writingStyle,
          collaborationStyle: data.collaborationStyle,
          portfolio: data.portfolio
        }
      });
      break;

    case 'OTHER':
      // No specific profile for OTHER role
      break;
  }
}

// Helper to get friendly role label
function getRoleLabel(role: UserRole): string {
  const labels: Record<UserRole, string> = {
    ARTIST: 'an Artist',
    PRODUCER: 'a Producer',
    STUDIO_OWNER: 'a Studio Owner',
    GEAR_SALES: 'a Gear Specialist',
    LYRICIST: 'a Lyricist',
    OTHER: 'a Music Enthusiast'
  };
  return labels[role] || 'a Member';
}