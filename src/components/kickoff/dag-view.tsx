"use client";

import { useState } from "react";
import { StepNode } from "./step-node";
import { StepDetailPanel } from "./step-detail-panel";

interface Step {
  id: string;
  personaId: string;
  title: string;
  status: string;
  stepOrder: number;
  dependsOn: string;
  outputDocumentId: string | null;
  error: string | null;
}

interface DagViewProps {
  steps: Step[];
  onRefresh: () => void;
}

export function DagView({ steps, onRefresh }: DagViewProps) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const selected = steps.find((s) => s.id === selectedId);

  // Group steps by order for horizontal layout
  const groups = new Map<number, Step[]>();
  for (const step of steps) {
    const group = groups.get(step.stepOrder) ?? [];
    group.push(step);
    groups.set(step.stepOrder, group);
  }

  const sortedOrders = [...groups.keys()].sort((a, b) => a - b);

  return (
    <div className="flex h-full">
      {/* DAG */}
      <div className="flex-1 overflow-x-auto p-6">
        <div className="flex items-start gap-6">
          {sortedOrders.map((order) => (
            <div key={order} className="flex shrink-0 flex-col gap-3">
              {groups.get(order)!.map((step) => (
                <StepNode
                  key={step.id}
                  step={step}
                  isSelected={step.id === selectedId}
                  onClick={() => setSelectedId(step.id === selectedId ? null : step.id)}
                />
              ))}
            </div>
          ))}
        </div>
      </div>

      {/* Detail panel */}
      {selected && (
        <div className="w-96 shrink-0">
          <StepDetailPanel
            step={selected}
            onClose={() => setSelectedId(null)}
            onRefresh={onRefresh}
          />
        </div>
      )}
    </div>
  );
}
