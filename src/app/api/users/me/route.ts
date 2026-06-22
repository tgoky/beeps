import { NextRequest, NextResponse } from "next/server";
import { withFullUser } from "@/lib/api-middleware";
import { prisma } from "@/lib/prisma";
import { BASE_PROFILE_FIELDS, ROLE_PROFILE_FIELDS } from "../../../../lib/profile-fields";
import type { ApiResponse } from "@/types";

export async function PATCH(req: NextRequest) {
  return withFullUser(req, async (req) => {
    const me = req.user!;

    try {
      const body = await req.json();

      const baseData: Record<string, any> = {};
      for (const key of BASE_PROFILE_FIELDS) {
        if (body[key] !== undefined) baseData[key] = body[key];
      }

      const roleConfig = ROLE_PROFILE_FIELDS[me.primaryRole];
      const roleData: Record<string, any> = {};
      if (roleConfig) {
        for (const field of roleConfig.fields) {
          if (body[field.key] !== undefined) roleData[field.key] = body[field.key];
        }
      }

      if (Object.keys(baseData).length === 0 && Object.keys(roleData).length === 0) {
        return NextResponse.json<ApiResponse>(
          { success: false, error: { message: "No valid fields to update", code: "VALIDATION_ERROR" } },
          { status: 400 }
        );
      }

      const result = await prisma.$transaction(async (tx) => {
        let userResult = null;
        let roleResult = null;

        if (Object.keys(baseData).length > 0) {
          userResult = await tx.user.update({ where: { id: me.id }, data: baseData });
        }
        if (roleConfig && Object.keys(roleData).length > 0) {
          // Model name is dynamic by design — each role maps to a different
          // Prisma delegate (producerProfile, studioOwnerProfile, etc).
          roleResult = await (tx as any)[roleConfig.model].update({
            where: { userId: me.id },
            data: roleData,
          });
        }

        return { userResult, roleResult };
      });

      return NextResponse.json<ApiResponse>({
        success: true,
        data: { user: result.userResult, roleProfile: result.roleResult },
      });
    } catch (error: any) {
      console.error("Error updating profile:", error);
      return NextResponse.json<ApiResponse>(
        {
          success: false,
          error: {
            message: "Failed to update profile",
            code: "SERVER_ERROR",
            details: process.env.NODE_ENV === "development" ? error.message : undefined,
          },
        },
        { status: 500 }
      );
    }
  });
}