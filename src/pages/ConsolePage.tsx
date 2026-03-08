import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useDemoMode, generateDemoResponse, generateDemoSynthesis } from "@/hooks/useDemoMode";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ModelChip } from "@/components/shared/ModelChip";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { Terminal, Play, Sparkles, Loader2 } from "lucide-react";
import { toast } from "sonner";
import type { Model, PromptTemplate, Step } from "@/lib/types";

export default function ConsolePage() {
  const { user } = useAuth();
  const { isDemoMode } = useDemoMode();
  const [models, setModels] = useState<Model[]>([]);
  const [templates, setTemplates] = useState<PromptTemplate[]>([]);
  const [selectedModels, setSelectedModels] = useState<Set<string>>(new Set());
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [systemPrompt, setSystemPrompt] = useState("");
  const [taskPrompt, setTaskPrompt] = useState("");
  const [selectedTemplate, setSelectedTemplate] = useState("");
  const [running, setRunning] = useState(false);
  const [steps, setSteps] = useState<(Step & { model_display_name?: string; model_color?: string })[]>([]);
  const [synthesis, setSynthesis] = useState<string | null>(null);
  const [synthesizing, setSynthesizing] = useState(false);
  const [currentRunId, setCurrentRunId] = useState<string | null>(null);

  useEffect(() => {
    supabase.from("models").select("*, model_providers(*)").eq("enabled", true).order("sort_order").then(({ data }) => {
      if (data) {
        setModels(data as Model[]);
        setSelectedModels(new Set(data.map((m) => m.id)));
      }
    });
    supabase.from("prompt_templates").select("*").eq("enabled", true).then(({ data }) => {
      if (data) {
        setTemplates(data);
        const sysTemplate = data.find((t) => t.template_type === "system");
        if (sysTemplate) setSystemPrompt(sysTemplate.content);
      }
    });
  }, []);

  const handleTemplateSelect = (templateId: string) => {
    setSelectedTemplate(templateId);
    const t = templates.find((t) => t.id === templateId);
    if (t) setSystemPrompt(t.content);
  };

  const toggleModel = (id: string) => {
    setSelectedModels((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const runEnsemble = async () => {
    if (!taskPrompt.trim()) { toast.error("Enter a task prompt"); return; }
    if (selectedModels.size === 0) { toast.error("Select at least one model"); return; }

    setRunning(true);
    setSteps([]);
    setSynthesis(null);

    try {
      // Create run
      const { data: run, error: runError } = await supabase
        .from("runs")
        .insert({ title: title || "Untitled Run", description, mode: "console", status: "running", system_prompt: systemPrompt, task_prompt: taskPrompt, created_by: user?.id })
        .select()
        .single();

      if (runError) throw runError;
      setCurrentRunId(run.id);

      // Create participants
      const participants = Array.from(selectedModels).map((modelId, i) => ({
        run_id: run.id,
        model_id: modelId,
        role_in_run: "advisor",
        seat_order: i,
      }));
      await supabase.from("run_participants").insert(participants);

      // Generate responses
      const selected = models.filter((m) => selectedModels.has(m.id));
      const newSteps: typeof steps = [];

      for (const model of selected) {
        const startTime = Date.now();
        let output: string;
        let latency: number;

        if (isDemoMode) {
          await new Promise((r) => setTimeout(r, 500 + Math.random() * 1500));
          output = generateDemoResponse(model.model_key, taskPrompt);
          latency = Date.now() - startTime;
        } else {
          output = `[Live mode] Response from ${model.display_name} — API integration pending. Configure provider keys in Integrations.`;
          latency = Date.now() - startTime;
        }

        const stepData = {
          run_id: run.id,
          model_id: model.id,
          step_type: "advisor_response",
          provider: (model as any).model_providers?.provider_key,
          model_name: model.display_name,
          input_text: taskPrompt,
          output_text: output,
          latency_ms: latency,
        };

        const { data: step } = await supabase.from("steps").insert(stepData).select().single();
        if (step) {
          const enrichedStep = { ...step, model_display_name: model.display_name, model_color: model.color_tag || undefined };
          newSteps.push(enrichedStep);
          setSteps((prev) => [...prev, enrichedStep]);
        }
      }

      await supabase.from("runs").update({ status: "completed" }).eq("id", run.id);
      toast.success("Ensemble run completed");
    } catch (err: any) {
      toast.error(err.message || "Run failed");
    } finally {
      setRunning(false);
    }
  };

  const requestSynthesis = async () => {
    if (steps.length === 0) return;
    setSynthesizing(true);

    try {
      const advisorOutputs = steps.filter((s) => s.step_type === "advisor_response").map((s) => s.output_text || "");
      let synthesisText: string;

      if (isDemoMode) {
        await new Promise((r) => setTimeout(r, 1000 + Math.random() * 1000));
        synthesisText = generateDemoSynthesis(advisorOutputs);
      } else {
        synthesisText = "[Live mode] Coordinator synthesis — API integration pending.";
      }

      if (currentRunId) {
        await supabase.from("steps").insert({
          run_id: currentRunId,
          step_type: "coordinator_synthesis",
          model_name: "Coordinator",
          input_text: advisorOutputs.join("\n---\n"),
          output_text: synthesisText,
        });
      }

      setSynthesis(synthesisText);
      toast.success("Synthesis generated");
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setSynthesizing(false);
    }
  };

  const systemTemplates = templates.filter((t) => t.template_type === "system" || t.template_type === "coordinator");

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
            <Terminal className="h-8 w-8 text-gold" />
            Console Mode
          </h1>
          <p className="mt-1 text-muted-foreground">Multi-model ensemble orchestration</p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* Left Panel: Model Selection */}
        <div className="lg:col-span-3 space-y-4">
          <div className="rounded-lg border border-border bg-card p-4">
            <h3 className="mb-3 text-sm font-semibold uppercase tracking-wider text-muted-foreground">Models</h3>
            <div className="space-y-2">
              {models.map((model) => (
                <ModelChip
                  key={model.id}
                  name={model.display_name}
                  colorTag={model.color_tag}
                  seatType={model.seat_type}
                  active={selectedModels.has(model.id)}
                  onClick={() => toggleModel(model.id)}
                  className="w-full justify-start"
                />
              ))}
            </div>
            <p className="mt-3 text-xs text-muted-foreground">{selectedModels.size} selected</p>
          </div>
        </div>

        {/* Center Panel: Task Configuration */}
        <div className="lg:col-span-5 space-y-4">
          <div className="rounded-lg border border-border bg-card p-5 space-y-4">
            <div>
              <Label className="text-sm text-muted-foreground">Run Title</Label>
              <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Q3 Strategy Analysis" className="mt-1 bg-muted border-border" />
            </div>
            <div>
              <Label className="text-sm text-muted-foreground">Description</Label>
              <Input value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Brief description of this run" className="mt-1 bg-muted border-border" />
            </div>
            <div>
              <Label className="text-sm text-muted-foreground">Prompt Template</Label>
              <Select value={selectedTemplate} onValueChange={handleTemplateSelect}>
                <SelectTrigger className="mt-1 bg-muted border-border">
                  <SelectValue placeholder="Select template..." />
                </SelectTrigger>
                <SelectContent>
                  {systemTemplates.map((t) => (
                    <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-sm text-muted-foreground">System Prompt</Label>
              <Textarea value={systemPrompt} onChange={(e) => setSystemPrompt(e.target.value)} rows={4} className="mt-1 bg-muted border-border text-sm font-mono" />
            </div>
            <div>
              <Label className="text-sm text-muted-foreground">Task Prompt</Label>
              <Textarea value={taskPrompt} onChange={(e) => setTaskPrompt(e.target.value)} rows={5} placeholder="Describe the task or question for the AI council..." className="mt-1 bg-muted border-border" />
            </div>

            <div className="flex gap-3">
              <Button onClick={runEnsemble} disabled={running} className="flex-1 gap-2">
                {running ? <Loader2 className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4" />}
                {running ? "Running Ensemble..." : "Run Ensemble"}
              </Button>
              <Button onClick={requestSynthesis} disabled={synthesizing || steps.length === 0} variant="outline" className="gap-2">
                {synthesizing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                Synthesize
              </Button>
            </div>
          </div>
        </div>

        {/* Right Panel: Responses */}
        <div className="lg:col-span-4 space-y-4">
          {synthesis && (
            <div className="rounded-lg border-2 border-gold-dim bg-card p-5 glow-gold">
              <h3 className="mb-3 text-sm font-semibold uppercase tracking-wider text-gold flex items-center gap-2">
                <Sparkles className="h-4 w-4" /> Coordinator Synthesis
              </h3>
              <div className="text-sm leading-relaxed whitespace-pre-wrap">{synthesis}</div>
            </div>
          )}

          {steps.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Advisor Responses</h3>
              {steps.map((step) => (
                <div key={step.id} className="rounded-lg border border-border bg-card p-4">
                  <div className="mb-2 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {step.model_color && <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: step.model_color }} />}
                      <span className="text-sm font-semibold">{step.model_display_name || step.model_name}</span>
                    </div>
                    {step.latency_ms && <span className="text-xs text-muted-foreground font-mono">{step.latency_ms}ms</span>}
                  </div>
                  <div className="text-sm leading-relaxed whitespace-pre-wrap text-secondary-foreground">
                    {step.output_text}
                  </div>
                </div>
              ))}
            </div>
          )}

          {steps.length === 0 && !running && (
            <div className="rounded-lg border border-dashed border-border bg-card/50 p-8 text-center">
              <Terminal className="mx-auto mb-3 h-8 w-8 text-muted-foreground/30" />
              <p className="text-sm text-muted-foreground">Configure your task and run the ensemble to see responses here.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
