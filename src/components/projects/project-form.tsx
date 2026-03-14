"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select } from "@/components/ui/select";
import { generateId } from "@/lib/id";

const platformOptions = [
  { value: "web", label: "Web" },
  { value: "mobile", label: "Mobile" },
  { value: "api", label: "API" },
  { value: "fullstack", label: "Full-Stack" },
];

export function ProjectForm() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const formData = new FormData(e.currentTarget);
    const id = generateId();

    try {
      const res = await fetch("/api/v1/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id,
          name: formData.get("name"),
          platform: formData.get("platform"),
          repoUrl: formData.get("repoUrl") || undefined,
          defaultBranch: formData.get("defaultBranch") || "main",
        }),
      });

      if (!res.ok) {
        const json = await res.json();
        throw new Error(json.error?.message ?? "Proje oluşturulamadı");
      }

      router.push(`/projects/${id}/roadmap`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Bilinmeyen hata");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5 max-w-lg">
      <Input
        name="name"
        label="Proje Adı"
        placeholder="Örn: E-Ticaret Platformu"
        required
      />

      <Select
        name="platform"
        label="Platform"
        options={platformOptions}
        defaultValue="web"
      />

      <Input
        name="repoUrl"
        label="Repository URL"
        placeholder="https://github.com/org/repo"
      />

      <Input
        name="defaultBranch"
        label="Varsayılan Branch"
        placeholder="main"
        defaultValue="main"
      />

      {error && (
        <p className="text-sm text-[var(--error)]">{error}</p>
      )}

      <Button type="submit" disabled={loading}>
        {loading ? "Oluşturuluyor..." : "Proje Oluştur"}
      </Button>
    </form>
  );
}
