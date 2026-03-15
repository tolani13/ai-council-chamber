import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import politburoLogo from "@/assets/politburo-logo-full.png";

type AuthView = "signin" | "signup" | "forgot";

export default function Auth() {
  const [view, setView] = useState<AuthView>("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const { signIn, signUp } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      if (view === "signup") {
        await signUp(email, password, displayName);
        toast({ title: "Account created", description: "Check your email to confirm your account." });
        setView("signin");
      } else if (view === "forgot") {
        const { supabase } = await import("@/integrations/supabase/client");
        await supabase.auth.resetPasswordForEmail(email, { redirectTo: `${window.location.origin}/reset-password` });
        toast({ title: "Reset link sent", description: "Check your email for a password reset link." });
        setView("signin");
      } else {
        await signIn(email, password);
        navigate("/");
      }
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background">
      <div className="flex justify-center w-full max-w-[520px] mb-8">
        <img
          src={politburoLogo}
          alt="Politburo"
          className="w-full h-auto mix-blend-lighten"
          draggable={false}
        />
      </div>

      <div className="w-full max-w-sm space-y-6">
        <form onSubmit={handleSubmit} className="space-y-4">
          {view === "signup" && (
            <div>
              <Label htmlFor="name" className="text-sm text-muted-foreground">
                Display Name
              </Label>
              <Input
                id="name"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                className="mt-1 bg-card border-border"
              />
            </div>
          )}
          <div>
            <Label htmlFor="email" className="text-sm text-muted-foreground">
              Email
            </Label>
            <Input
              id="email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1 bg-card border-border"
            />
          </div>
          {view !== "forgot" && (
            <div>
              <Label htmlFor="password" className="text-sm text-muted-foreground">
                Password
              </Label>
              <Input
                id="password"
                type="password"
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="mt-1 bg-card border-border"
              />
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
          <button
            onClick={() => setView("forgot")}
            className="block w-full text-center text-xs text-muted-foreground hover:text-gold"
          >
            Forgot password?
          </button>
        )}

        <p className="text-center text-sm text-muted-foreground">
          {view === "signup"
            ? "Already have an account?"
            : view === "forgot"
              ? "Remember your password?"
              : "No account yet?"}{" "}
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
