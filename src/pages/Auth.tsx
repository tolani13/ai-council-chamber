import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Shield } from "lucide-react";
import { toast } from "sonner";
import { Navigate } from "react-router-dom";

export default function Auth() {
  const { user, loading } = useAuth();
  const [isSignUp, setIsSignUp] = useState(false);
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
      if (isSignUp) {
        await signUp(email, password, displayName);
        toast.success("Account created. Check your email to confirm.");
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
      <div className="w-full max-w-sm space-y-8">
        <div className="text-center">
          <div className="mb-4 flex justify-center">
            <div className="rounded-full border border-gold-dim p-3 glow-gold">
              <Shield className="h-8 w-8 text-gold" />
            </div>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Politburo Console</h1>
          <p className="mt-1 text-sm text-muted-foreground">Multi-Model Orchestration Cockpit</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {isSignUp && (
            <div>
              <Label htmlFor="name" className="text-sm text-muted-foreground">Display Name</Label>
              <Input id="name" value={displayName} onChange={(e) => setDisplayName(e.target.value)} className="mt-1 bg-card border-border" />
            </div>
          )}
          <div>
            <Label htmlFor="email" className="text-sm text-muted-foreground">Email</Label>
            <Input id="email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="mt-1 bg-card border-border" />
          </div>
          <div>
            <Label htmlFor="password" className="text-sm text-muted-foreground">Password</Label>
            <Input id="password" type="password" required minLength={6} value={password} onChange={(e) => setPassword(e.target.value)} className="mt-1 bg-card border-border" />
          </div>
          <Button type="submit" disabled={submitting} className="w-full">
            {submitting ? "Processing..." : isSignUp ? "Create Account" : "Sign In"}
          </Button>
        </form>

        <p className="text-center text-sm text-muted-foreground">
          {isSignUp ? "Already have an account?" : "No account yet?"}{" "}
          <button onClick={() => setIsSignUp(!isSignUp)} className="text-gold hover:underline font-medium">
            {isSignUp ? "Sign in" : "Create one"}
          </button>
        </p>

        <p className="text-center text-xs text-muted-foreground/30 font-mono">
          Conceived and created by GPT-5.1 Thinking
        </p>
      </div>
    </div>
  );
}
