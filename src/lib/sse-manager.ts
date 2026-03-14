type SSEClient = {
  controller: ReadableStreamDefaultController;
  projectId: string;
};

interface SSEEvent {
  type: string;
  data: unknown;
}

class SSEManager {
  private clients: SSEClient[] = [];
  private heartbeatInterval: ReturnType<typeof setInterval> | null = null;

  constructor() {
    // Start heartbeat every 30s
    this.heartbeatInterval = setInterval(() => {
      this.sendHeartbeat();
    }, 30_000);
  }

  subscribe(projectId: string): ReadableStream {
    const stream = new ReadableStream({
      start: (controller) => {
        const client: SSEClient = { controller, projectId };
        this.clients.push(client);

        // Send initial connection event
        const msg = `data: ${JSON.stringify({ type: "connected", data: { projectId } })}\n\n`;
        controller.enqueue(new TextEncoder().encode(msg));
      },
      cancel: () => {
        this.clients = this.clients.filter(
          (c) => c.projectId !== projectId || !c.controller.desiredSize
        );
      },
    });

    return stream;
  }

  broadcast(projectId: string, event: SSEEvent) {
    const msg = `data: ${JSON.stringify(event)}\n\n`;
    const encoded = new TextEncoder().encode(msg);

    this.clients = this.clients.filter((client) => {
      if (client.projectId !== projectId) return true;
      try {
        client.controller.enqueue(encoded);
        return true;
      } catch {
        // Client disconnected
        return false;
      }
    });
  }

  private sendHeartbeat() {
    const msg = `: heartbeat\n\n`;
    const encoded = new TextEncoder().encode(msg);

    this.clients = this.clients.filter((client) => {
      try {
        client.controller.enqueue(encoded);
        return true;
      } catch {
        return false;
      }
    });
  }
}

// Singleton
export const sseManager = new SSEManager();
