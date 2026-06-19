import { NextRequest, NextResponse } from "next/server"; // ✅ Added NextResponse import
import { withAuth, type AuthenticatedRequest } from "@/lib/api-middleware";
import { subscribe, unsubscribe } from "@/lib/session-emitter";

// GET /api/sessions/stream - SSE endpoint for real-time session updates
export async function GET(req: NextRequest) {
  return withAuth(req, async (req: AuthenticatedRequest) => {
    const user = req.user!;
    const encoder = new TextEncoder();
    let ctrl: ReadableStreamDefaultController<Uint8Array>;
    let heartbeatTimer: ReturnType<typeof setInterval>;

    const stream = new ReadableStream<Uint8Array>({
      start(c) {
        ctrl = c;
        subscribe(user.id, ctrl);
        // Initial handshake so the client knows it's connected
        ctrl.enqueue(encoder.encode(`event: connected\ndata: {}\n\n`));
        // Keep-alive ping every 25s (proxy timeout is typically 30–60s)
        heartbeatTimer = setInterval(() => {
          try {
            ctrl.enqueue(encoder.encode(`: heartbeat\n\n`));
          } catch {
            clearInterval(heartbeatTimer);
          }
        }, 25000);
      },
      cancel() {
        clearInterval(heartbeatTimer);
        unsubscribe(user.id, ctrl);
      },
    });

    // ✅ Changed 'new Response' to 'new NextResponse' to satisfy the middleware types
    return new NextResponse(stream as any, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache, no-transform",
        Connection: "keep-alive",
        "X-Accel-Buffering": "no", // Disable Nginx response buffering
      },
    });
  });
}