import { NextRequest, NextResponse } from "next/server";
import { withFullUser, withAuth } from "@/lib/api-middleware";
import { prisma } from "@/lib/prisma";
import type { ApiResponse } from "@/types";
import { identifyAudio } from "@/lib/acrcloud";
import { S3Client, GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

const r2 = new S3Client({
  region: "auto",
  endpoint: process.env.CLOUDFLARE_R2_ENDPOINT!,
  credentials: {
    accessKeyId: process.env.CLOUDFLARE_R2_ACCESS_KEY_ID!,
    secretAccessKey: process.env.CLOUDFLARE_R2_SECRET_ACCESS_KEY!,
  },
});

// GET /api/beats - (KEPT EXACTLY AS YOU WROTE IT)
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
    const limit = searchParams.get("limit");
    const offset = searchParams.get("offset");

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

    const beats = await prisma.beat.findMany({
      where,
      include: {
        producer: { select: { id: true, username: true, fullName: true, avatar: true, verified: true } },
        club: { select: { id: true, name: true, icon: true } },
        _count: { select: { beatLikes: true } },
      },
      orderBy: { createdAt: "desc" },
      ...(limit && { take: parseInt(limit) }),
      ...(offset && { skip: parseInt(offset) }),
    });

    const totalCount = await prisma.beat.count({ where });

    return NextResponse.json<ApiResponse>({
      success: true,
      data: { beats, pagination: { total: totalCount, limit: limit ? parseInt(limit) : beats.length, offset: offset ? parseInt(offset) : 0 } },
    });
  } catch (error: any) {
    return NextResponse.json<ApiResponse>({ success: false, error: { message: "Failed to fetch beats", code: "SERVER_ERROR" } }, { status: 500 });
  }
}

// POST /api/beats - (MERGED YOUR LOGIC WITH THE GATES)
export async function POST(req: NextRequest) {
  return withFullUser(req, async (req) => {
    const user = req.user!;
    
    try {
      const body = await req.json();
      const {
        title, description, bpm, key, price, type, genres, moods, tags, imageUrl, 
        audioUrl, clubId, 
        // NEW R2/HASH FIELDS:
        untaggedWavKey, fileHash 
      } = body;

      // YOUR ORIGINAL VALIDATIONS
      if (!title || !bpm || !price || !type) {
        return NextResponse.json<ApiResponse>({ success: false, error: { message: "Missing required fields", code: "VALIDATION_ERROR" } }, { status: 400 });
      }

      const bpmNum = parseInt(bpm);
      if (bpmNum < 20 || bpmNum > 300) {
        return NextResponse.json<ApiResponse>({ success: false, error: { message: "BPM must be between 20 and 300", code: "VALIDATION_ERROR" } }, { status: 400 });
      }

      const priceNum = parseFloat(price);
      if (priceNum < 0) {
        return NextResponse.json<ApiResponse>({ success: false, error: { message: "Price must be a positive number", code: "VALIDATION_ERROR" } }, { status: 400 });
      }

      // YOUR PERMISSION CHECKS
      const permissions = req.permissions;
      if (!permissions?.canUploadBeats) {
        return NextResponse.json<ApiResponse>({ success: false, error: { message: "You don't have permission to upload beats.", code: "INSUFFICIENT_PERMISSIONS" } }, { status: 403 });
      }

      // YOUR CLUB CHECKS
      if (clubId) {
        const clubMembership = await prisma.clubMember.findUnique({ where: { clubId_userId: { clubId, userId: user.id } } });
        if (!clubMembership) return NextResponse.json<ApiResponse>({ success: false, error: { message: "You must be a member of the club", code: "NOT_CLUB_MEMBER" } }, { status: 403 });
      }

      // ==========================================
      // NEW: GATE 2 (INTERNAL EXCLUSIVITY CHECK)
      // ==========================================
      if (fileHash) {
        const existingExclusive = await prisma.licenseAgreement.findFirst({
          where: { licensedFileHash: fileHash, licenseType: "EXCLUSIVE" }
        });
        if (existingExclusive) {
          return NextResponse.json<ApiResponse>({ success: false, error: { message: "GATE 2 BLOCKED: Beat already sold exclusively.", code: "COPYRIGHT_ERROR" } }, { status: 403 });
        }
      }

      // ==========================================
      // NEW: GATE 1 (ACRCLOUD COPYRIGHT CHECK)
      // ==========================================
      if (untaggedWavKey) {
        const command = new GetObjectCommand({ Bucket: process.env.R2_BUCKET_NAME!, Key: untaggedWavKey });
        const tempAudioUrl = await getSignedUrl(r2, command, { expiresIn: 300 });
        const acrResult = await identifyAudio(tempAudioUrl);
        if (acrResult.isMatch) {
          return NextResponse.json<ApiResponse>({ success: false, error: { message: `GATE 1 BLOCKED: Uncleared sample detected ("${acrResult.matchData}")`, code: "COPYRIGHT_ERROR" } }, { status: 403 });
        }
      }

      // YOUR BEAT CREATION (Now including R2 fields)
      const beat = await prisma.beat.create({
        data: {
          title, description, bpm: bpmNum, key, price: priceNum, type, genres: genres || [],
          moods: moods || [], tags: tags || [], imageUrl, producerId: user.id, clubId: clubId || null,
          // NEW FIELDS:
          untaggedWavKey: untaggedWavKey || null,
          fileHash: fileHash || null,
          audioUrl: audioUrl || "", // Kept so your legacy UI doesn't break
        },
        include: {
          producer: { select: { id: true, username: true, fullName: true, avatar: true, verified: true } },
          club: { select: { id: true, name: true, icon: true } },
        },
      });

      // YOUR ACTIVITY CREATION
      await prisma.activity.create({
        data: {
          userId: user.id, type: "UPLOAD", title: `Uploaded beat "${title}"`,
          description: `New ${type.toLowerCase()} beat at ${bpmNum} BPM for $${priceNum}`,
          referenceId: beat.id, referenceType: "beat",
        },
      });

      return NextResponse.json<ApiResponse>({ success: true, data: { beat } }, { status: 201 });
    } catch (error: any) {
      return NextResponse.json<ApiResponse>({ success: false, error: { message: "Failed to upload beat", code: "SERVER_ERROR" } }, { status: 500 });
    }
  });
}