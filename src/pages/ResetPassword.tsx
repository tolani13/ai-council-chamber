import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Shield } from "lucide-react";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";

export default function ResetPassword() {
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [ready, setReady] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    // Listen for the PASSWORD_RECOVERY event from the auth link
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") {
        setReady(true);
      }
    });
    // Also check if we already have a recovery session from the URL hash
    const hash = window.location.hash;
    if (hash.includes("type=recovery")) {
      setReady(true);
    }
    return () => subscription.unsubscribe();
  }, []);

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;
      toast.success("Password updated. Redirecting...");
      setTimeout(() => navigate("/"), 1500);
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (!ready) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="text-center space-y-4">
          <Shield className="h-8 w-8 text-gold mx-auto" />
          <p className="text-muted-foreground">Verifying recovery link...</p>
          <p className="text-xs text-muted-foreground/50">If nothing happens, the link may have expired.</p>
          <Button variant="outline" onClick={() => navigate("/auth")} className="mt-4">Back to Sign In</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="w-full max-w-sm space-y-8">
        <div className="text-center">
          <div className="mb-4 flex justify-center">
            <div className="rounded-full border border-gold-dim p-3 glow-gold">
              <Shield className="h-8 w-8 text-gold" />
            </div>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Set New Password</h1>
          <p className="mt-1 text-sm text-muted-foreground">Enter your new password below</p>
        </div>

        <form onSubmit={handleReset} className="space-y-4">
          <div>
            <Label htmlFor="password" className="text-sm text-muted-foreground">New Password</Label>
            <Input id="password" type="password" required minLength={6} value={password} onChange={(e) => setPassword(e.target.value)} className="mt-1 bg-card border-border" />
          </div>
          <Button type="submit" disabled={submitting} className="w-full">
            {submitting ? "Updating..." : "Update Password"}
          </Button>
        </form>
      </div>
    </div>
  );
}
