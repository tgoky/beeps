import { NextRequest, NextResponse } from "next/server";
import { withAuth, type AuthenticatedRequest } from "@/lib/api-middleware";
import { prisma } from "@/lib/prisma";
import type { ApiResponse } from "@/types";
import { identifyAudio } from "@/lib/acrcloud";
import { S3Client, GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { unstable_cache } from "next/cache";
import { revalidateTag } from "next/cache";

const r2 = new S3Client({
  region: "auto",
  endpoint: process.env.CLOUDFLARE_R2_ENDPOINT!,
  credentials: {
    accessKeyId: process.env.CLOUDFLARE_R2_ACCESS_KEY_ID!,
    secretAccessKey: process.env.CLOUDFLARE_R2_SECRET_ACCESS_KEY!,
  },
});

// ✅ FIX #11: Pagination constants
const MAX_LIMIT = 100;
const DEFAULT_LIMIT = 20;

// ✅ FIX #14: Cached beats query with invalidation tag
const getCachedBeats = unstable_cache(
  async (where: any, limit: number, offset: number) => {
    const [beats, totalCount] = await Promise.all([
      prisma.beat.findMany({
        where,
        include: {
          producer: { 
            select: { 
              id: true, 
              username: true, 
              fullName: true, 
              avatar: true, 
              verified: true 
            } 
          },
          club: { 
            select: { 
              id: true, 
              name: true, 
              icon: true 
            } 
          },
          _count: { 
            select: { 
              beatLikes: true 
            } 
          },
        },
        orderBy: { createdAt: "desc" },
        take: limit,
        skip: offset,
      }),
      prisma.beat.count({ where }),
    ]);
    return { beats, totalCount };
  },
  ['beats-list'],
  { revalidate: 60, tags: ['beats'] }
);

// ✅ FIX #12: ACRCloud timeout wrapper
async function identifyAudioWithTimeout(
  url: string, 
  ms = 10_000
): Promise<{ isMatch: boolean; matchData?: string | null; timedOut?: boolean; error?: unknown }> {
  return Promise.race([
    identifyAudio(url),
    new Promise<{ isMatch: boolean; timedOut: boolean }>((resolve) =>
      setTimeout(() => resolve({ isMatch: false, timedOut: true }), ms)
    ),
  ]);
}

// GET /api/beats - Fetch beats with pagination
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search");
    const genre = searchParams.get("genre");
    const mood = searchParams.get("mood");
    const minPrice = searchParams.get("minPrice");
    const maxPrice = searchParams.get("maxPrice");
    const producerId = searchParams.get("producerId");
    const type = searchParams.get("type");
    
    // ✅ FIX #11: Apply default + cap to limit and offset
    const rawLimit = searchParams.get("limit");
    const rawOffset = searchParams.get("offset");
    const limit = Math.min(rawLimit ? parseInt(rawLimit) : DEFAULT_LIMIT, MAX_LIMIT);
    const offset = rawOffset ? parseInt(rawOffset) : 0;

    const where: any = { isActive: true };

    if (search) {
      where.OR = [
        { title: { contains: search, mode: "insensitive" } },
        { description: { contains: search, mode: "insensitive" } },
      ];
    }
    if (genre) where.genres = { has: genre };
    if (mood) where.moods = { has: mood };
    if (minPrice || maxPrice) {
      where.price = {};
      if (minPrice) where.price.gte = parseFloat(minPrice);
      if (maxPrice) where.price.lte = parseFloat(maxPrice);
    }
    if (producerId) where.producerId = producerId;
    if (type) where.type = type;

    // ✅ FIX #14: Use cached query
    const { beats, totalCount } = await getCachedBeats(where, limit, offset);

    return NextResponse.json<ApiResponse>({
      success: true,
      data: { 
        beats, 
        pagination: { 
          total: totalCount, 
          limit, 
          offset,
          hasMore: totalCount > offset + limit
        } 
      },
    });
  } catch (error: any) {
    console.error("Error fetching beats:", error);
    return NextResponse.json<ApiResponse>(
      { 
        success: false, 
        error: { 
          message: "Failed to fetch beats", 
          code: "SERVER_ERROR",
          details: process.env.NODE_ENV === "development" ? error.message : undefined
        } 
      }, 
      { status: 500 }
    );
  }
}

// POST /api/beats - Upload a new beat
export async function POST(req: NextRequest) {
  return withAuth(req, async (req: AuthenticatedRequest) => {
    const user = req.user!;
    
    try {
      const body = await req.json();
      const {
        title, description, bpm, key, price, type, genres, moods, tags, imageUrl, 
        audioUrl, clubId, 
        untaggedWavKey, fileHash 
      } = body;

      // Validate required fields
      if (!title || !bpm || !price || !type) {
        return NextResponse.json<ApiResponse>(
          { 
            success: false, 
            error: { 
              message: "Missing required fields", 
              code: "VALIDATION_ERROR" 
            } 
          }, 
          { status: 400 }
        );
      }

      const bpmNum = parseInt(bpm);
      if (bpmNum < 20 || bpmNum > 300) {
        return NextResponse.json<ApiResponse>(
          { 
            success: false, 
            error: { 
              message: "BPM must be between 20 and 300", 
              code: "VALIDATION_ERROR" 
            } 
          }, 
          { status: 400 }
        );
      }

      const priceNum = parseFloat(price);
      if (priceNum < 0) {
        return NextResponse.json<ApiResponse>(
          { 
            success: false, 
            error: { 
              message: "Price must be a positive number", 
              code: "VALIDATION_ERROR" 
            } 
          }, 
          { status: 400 }
        );
      }

      // Permission checks
      const permissions = req.permissions;
      if (!permissions?.canUploadBeats) {
        return NextResponse.json<ApiResponse>(
          { 
            success: false, 
            error: { 
              message: "You don't have permission to upload beats.", 
              code: "INSUFFICIENT_PERMISSIONS" 
            } 
          }, 
          { status: 403 }
        );
      }

      // Club membership check
      if (clubId) {
        const clubMembership = await prisma.clubMember.findUnique({ 
          where: { clubId_userId: { clubId, userId: user.id } } 
        });
        if (!clubMembership) {
          return NextResponse.json<ApiResponse>(
            { 
              success: false, 
              error: { 
                message: "You must be a member of the club", 
                code: "NOT_CLUB_MEMBER" 
              } 
            }, 
            { status: 403 }
          );
        }
      }

      // GATE 2: Internal exclusivity check
      if (fileHash) {
        const existingExclusive = await prisma.licenseAgreement.findFirst({
          where: { 
            licensedFileHash: fileHash, 
            licenseType: "EXCLUSIVE" 
          }
        });
        if (existingExclusive) {
          return NextResponse.json<ApiResponse>(
            { 
              success: false, 
              error: { 
                message: "GATE 2 BLOCKED: Beat already sold exclusively.", 
                code: "COPYRIGHT_ERROR" 
              } 
            }, 
            { status: 403 }
          );
        }
      }

      // ✅ FIX #12: GATE 1 - ACRCloud copyright check with timeout
      if (untaggedWavKey) {
        const command = new GetObjectCommand({ 
          Bucket: process.env.R2_BUCKET_NAME!, 
          Key: untaggedWavKey 
        });
        const tempAudioUrl = await getSignedUrl(r2, command, { expiresIn: 300 });
        
        const acrResult = await identifyAudioWithTimeout(tempAudioUrl);
        
        if (acrResult.timedOut) {
          console.error("[Beeps Shield] ACRCloud check timed out — proceeding without verification, flag for manual review.");
          await prisma.activity.create({
            data: {
              userId: user.id,
              type: "UPLOAD",
              title: "ACRCloud Timeout - Manual Review Needed",
              description: `Beat "${title}" bypassed copyright check due to ACRCloud timeout`,
              referenceType: "beat",
            },
          });
        } else if (acrResult.isMatch) {
          return NextResponse.json<ApiResponse>(
            { 
              success: false, 
              error: { 
                message: `GATE 1 BLOCKED: Uncleared sample detected ("${acrResult.matchData}")`, 
                code: "COPYRIGHT_ERROR" 
              } 
            }, 
            { status: 403 }
          );
        }
      }

      // Create beat
      const beat = await prisma.beat.create({
        data: {
          title, 
          description, 
          bpm: bpmNum, 
          key, 
          price: priceNum, 
          type, 
          genres: genres || [],
          moods: moods || [], 
          tags: tags || [], 
          imageUrl, 
          producerId: user.id, 
          clubId: clubId || null,
          untaggedWavKey: untaggedWavKey || null,
          fileHash: fileHash || null,
          audioUrl: audioUrl || "",
        },
        include: {
          producer: { 
            select: { 
              id: true, 
              username: true, 
              fullName: true, 
              avatar: true, 
              verified: true 
            } 
          },
          club: { 
            select: { 
              id: true, 
              name: true, 
              icon: true 
            } 
          },
        },
      });

      // Create activity
      await prisma.activity.create({
        data: {
          userId: user.id, 
          type: "UPLOAD", 
          title: `Uploaded beat "${title}"`,
          description: `New ${type.toLowerCase()} beat at ${bpmNum} BPM for $${priceNum}`,
          referenceId: beat.id, 
          referenceType: "beat",
        },
      });

      // ✅ FIX #14: Invalidate beats cache after upload
      revalidateTag('beats');

      return NextResponse.json<ApiResponse>(
        { success: true, data: { beat } }, 
        { status: 201 }
      );
    } catch (error: any) {
      console.error("Error uploading beat:", error);
      return NextResponse.json<ApiResponse>(
        { 
          success: false, 
          error: { 
            message: "Failed to upload beat", 
            code: "SERVER_ERROR",
            details: process.env.NODE_ENV === "development" ? error.message : undefined
          } 
        }, 
        { status: 500 }
      );
    }
  });
}