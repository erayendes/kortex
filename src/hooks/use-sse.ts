"use client";

import { useEffect, useRef, useCallback } from "react";

interface SSEEvent {
  type: string;
  data: unknown;
}

export function useSSE(
  projectId: string | null,
  onEvent: (event: SSEEvent) => void
) {
  const eventSourceRef = useRef<EventSource | null>(null);
  const onEventRef = useRef(onEvent);
  onEventRef.current = onEvent;

  const connect = useCallback(() => {
    if (!projectId) return;

    // Close existing connection
    eventSourceRef.current?.close();

    const es = new EventSource(`/api/v1/projects/${projectId}/stream`);

    es.onmessage = (e) => {
      try {
        const event = JSON.parse(e.data) as SSEEvent;
        onEventRef.current(event);
      } catch {
        // Ignore parse errors (heartbeats, etc.)
      }
    };

    es.onerror = () => {
      es.close();
      // Reconnect after 3s
      setTimeout(connect, 3000);
    };

    eventSourceRef.current = es;
  }, [projectId]);

  useEffect(() => {
    connect();
    return () => {
      eventSourceRef.current?.close();
    };
  }, [connect]);
}
