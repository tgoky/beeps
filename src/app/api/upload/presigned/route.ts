import { NextRequest, NextResponse } from "next/server";
import { withFullUser, withAuth } from "@/lib/api-middleware";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

const r2 = new S3Client({
  region: "auto",
  endpoint: process.env.CLOUDFLARE_R2_ENDPOINT!,
  credentials: {
    accessKeyId: process.env.CLOUDFLARE_R2_ACCESS_KEY_ID!,
    secretAccessKey: process.env.CLOUDFLARE_R2_SECRET_ACCESS_KEY!,
  },
});

export async function POST(request: NextRequest) {
  return withAuth(request, async (req) => {
    try {
      const { fileName, fileType, fileCategory } = await request.json();
      
      const cleanFileName = fileName.replace(/[^a-zA-Z0-9.-]/g, '_');
      const fileKey = `beats/${req.user!.id}/${Date.now()}-${fileCategory}-${cleanFileName}`;

      const command = new PutObjectCommand({
        Bucket: process.env.R2_BUCKET_NAME!,
        Key: fileKey,
        ContentType: fileType,
      });

      // Give them 1 hour to finish the upload
      const uploadUrl = await getSignedUrl(r2, command, { expiresIn: 3600 });

      return NextResponse.json({ uploadUrl, fileKey });
    } catch (error) {
      console.error("Presigned URL Error:", error);
      return NextResponse.json({ error: "Failed to generate upload URL" }, { status: 500 });
    }
  });
}