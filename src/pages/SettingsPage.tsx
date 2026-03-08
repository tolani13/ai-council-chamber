import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useDemoMode } from "@/hooks/useDemoMode";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Settings, Shield, Zap, ZapOff } from "lucide-react";
import { toast } from "sonner";
import type { AppSetting } from "@/lib/types";

export default function SettingsPage() {
  const { isAdmin, profile, roles } = useAuth();
  const { isDemoMode, toggleDemoMode } = useDemoMode();
  const [settings, setSettings] = useState<AppSetting[]>([]);

  useEffect(() => {
    supabase.from("app_settings").select("*").then(({ data }) => data && setSettings(data));
  }, []);

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
          <Settings className="h-8 w-8 text-gold" />
          Settings
        </h1>
        <p className="mt-1 text-muted-foreground">System configuration and preferences</p>
      </div>

      {/* Profile */}
      <div className="rounded-lg border border-border bg-card p-5">
        <h2 className="mb-4 text-lg font-semibold flex items-center gap-2">
          <Shield className="h-5 w-5 text-gold" />
          Your Profile
        </h2>
        <div className="space-y-3">
          <div className="flex justify-between">
            <span className="text-sm text-muted-foreground">Display Name</span>
            <span className="text-sm font-medium">{profile?.display_name || "—"}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-sm text-muted-foreground">Roles</span>
            <div className="flex gap-1">
              {roles.map((r) => (
                <span key={r} className="rounded-full bg-gold/10 px-2.5 py-0.5 text-xs text-gold font-mono uppercase">{r}</span>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Demo Mode */}
      <div className="rounded-lg border border-border bg-card p-5">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold flex items-center gap-2">
              {isDemoMode ? <ZapOff className="h-5 w-5 text-warning" /> : <Zap className="h-5 w-5 text-success" />}
              {isDemoMode ? "Demo Mode" : "Live Mode"}
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              {isDemoMode
                ? "Using stub/placeholder responses. Toggle to send real API calls."
                : "Sending real API calls to configured providers."}
            </p>
          </div>
          <Switch checked={!isDemoMode} onCheckedChange={toggleDemoMode} />
        </div>
      </div>

      {/* App Settings */}
      {isAdmin && (
        <div className="rounded-lg border border-border bg-card p-5">
          <h2 className="mb-4 text-lg font-semibold">App Settings</h2>
          <div className="space-y-3">
            {settings.map((s) => (
              <div key={s.id} className="flex items-center justify-between">
                <span className="text-sm font-mono text-muted-foreground">{s.setting_key}</span>
                <span className="text-sm">{JSON.stringify(s.setting_value_json)}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
