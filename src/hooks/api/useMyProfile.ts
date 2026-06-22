import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

export interface MyProfileData {
  user: any;
  activity: any[];
  reputation: { avgRating: number | null; reviewCount: number };
  roleContent: { type: "beats" | "studios" | "equipment" | "posts"; items: any[]; meta: Record<string, any> };
  secondaryRoles: string[];
}

async function fetchMyProfile(): Promise<MyProfileData> {
  const res = await fetch("/api/users/me/profile");
  const json = await res.json();
  if (!res.ok || !json.success) throw new Error(json.error?.message || "Failed to load profile");
  return json.data;
}

export function useMyProfile() {
  return useQuery({
    queryKey: ["my-profile"],
    queryFn: fetchMyProfile,
    staleTime: 60_000,
  });
}

export function useUpdateMyProfile() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: Record<string, any>) => {
      const res = await fetch("/api/users/me", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.error?.message || "Failed to update profile");
      return json.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["my-profile"] });
    },
  });
}