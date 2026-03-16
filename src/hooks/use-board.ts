"use client";

import { useState, useEffect, useCallback } from "react";
import type { TaskStatus } from "@/types";

interface Task {
  id: string;
  title: string;
  type: string;
  status: TaskStatus;
  priority: string;
  assigneePersonaId: string | null;
  epicId: string | null;
  labels: string;
  dependencies: string;
  taskNumber: number;
  orderIndex: number;
  projectId: string;
  testSteps: string;
  createdAt: string;
  updatedAt: string;
}

interface Column {
  id: TaskStatus;
  tasks: Task[];
}

interface BoardData {
  columns: Column[];
}

export function useBoard(projectId: string | null) {
  const [data, setData] = useState<BoardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchBoard = useCallback(async () => {
    if (!projectId) {
      setData(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await fetch(`/api/v1/board?projectId=${projectId}`);
      if (!res.ok) throw new Error("Board verisi alınamadı");
      const json = await res.json();
      setData(json.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Bilinmeyen hata");
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    fetchBoard();
  }, [fetchBoard]);

  return { data, loading, error, refetch: fetchBoard };
}
