"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, Rocket } from "lucide-react";
import Link from "next/link";

const ROADMAP_TEMPLATE = `# Ürün Yol Haritası

## Proje Vizyonu
[Projenin amacı ve hedefi]

## Hedef Kitle
[Kimlere yönelik]

## Temel Özellikler
1. [Özellik 1]
2. [Özellik 2]
3. [Özellik 3]

## Teknik Gereksinimler
- [Gereksinim 1]
- [Gereksinim 2]

## Kısıtlar ve Kararlar
- [Karar 1]
- [Karar 2]
`;

export default function RoadmapPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const [roadmap, setRoadmap] = useState(ROADMAP_TEMPLATE);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    // Load existing roadmap if any
    fetch(`/api/v1/projects/${id}`)
      .then((r) => r.json())
      .then((json) => {
        if (json.data?.roadmap) setRoadmap(json.data.roadmap);
      })
      .catch(() => {});
  }, [id]);

  async function handleSave() {
    setSaving(true);
    try {
      await fetch(`/api/v1/projects/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ roadmap }),
      });
    } finally {
      setSaving(false);
    }
  }

  async function handleStartKickoff() {
    setSaving(true);
    try {
      await fetch(`/api/v1/projects/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ roadmap, status: "kickoff" }),
      });
      router.push("/board");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="p-6">
      <Link
        href="/projects"
        className="mb-6 inline-flex items-center gap-1.5 text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
      >
        <ArrowLeft className="h-4 w-4" />
        Projeler
      </Link>

      <div className="mb-6">
        <h1 className="text-lg font-semibold text-[var(--text-primary)]">
          Ürün Yol Haritası
        </h1>
        <p className="mt-1 text-sm text-[var(--text-muted)]">
          Projenizin vizyonunu ve hedeflerini tanımlayın. Analiz başlatıldığında AI agent&apos;lar bu dokümana göre çalışacak.
        </p>
      </div>

      <div className="max-w-3xl">
        <Textarea
          value={roadmap}
          onChange={(e) => setRoadmap(e.target.value)}
          className="min-h-[400px] font-mono text-sm"
          placeholder="Ürün yol haritanızı buraya yazın..."
        />

        <div className="mt-4 flex gap-3">
          <Button variant="secondary" onClick={handleSave} disabled={saving}>
            Kaydet
          </Button>
          <Button onClick={handleStartKickoff} disabled={saving}>
            <Rocket className="h-4 w-4" />
            Analiz Başlat
          </Button>
        </div>
      </div>
    </div>
  );
}
