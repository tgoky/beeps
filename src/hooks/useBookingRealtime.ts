"use client";
import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { createBrowserClient } from "@supabase/ssr";

export function useBookingRealtime(userId?: string, studioIds: string[] = []) {
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!userId) return;

    const supabase = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    const invalidate = () => {
      queryClient.invalidateQueries({ queryKey: ["sessions"] });
      queryClient.invalidateQueries({ queryKey: ["bookings"] });
    };

    const channel = supabase.channel(`bookings-${userId}`).on(
      "postgres_changes",
      { event: "UPDATE", schema: "public", table: "bookings", filter: `user_id=eq.${userId}` },
      invalidate
    );

    if (studioIds.length > 0) {
      channel.on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "bookings", filter: `studio_id=in.(${studioIds.join(",")})` },
        invalidate
      );
    }

    channel.subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [userId, studioIds.join(","), queryClient]);
}