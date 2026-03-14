"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Key, CheckCircle, XCircle } from "lucide-react";

interface Provider {
  id: string;
  name: string;
  authType: string;
  isConnected: boolean;
  connectedAt: string | null;
  credentials: string | null;
}

export default function SettingsPage() {
  const [providers, setProviders] = useState<Provider[]>([]);
  const [loading, setLoading] = useState(true);
  const [apiKeys, setApiKeys] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/v1/providers")
      .then((r) => r.json())
      .then((json) => setProviders(json.data ?? []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  async function handleConnect(providerId: string) {
    const key = apiKeys[providerId];
    if (!key) return;

    setSaving(providerId);
    try {
      const res = await fetch(`/api/v1/providers/${providerId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ credentials: key }),
      });
      if (res.ok) {
        const json = await res.json();
        setProviders((prev) =>
          prev.map((p) => (p.id === providerId ? { ...p, ...json.data, credentials: "••••••••" } : p))
        );
        setApiKeys((prev) => ({ ...prev, [providerId]: "" }));
      }
    } finally {
      setSaving(null);
    }
  }

  const providerIcons: Record<string, string> = {
    claude: "C",
    openai: "O",
    gemini: "G",
  };

  const providerColors: Record<string, string> = {
    claude: "bg-orange-500/20 text-orange-400",
    openai: "bg-green-500/20 text-green-400",
    gemini: "bg-blue-500/20 text-blue-400",
  };

  if (loading) {
    return (
      <div className="p-6">
        <h1 className="mb-6 text-lg font-semibold text-[var(--text-primary)]">Ayarlar</h1>
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-28 animate-pulse rounded-lg bg-[var(--bg-hover)]" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <h1 className="mb-6 text-lg font-semibold text-[var(--text-primary)]">Ayarlar</h1>

      <h2 className="mb-4 text-sm font-medium text-[var(--text-secondary)]">
        AI Sağlayıcılar
      </h2>

      <div className="max-w-2xl space-y-4">
        {providers.map((provider) => (
          <div
            key={provider.id}
            className="rounded-lg border border-[var(--border)] bg-[var(--bg-card)] p-5"
          >
            <div className="mb-3 flex items-center gap-3">
              <div
                className={`flex h-8 w-8 items-center justify-center rounded-md text-sm font-bold ${
                  providerColors[provider.id] ?? "bg-[var(--bg-hover)] text-[var(--text-secondary)]"
                }`}
              >
                {providerIcons[provider.id] ?? "?"}
              </div>
              <div className="flex-1">
                <h3 className="text-sm font-medium text-[var(--text-primary)]">
                  {provider.name}
                </h3>
                <p className="text-xs text-[var(--text-muted)]">
                  {provider.authType === "api_key" ? "API Key" : "OAuth"}
                </p>
              </div>
              {provider.isConnected ? (
                <Badge variant="success">
                  <CheckCircle className="mr-1 h-3 w-3" />
                  Bağlı
                </Badge>
              ) : (
                <Badge variant="muted">
                  <XCircle className="mr-1 h-3 w-3" />
                  Bağlı Değil
                </Badge>
              )}
            </div>

            {provider.authType === "api_key" && (
              <div className="flex gap-2">
                <Input
                  type="password"
                  placeholder="API Key girin..."
                  value={apiKeys[provider.id] ?? ""}
                  onChange={(e) =>
                    setApiKeys((prev) => ({
                      ...prev,
                      [provider.id]: e.target.value,
                    }))
                  }
                  className="flex-1"
                />
                <Button
                  size="sm"
                  onClick={() => handleConnect(provider.id)}
                  disabled={saving === provider.id || !apiKeys[provider.id]}
                >
                  <Key className="h-3.5 w-3.5" />
                  {saving === provider.id ? "..." : "Bağlan"}
                </Button>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
