type Ctrl = ReadableStreamDefaultController<Uint8Array>;

// Global map: userId → active SSE stream controllers for that user
const subscribers = new Map<string, Set<Ctrl>>();

export function subscribe(userId: string, ctrl: Ctrl) {
  if (!subscribers.has(userId)) subscribers.set(userId, new Set());
  subscribers.get(userId)!.add(ctrl);
}

export function unsubscribe(userId: string, ctrl: Ctrl) {
  subscribers.get(userId)?.delete(ctrl);
  if (subscribers.get(userId)?.size === 0) subscribers.delete(userId);
}

export function emitToUser(userId: string, event: string, data: unknown) {
  const ctrls = subscribers.get(userId);
  if (!ctrls?.size) return;
  const payload = new TextEncoder().encode(
    `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`
  );
  for (const ctrl of [...ctrls]) {
    try {
      ctrl.enqueue(payload);
    } catch {
      unsubscribe(userId, ctrl);
    }
  }
}
