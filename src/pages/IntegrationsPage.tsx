import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Key, CheckCircle, XCircle, AlertCircle } from "lucide-react";
import type { ModelProvider } from "@/lib/types";

const providerInfo: Record<string, { description: string }> = {
  openai: { description: "GPT-4o, GPT-4, GPT-3.5 and more" },
  deepseek: { description: "DeepSeek Chat & Reasoning models" },
  mistral: { description: "Mistral Large, Medium, Small" },
  cohere: { description: "Command R+, Aya Expanse" },
  kimi: { description: "Moonshot Kimi long-context models" },
  anthropic: { description: "Claude 3.5 Sonnet, Opus, Haiku" },
  google: { description: "Gemini Pro, Flash, Ultra" },
  xai: { description: "Grok models" },
};

export default function IntegrationsPage() {
  const [providers, setProviders] = useState<ModelProvider[]>([]);

  useEffect(() => {
    supabase.from("model_providers").select("*").order("display_name").then(({ data }) => data && setProviders(data));
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
          <Key className="h-8 w-8 text-gold" />
          Integrations
        </h1>
        <p className="mt-1 text-muted-foreground">API key status for each provider. Configure keys via Cloud secrets.</p>
      </div>

      <div className="rounded-lg border border-border bg-card overflow-hidden">
        <div className="grid grid-cols-[1fr_1fr_auto] gap-4 border-b border-border bg-muted/30 px-5 py-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          <span>Provider</span><span>Description</span><span>Status</span>
        </div>
        {providers.map((p) => {
          const info = providerInfo[p.provider_key];
          // In a real app, you'd check if the secret exists via edge function
          const keyConfigured = false; // Placeholder
          return (
            <div key={p.id} className="grid grid-cols-[1fr_1fr_auto] gap-4 items-center border-b border-border px-5 py-4 last:border-0">
              <div>
                <p className="font-medium">{p.display_name}</p>
                <p className="text-xs text-muted-foreground font-mono">{p.provider_key}</p>
              </div>
              <p className="text-sm text-muted-foreground">{info?.description || p.notes || "—"}</p>
              <div className="flex items-center gap-2">
                {keyConfigured ? (
                  <span className="flex items-center gap-1 text-xs text-success"><CheckCircle className="h-4 w-4" /> Configured</span>
                ) : (
                  <span className="flex items-center gap-1 text-xs text-warning"><AlertCircle className="h-4 w-4" /> Not configured</span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <div className="rounded-lg border border-dashed border-border bg-card/50 p-6">
        <h3 className="font-semibold mb-2 flex items-center gap-2">
          <AlertCircle className="h-4 w-4 text-warning" />
          How to configure API keys
        </h3>
        <p className="text-sm text-muted-foreground leading-relaxed">
          API keys are stored securely as Cloud secrets and are never exposed in the client. 
          To configure a provider, add the corresponding secret key (e.g., <code className="text-xs bg-muted px-1 py-0.5 rounded font-mono">OPENAI_API_KEY</code>) 
          through the Cloud settings panel. Keys are automatically available to edge functions for provider calls.
        </p>
      </div>
    </div>
  );
}
