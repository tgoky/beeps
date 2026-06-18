// src/app/api/auth/bootstrap/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { prisma } from '@/lib/prisma';
import { createRoleProfile, getRoleLabel } from '@/lib/user-provisioning';
import type { UserRole } from '@prisma/client';

export async function POST(request: NextRequest) {
  try {
    const { cookies } = await import('next/headers');
    const cookieStore = await cookies();
    
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value;
          },
          set(name: string, value: string, options: CookieOptions) {
            try {
              cookieStore.set({ name, value, ...options });
            } catch {}
          },
          remove(name: string, options: CookieOptions) {
            try {
              cookieStore.set({ name, value: '', ...options });
            } catch {}
          },
        },
      }
    );


    const { data: { user: supabaseUser }, error } = await supabase.auth.getUser();
    
    if (error || !supabaseUser) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const existingUser = await prisma.user.findUnique({
      where: { supabaseId: supabaseUser.id },
      select: { id: true },
    });

    if (existingUser) return NextResponse.json({ success: true, message: 'Already provisioned' });

    const baseUsername = supabaseUser.user_metadata?.username || supabaseUser.email?.split('@')[0] || `user${supabaseUser.id.slice(0, 8)}`;
    
    let username = baseUsername.toLowerCase().replace(/[^a-z0-9_]/g, '');
    let counter = 1;
    while (await prisma.user.findUnique({ where: { username }, select: { id: true } })) {
      username = `${baseUsername}${counter}`;
      counter++;
    }

    const primaryRole = (supabaseUser.user_metadata?.primaryRole || supabaseUser.user_metadata?.role || 'OTHER') as UserRole;

    await prisma.$transaction(async (tx) => {
      const newUser = await tx.user.create({
        data: {
          supabaseId: supabaseUser.id,
          email: supabaseUser.email!,
          username,
          fullName: supabaseUser.user_metadata?.full_name || supabaseUser.user_metadata?.name || null,
          avatar: supabaseUser.user_metadata?.avatar_url || null,
          primaryRole,
          membershipTier: 'FREE',
          verified: false,
        },
      });

      await tx.wallet.create({ data: { userId: newUser.id, currency: 'USD' } });

      await createRoleProfile(tx, newUser.id, primaryRole, {
        fullName: newUser.fullName ?? username,
      });

      await tx.activity.create({
        data: {
          userId: newUser.id,
          type: 'UPLOAD',
          title: `${username} joined Beeps!`,
          description: `Welcome to the music community as ${getRoleLabel(primaryRole)}`,
        },
      });
    });

    return NextResponse.json({ success: true, message: 'User provisioned' }, { status: 201 });
  } catch (error: any) {
    console.error('Bootstrap Error:', error);
    return NextResponse.json({ error: 'Failed to provision user' }, { status: 500 });
  }
}