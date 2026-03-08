import { useAuth } from "@/hooks/useAuth";
import { useDemoMode } from "@/hooks/useDemoMode";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { LogOut, Zap, ZapOff } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export function TopBar() {
  const { user, profile, roles, signOut } = useAuth();
  const { isDemoMode, toggleDemoMode } = useDemoMode();

  return (
    <header className="flex h-14 items-center justify-between border-b border-border bg-card px-6">
      <div className="flex items-center gap-3">
        <h2 className="text-sm font-medium text-muted-foreground">Politburo Console</h2>
        <div className="flex items-center gap-2 rounded-full border border-border px-3 py-1">
          {isDemoMode ? (
            <ZapOff className="h-3 w-3 text-warning" />
          ) : (
            <Zap className="h-3 w-3 text-success" />
          )}
          <span className="text-xs text-muted-foreground">{isDemoMode ? "Demo" : "Live"}</span>
          <Switch checked={!isDemoMode} onCheckedChange={toggleDemoMode} className="scale-75" />
        </div>
      </div>

      <div className="flex items-center gap-4">
        {roles.length > 0 && (
          <Badge variant="outline" className="text-xs border-gold-dim text-gold font-mono uppercase tracking-wider">
            {roles[0]}
          </Badge>
        )}
        {user && (
          <>
            <span className="text-sm text-muted-foreground">{profile?.display_name || user.email}</span>
            <Button variant="ghost" size="sm" onClick={signOut} className="text-muted-foreground hover:text-foreground">
              <LogOut className="h-4 w-4" />
            </Button>
          </>
        )}
      </div>
    </header>
  );
}
