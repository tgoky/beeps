import { NextRequest, NextResponse } from "next/server";
import { withFullUser, withAuth } from "@/lib/api-middleware";
import { prisma } from "@/lib/prisma";
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

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  return withFullUser(req, async (req) => {
    const messages = await prisma.workspaceMessage.findMany({
      where: { serviceRequestId: params.id },
      include: { sender: { select: { id: true, fullName: true, username: true, avatar: true } } },
      orderBy: { createdAt: "asc" },
    });

    // Generate temporary read links for the audio previews
    const messagesWithUrls = await Promise.all(messages.map(async (msg) => {
      let fileUrl = null;
      if (msg.fileKey) {
        const command = new GetObjectCommand({ Bucket: process.env.R2_BUCKET_NAME!, Key: msg.fileKey });
        fileUrl = await getSignedUrl(r2, command, { expiresIn: 3600 }); // Valid for 1 hour
      }
      return { ...msg, fileUrl };
    }));

    return NextResponse.json({ messages: messagesWithUrls });
  });
}

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  return withFullUser(req, async (req) => {
    const { content, fileKey, fileName, fileType } = await req.json();

    const message = await prisma.workspaceMessage.create({
      data: {
        serviceRequestId: params.id,
        senderId: req.user!.id,
        content,
        fileKey,
        fileName,
        fileType
      },
      include: { sender: { select: { id: true, fullName: true, username: true, avatar: true } } },
    });

    // (Optional: Trigger a notification to the other party here)

    let fileUrl = null;
    if (message.fileKey) {
      const command = new GetObjectCommand({ Bucket: process.env.R2_BUCKET_NAME!, Key: message.fileKey });
      fileUrl = await getSignedUrl(r2, command, { expiresIn: 3600 });
    }

    return NextResponse.json({ message: { ...message, fileUrl } });
  });
}