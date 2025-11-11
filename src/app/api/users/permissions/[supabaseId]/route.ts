// API Route: /api/users/permissions/[supabaseId]
// Fetches user permissions based on their Supabase ID

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(
  request: NextRequest,
  { params }: { params: { supabaseId: string } }
) {
  try {
    const { supabaseId } = params;

    if (!supabaseId) {
      return NextResponse.json({
        success: false,
        error: {
          message: 'Supabase ID is required',
          code: 'VALIDATION_ERROR'
        }
      }, { status: 400 });
    }

    // Find user by Supabase ID
    const user = await prisma.user.findUnique({
      where: { supabaseId },
      select: {
        id: true,
        email: true,
        username: true,
        primaryRole: true,
        producerProfile: {
          select: {
            availability: true
          }
        },
        studioProfile: {
          select: {
            id: true
          }
        }
      }
    });

    if (!user) {
      return NextResponse.json({
        success: false,
        error: {
          message: 'User not found',
          code: 'USER_NOT_FOUND'
        }
      }, { status: 404 });
    }

    // Determine permissions based on role and profile
    const permissions = {
      canCreateStudios: determineCanCreateStudios(user),
      canBookStudios: determineCanBookStudios(user.primaryRole),
      role: user.primaryRole
    };

    return NextResponse.json({
      success: true,
      data: {
        userId: user.id,
        username: user.username,
        email: user.email,
        permissions
      }
    });

  } catch (error: any) {
    console.error('Error fetching user permissions:', error);
    
    return NextResponse.json({
      success: false,
      error: {
        message: 'Internal server error',
        code: 'INTERNAL_ERROR',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      }
    }, { status: 500 });
  }
}

// Helper function to determine if user can create studios
function determineCanCreateStudios(user: any): boolean {
  // Studio owners can always create studios
  if (user.primaryRole === 'STUDIO_OWNER') {
    return true;
  }

  // Producers can create studios if they have a studio profile
  if (user.primaryRole === 'PRODUCER' && user.studioProfile) {
    return true;
  }

  // All other roles cannot create studios
  return false;
}

// Helper function to determine if user can book studios
function determineCanBookStudios(role: string): boolean {
  // Studio owners don't book their own studios
  if (role === 'STUDIO_OWNER') {
    return false;
  }

  // All other roles can book studios
  return true;
}