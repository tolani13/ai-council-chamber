import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Sparkles } from "lucide-react";
import type { Run, Step } from "@/lib/types";

export default function RunDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [run, setRun] = useState<Run | null>(null);
  const [steps, setSteps] = useState<Step[]>([]);

  useEffect(() => {
    if (!id) return;
    supabase.from("runs").select("*").eq("id", id).single().then(({ data }) => data && setRun(data));
    supabase.from("steps").select("*").eq("run_id", id).order("created_at").then(({ data }) => data && setSteps(data));
  }, [id]);

  if (!run) return <div className="flex items-center justify-center py-20 text-muted-foreground">Loading...</div>;

  const advisorSteps = steps.filter((s) => s.step_type === "advisor_response");
  const synthesisStep = steps.find((s) => s.step_type === "coordinator_synthesis");

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link to="/runs"><Button variant="ghost" size="sm"><ArrowLeft className="h-4 w-4" /></Button></Link>
        <div>
          <h1 className="text-2xl font-bold">{run.title}</h1>
          <div className="flex items-center gap-3 mt-1">
            <StatusBadge status={run.status} />
            <span className="text-xs text-muted-foreground font-mono">{run.mode} • {new Date(run.created_at).toLocaleString()}</span>
          </div>
        </div>
      </div>

      {run.task_prompt && (
        <div className="rounded-lg border border-border bg-card p-5">
          <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-2">Task Prompt</h3>
          <p className="text-sm leading-relaxed">{run.task_prompt}</p>
        </div>
      )}

      {synthesisStep && (
        <div className="rounded-lg border-2 border-gold-dim bg-card p-5 glow-gold">
          <h3 className="mb-3 text-sm font-semibold uppercase tracking-wider text-gold flex items-center gap-2">
            <Sparkles className="h-4 w-4" /> Coordinator Synthesis
          </h3>
          <div className="text-sm leading-relaxed whitespace-pre-wrap">{synthesisStep.output_text}</div>
        </div>
      )}

      <div className="space-y-3">
        <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Step Log ({steps.length} steps)</h3>
        {advisorSteps.map((step) => (
          <div key={step.id} className="rounded-lg border border-border bg-card p-4">
            <div className="mb-2 flex items-center justify-between">
              <span className="text-sm font-semibold">{step.model_name || "Model"}</span>
              <div className="flex items-center gap-2 text-xs text-muted-foreground font-mono">
                {step.provider && <span>{step.provider}</span>}
                {step.latency_ms && <span>{step.latency_ms}ms</span>}
              </div>
            </div>
            <div className="text-sm leading-relaxed whitespace-pre-wrap text-secondary-foreground">{step.output_text}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
