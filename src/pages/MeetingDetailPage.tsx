import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Gavel, MessageSquare } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Meeting, Turn, Utterance } from "@/lib/types";

export default function MeetingDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [meeting, setMeeting] = useState<Meeting | null>(null);
  const [turns, setTurns] = useState<Turn[]>([]);
  const [utterances, setUtterances] = useState<Utterance[]>([]);

  useEffect(() => {
    if (!id) return;
    supabase.from("meetings").select("*").eq("id", id).single().then(({ data }) => data && setMeeting(data));
    supabase.from("turns").select("*").eq("meeting_id", id).order("turn_number").then(({ data }) => data && setTurns(data));
    supabase.from("utterances").select("*").eq("meeting_id", id).order("created_at").then(({ data }) => data && setUtterances(data));
  }, [id]);

  if (!meeting) return <div className="flex items-center justify-center py-20 text-muted-foreground">Loading...</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link to="/meetings"><Button variant="ghost" size="sm"><ArrowLeft className="h-4 w-4" /></Button></Link>
        <div>
          <h1 className="text-2xl font-bold">{meeting.title}</h1>
          <div className="flex items-center gap-3 mt-1">
            <StatusBadge status={meeting.status} />
            {meeting.topic && <span className="text-sm text-muted-foreground">{meeting.topic}</span>}
          </div>
        </div>
      </div>

      {turns.map((turn) => {
        const turnUtterances = utterances.filter((u) => u.turn_id === turn.id);
        return (
          <div key={turn.id} className="rounded-lg border border-border bg-card p-5">
            <h3 className="mb-1 font-semibold flex items-center gap-2">
              <MessageSquare className="h-4 w-4 text-gold" />
              Round {turn.turn_number}
            </h3>
            {turn.agenda_text && <p className="text-sm text-muted-foreground mb-4">"{turn.agenda_text}"</p>}

            <div className="space-y-3">
              {turnUtterances.map((utt) => (
                <div key={utt.id} className="rounded-md border border-border bg-muted/20 p-3">
                  <span className={cn("text-xs font-semibold", utt.speaker_type === "moderator" ? "text-gold" : "text-foreground")}>
                    {utt.speaker_name}
                  </span>
                  <p className="mt-1 text-sm leading-relaxed whitespace-pre-wrap">{utt.utterance_text}</p>
                </div>
              ))}
            </div>

            {turn.summary_text && (
              <div className="mt-4 rounded-md border border-gold-dim bg-gold/5 p-3">
                <div className="flex items-center gap-1 mb-2">
                  <Gavel className="h-3 w-3 text-gold" />
                  <span className="text-xs font-semibold text-gold">Chair Summary</span>
                </div>
                <p className="text-sm leading-relaxed whitespace-pre-wrap">{turn.summary_text}</p>
              </div>
            )}
          </div>
        );
      })}

      {turns.length === 0 && <p className="text-center text-muted-foreground py-12">No rounds recorded for this meeting.</p>}
    </div>
  );
}
