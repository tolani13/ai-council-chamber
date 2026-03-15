import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Navigate } from "react-router-dom";
import politburoLogo from "@/assets/politburo-logo-full.png";

type AuthView = "signin" | "signup" | "forgot";

export default function Auth() {
  const { user, loading } = useAuth();
  const [view, setView] = useState<AuthView>("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const { signIn, signUp } = useAuth();

  if (loading) return <div className="flex min-h-screen items-center justify-center bg-background"><span className="text-muted-foreground">Loading...</span></div>;
  if (user) return <Navigate to="/" replace />;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      if (view === "signup") {
        await signUp(email, password, displayName);
        toast.success("Account created. You can now sign in.");
      } else if (view === "forgot") {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: `${window.location.origin}/reset-password`,
        });
        if (error) throw error;
        toast.success("Password reset email sent. Check your inbox.");
      } else {
        await signIn(email, password);
        toast.success("Signed in successfully.");
      }
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="w-full max-w-md space-y-8">
        <div className="flex flex-col items-center gap-4">
          <img
            src={politburoLogo}
            alt="Politburo"
            className="w-[28rem] max-w-full h-auto mix-blend-lighten"
            draggable={false}
          />
          <div className="flex flex-col items-center gap-1.5">
            <h1 className="text-lg font-semibold tracking-[0.25em] uppercase text-foreground">
              AI Console
            </h1>
            <p className="text-sm tracking-widest text-muted-foreground font-light">
              {view === "forgot" ? "Reset your password" : "Intelligence. Orchestrated."}
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {view === "signup" && (
            <div>
              <Label htmlFor="name" className="text-sm text-muted-foreground">Display Name</Label>
              <Input id="name" value={displayName} onChange={(e) => setDisplayName(e.target.value)} className="mt-1 bg-card border-border" />
            </div>
          )}
          <div>
            <Label htmlFor="email" className="text-sm text-muted-foreground">Email</Label>
            <Input id="email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="mt-1 bg-card border-border" />
          </div>
          {view !== "forgot" && (
            <div>
              <Label htmlFor="password" className="text-sm text-muted-foreground">Password</Label>
              <Input id="password" type="password" required minLength={6} value={password} onChange={(e) => setPassword(e.target.value)} className="mt-1 bg-card border-border" />
            </div>
          )}
          <Button type="submit" disabled={submitting} className="w-full">
            {submitting
              ? "Processing..."
              : view === "signup"
              ? "Create Account"
              : view === "forgot"
              ? "Send Reset Link"
              : "Sign In"}
          </Button>
        </form>

        {view === "signin" && (
          <button onClick={() => setView("forgot")} className="block w-full text-center text-xs text-muted-foreground hover:text-gold">
            Forgot password?
          </button>
        )}

        <p className="text-center text-sm text-muted-foreground">
          {view === "signup" ? "Already have an account?" : view === "forgot" ? "Remember your password?" : "No account yet?"}{" "}
          <button
            onClick={() => setView(view === "signup" ? "signin" : view === "forgot" ? "signin" : "signup")}
            className="text-gold hover:underline font-medium"
          >
            {view === "signup" ? "Sign in" : view === "forgot" ? "Sign in" : "Create one"}
          </button>
        </p>

        <p className="text-center text-xs text-muted-foreground/30 font-mono">
          Conceived and created by GPT-5.1 Thinking
        </p>
      </div>
    </div>
  );
}
