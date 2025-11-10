// API Route: /api/users/by-supabase/[supabaseId]/route.ts
// Fetches user data by their Supabase auth ID

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(
  request: NextRequest,
  { params }: { params: { supabaseId: string } }
) {
  try {
    const supabaseId = params.supabaseId;

    if (!supabaseId) {
      return NextResponse.json({
        success: false,
        error: {
          message: 'Supabase ID is required',
          code: 'VALIDATION_ERROR'
        }
      }, { status: 400 });
    }

    // Fetch user by Supabase ID
    const user = await prisma.user.findUnique({
      where: { supabaseId },
      include: {
        artistProfile: true,
        producerProfile: true,
        studioProfile: true,
        gearProfile: true,
        lyricistProfile: true,
        _count: {
          select: {
            followers: true,
            following: true,
            clubMemberships: true,
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

    return NextResponse.json({
      success: true,
      data: user
    });

  } catch (error: any) {
    console.error('Fetch user by Supabase ID error:', error);
    
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