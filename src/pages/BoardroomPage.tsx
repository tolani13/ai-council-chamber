import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useDemoMode, generateDemoResponse } from "@/hooks/useDemoMode";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { ModelChip } from "@/components/shared/ModelChip";
import { Users, Play, MessageSquare, Crown, Loader2, Gavel } from "lucide-react";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import type { Model, Utterance } from "@/lib/types";
import { cn } from "@/lib/utils";

interface BoardroomSeat {
  model: Model;
  status: "idle" | "thinking" | "speaking" | "done";
  lastMessage?: string;
}

export default function BoardroomPage() {
  const { user } = useAuth();
  const { isDemoMode } = useDemoMode();
  const [models, setModels] = useState<Model[]>([]);
  const [selectedModels, setSelectedModels] = useState<Set<string>>(new Set());
  const [moderatorId, setModeratorId] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [topic, setTopic] = useState("");
  const [agendaText, setAgendaText] = useState("");
  const [seats, setSeats] = useState<BoardroomSeat[]>([]);
  const [utterances, setUtterances] = useState<Utterance[]>([]);
  const [running, setRunning] = useState(false);
  const [meetingId, setMeetingId] = useState<string | null>(null);
  const [turnNumber, setTurnNumber] = useState(0);
  const [summaryText, setSummaryText] = useState<string | null>(null);

  useEffect(() => {
    supabase.from("models").select("*, model_providers(*)").eq("enabled", true).order("sort_order").then(({ data }) => {
      if (data) {
        setModels(data as Model[]);
        setSelectedModels(new Set(data.map((m) => m.id)));
        if (data.length > 0) setModeratorId(data[0].id);
      }
    });
  }, []);

  const toggleModel = (id: string) => {
    setSelectedModels((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const participantModels = models.filter((m) => selectedModels.has(m.id));
  const moderatorModel = models.find((m) => m.id === moderatorId);
  const advisorModels = participantModels.filter((m) => m.id !== moderatorId);

  const runRound = async () => {
    if (!agendaText.trim()) { toast.error("Enter an agenda item"); return; }
    if (participantModels.length < 2) { toast.error("Select at least 2 models"); return; }

    setRunning(true);
    setSummaryText(null);
    const newTurn = turnNumber + 1;
    setTurnNumber(newTurn);

    try {
      // Create meeting if first turn
      let mId = meetingId;
      if (!mId) {
        const { data: meeting, error } = await supabase
          .from("meetings")
          .insert({ title: title || "Untitled Meeting", topic, status: "active", created_by: user?.id })
          .select().single();
        if (error) throw error;
        mId = meeting.id;
        setMeetingId(mId);
      }

      // Create turn
      const { data: turn, error: turnError } = await supabase
        .from("turns")
        .insert({ meeting_id: mId, turn_number: newTurn, agenda_text: agendaText })
        .select().single();
      if (turnError) throw turnError;

      // Initialize seats
      const initialSeats: BoardroomSeat[] = participantModels.map((m) => ({
        model: m,
        status: "idle",
      }));
      setSeats(initialSeats);

      // First round: advisor responses
      for (const model of advisorModels) {
        setSeats((prev) => prev.map((s) => s.model.id === model.id ? { ...s, status: "thinking" } : s));

        let response: string;
        if (isDemoMode) {
          await new Promise((r) => setTimeout(r, 800 + Math.random() * 1200));
          response = generateDemoResponse(model.model_key, agendaText);
        } else {
          response = `[Live mode] ${model.display_name} response pending — configure API keys.`;
        }

        const utterance: any = {
          meeting_id: mId,
          turn_id: turn.id,
          model_id: model.id,
          speaker_type: "model",
          speaker_name: model.display_name,
          utterance_text: response,
        };

        const { data: utt } = await supabase.from("utterances").insert(utterance).select().single();
        if (utt) setUtterances((prev) => [...prev, utt]);

        setSeats((prev) => prev.map((s) =>
          s.model.id === model.id ? { ...s, status: "done", lastMessage: response.slice(0, 100) + "..." } : s
        ));
      }

      // Moderator summary
      if (moderatorModel) {
        setSeats((prev) => prev.map((s) =>
          s.model.id === moderatorModel.id ? { ...s, status: "thinking" } : s
        ));

        let summary: string;
        if (isDemoMode) {
          await new Promise((r) => setTimeout(r, 1000));
          summary = `## Moderator Summary — Round ${newTurn}\n\nThe council has deliberated on: "${agendaText}"\n\n**Key Points:**\n- Consensus on phased approach\n- Divergent views on timeline and risk tolerance\n- All advisors recommend structured validation\n\n**Chair's Assessment:** Proceed with measured implementation. Schedule follow-up review.`;
        } else {
          summary = `[Live mode] Moderator summary pending.`;
        }

        const modUtterance: any = {
          meeting_id: mId,
          turn_id: turn.id,
          model_id: moderatorModel.id,
          speaker_type: "moderator",
          speaker_name: `${moderatorModel.display_name} (Moderator)`,
          utterance_text: summary,
        };

        const { data: modUtt } = await supabase.from("utterances").insert(modUtterance).select().single();
        if (modUtt) setUtterances((prev) => [...prev, modUtt]);

        await supabase.from("turns").update({ summary_text: summary }).eq("id", turn.id);
        setSummaryText(summary);

        setSeats((prev) => prev.map((s) =>
          s.model.id === moderatorModel.id ? { ...s, status: "done", lastMessage: summary.slice(0, 100) + "..." } : s
        ));
      }

      toast.success(`Round ${newTurn} complete`);
    } catch (err: any) {
      toast.error(err.message || "Round failed");
    } finally {
      setRunning(false);
    }
  };

  // Position seats around an elliptical table
  const getSeatPosition = (index: number, total: number, isModerator: boolean) => {
    if (isModerator) return { top: "5%", left: "50%", transform: "translateX(-50%)" };
    const angle = (Math.PI * (0.15 + (0.7 * index) / Math.max(total - 1, 1))) + Math.PI * 0.15;
    const rx = 42;
    const ry = 36;
    const cx = 50;
    const cy = 50;
    return {
      left: `${cx + rx * Math.cos(angle)}%`,
      top: `${cy + ry * Math.sin(angle)}%`,
      transform: "translate(-50%, -50%)",
    };
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
          <Users className="h-8 w-8 text-gold" />
          Boardroom
        </h1>
        <p className="mt-1 text-muted-foreground">Strategic AI roundtable — structured deliberation</p>
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-12">
        {/* Setup Panel */}
        <div className="xl:col-span-3 space-y-4">
          <div className="rounded-lg border border-border bg-card p-4 space-y-4">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Meeting Setup</h3>
            <div>
              <Label className="text-xs text-muted-foreground">Title</Label>
              <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Strategic Review" className="mt-1 bg-muted border-border" />
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">Topic</Label>
              <Input value={topic} onChange={(e) => setTopic(e.target.value)} placeholder="Q3 roadmap decisions" className="mt-1 bg-muted border-border" />
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">Chair / Moderator</Label>
              <div className="mt-1 space-y-1">
                {participantModels.map((m) => (
                  <button
                    key={m.id}
                    onClick={() => setModeratorId(m.id)}
                    className={cn(
                      "flex w-full items-center gap-2 rounded px-2 py-1.5 text-xs transition-colors",
                      moderatorId === m.id ? "bg-gold/10 text-gold" : "text-muted-foreground hover:bg-muted"
                    )}
                  >
                    {moderatorId === m.id && <Crown className="h-3 w-3" />}
                    {m.color_tag && <span className="h-2 w-2 rounded-full" style={{ backgroundColor: m.color_tag }} />}
                    {m.display_name}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <Label className="text-xs text-muted-foreground">Participants</Label>
              <div className="mt-1 space-y-1">
                {models.map((m) => (
                  <ModelChip
                    key={m.id}
                    name={m.display_name}
                    colorTag={m.color_tag}
                    active={selectedModels.has(m.id)}
                    onClick={() => toggleModel(m.id)}
                    className="w-full text-xs justify-start"
                  />
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Boardroom Table */}
        <div className="xl:col-span-6">
          <div className="relative rounded-xl border border-border bg-card p-4" style={{ minHeight: "500px" }}>
            {/* Table */}
            <div className="absolute inset-8 rounded-[50%] border-2 border-gold-dim/30 bg-gradient-to-b from-muted/50 to-muted/20" style={{ boxShadow: "inset 0 4px 30px rgba(0,0,0,0.3), 0 0 60px -20px hsl(45 100% 55% / 0.08)" }} />

            {/* Center label */}
            <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-center z-10">
              {agendaText ? (
                <p className="text-xs text-muted-foreground max-w-[200px] leading-tight">"{agendaText.slice(0, 80)}{agendaText.length > 80 ? '...' : ''}"</p>
              ) : (
                <p className="text-xs text-muted-foreground/40">Awaiting agenda</p>
              )}
              {turnNumber > 0 && <p className="mt-1 text-xs text-gold font-mono">Round {turnNumber}</p>}
            </div>

            {/* Seats */}
            <AnimatePresence>
              {seats.map((seat, i) => {
                const isModerator = seat.model.id === moderatorId;
                const position = getSeatPosition(
                  isModerator ? 0 : advisorModels.findIndex((m) => m.id === seat.model.id),
                  advisorModels.length,
                  isModerator
                );

                return (
                  <motion.div
                    key={seat.model.id}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="absolute z-20"
                    style={position}
                  >
                    <div className={cn(
                      "w-32 rounded-lg border p-3 text-center transition-all",
                      seat.status === "thinking" && "border-info bg-info/10 animate-pulse-gold",
                      seat.status === "speaking" && "border-gold bg-gold/10 glow-gold",
                      seat.status === "done" && "border-success/30 bg-card",
                      seat.status === "idle" && "border-border bg-card/80",
                      isModerator && "border-gold-dim"
                    )}>
                      {isModerator && <Crown className="mx-auto mb-1 h-3 w-3 text-gold" />}
                      {seat.model.color_tag && <span className="mx-auto mb-1 block h-2 w-2 rounded-full" style={{ backgroundColor: seat.model.color_tag }} />}
                      <p className="text-xs font-semibold truncate">{seat.model.display_name}</p>
                      <p className="text-[10px] text-muted-foreground capitalize">{isModerator ? "Chair" : seat.model.seat_type || "advisor"}</p>
                      {seat.status === "thinking" && <p className="mt-1 text-[10px] text-info animate-thinking">Deliberating...</p>}
                      {seat.lastMessage && seat.status === "done" && (
                        <p className="mt-1 text-[10px] text-muted-foreground line-clamp-2">{seat.lastMessage}</p>
                      )}
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>

            {seats.length === 0 && (
              <div className="absolute inset-0 flex items-center justify-center">
                <p className="text-sm text-muted-foreground/40">Select models and begin a round</p>
              </div>
            )}
          </div>

          {/* Agenda Input */}
          <div className="mt-4 rounded-lg border border-border bg-card p-4">
            <Label className="text-xs text-muted-foreground">Current Agenda / Question</Label>
            <Textarea value={agendaText} onChange={(e) => setAgendaText(e.target.value)} rows={3} placeholder="What should the council deliberate on?" className="mt-1 bg-muted border-border" />
            <Button onClick={runRound} disabled={running} className="mt-3 w-full gap-2">
              {running ? <Loader2 className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4" />}
              {running ? "Round in Progress..." : `Begin Round ${turnNumber + 1}`}
            </Button>
          </div>
        </div>

        {/* Timeline / Minutes */}
        <div className="xl:col-span-3 space-y-4">
          <div className="rounded-lg border border-border bg-card p-4">
            <h3 className="mb-3 text-sm font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
              <MessageSquare className="h-4 w-4" /> Minutes
            </h3>

            {summaryText && (
              <div className="mb-4 rounded-md border border-gold-dim bg-gold/5 p-3">
                <div className="flex items-center gap-1 mb-2">
                  <Gavel className="h-3 w-3 text-gold" />
                  <span className="text-xs font-semibold text-gold">Chair Summary</span>
                </div>
                <p className="text-xs leading-relaxed whitespace-pre-wrap">{summaryText}</p>
              </div>
            )}

            <div className="space-y-2 max-h-96 overflow-y-auto">
              {utterances.map((utt) => (
                <div key={utt.id} className="rounded-md border border-border bg-muted/20 p-3">
                  <div className="flex items-center gap-1 mb-1">
                    <span className={cn(
                      "text-xs font-semibold",
                      utt.speaker_type === "moderator" ? "text-gold" : "text-foreground"
                    )}>
                      {utt.speaker_name}
                    </span>
                    <span className="text-[10px] text-muted-foreground capitalize">• {utt.speaker_type}</span>
                  </div>
                  <p className="text-xs leading-relaxed text-secondary-foreground whitespace-pre-wrap">{utt.utterance_text}</p>
                </div>
              ))}
              {utterances.length === 0 && (
                <p className="text-xs text-muted-foreground/40 text-center py-8">No deliberations yet</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
