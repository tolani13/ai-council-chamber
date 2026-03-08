import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { Terminal, Users, Plus, Database, History, Zap } from "lucide-react";
import type { Run, Meeting, Model } from "@/lib/types";

export default function Dashboard() {
  const [recentRuns, setRecentRuns] = useState<Run[]>([]);
  const [recentMeetings, setRecentMeetings] = useState<Meeting[]>([]);
  const [models, setModels] = useState<Model[]>([]);

  useEffect(() => {
    supabase.from("runs").select("*").order("created_at", { ascending: false }).limit(5).then(({ data }) => data && setRecentRuns(data));
    supabase.from("meetings").select("*").order("created_at", { ascending: false }).limit(5).then(({ data }) => data && setRecentMeetings(data));
    supabase.from("models").select("*, model_providers(*)").order("sort_order").then(({ data }) => data && setModels(data as Model[]));
  }, []);

  const enabledModels = models.filter((m) => m.enabled);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Command Center</h1>
        <p className="mt-1 text-muted-foreground">Multi-model orchestration at your fingertips</p>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Link to="/console">
          <div className="group rounded-lg border border-border bg-card p-5 transition-all hover:border-gold-dim hover:glow-gold">
            <Terminal className="mb-3 h-6 w-6 text-gold" />
            <h3 className="font-semibold text-foreground">Console Mode</h3>
            <p className="mt-1 text-sm text-muted-foreground">Run ensemble analysis</p>
          </div>
        </Link>
        <Link to="/boardroom">
          <div className="group rounded-lg border border-border bg-card p-5 transition-all hover:border-gold-dim hover:glow-gold">
            <Users className="mb-3 h-6 w-6 text-gold" />
            <h3 className="font-semibold text-foreground">Boardroom</h3>
            <p className="mt-1 text-sm text-muted-foreground">Strategic roundtable</p>
          </div>
        </Link>
        <Link to="/runs">
          <div className="group rounded-lg border border-border bg-card p-5 transition-all hover:border-muted-foreground/30">
            <History className="mb-3 h-6 w-6 text-muted-foreground" />
            <h3 className="font-semibold text-foreground">Run History</h3>
            <p className="mt-1 text-sm text-muted-foreground">{recentRuns.length} recent runs</p>
          </div>
        </Link>
        <Link to="/models">
          <div className="group rounded-lg border border-border bg-card p-5 transition-all hover:border-muted-foreground/30">
            <Database className="mb-3 h-6 w-6 text-muted-foreground" />
            <h3 className="font-semibold text-foreground">Model Registry</h3>
            <p className="mt-1 text-sm text-muted-foreground">{enabledModels.length} active models</p>
          </div>
        </Link>
      </div>

      {/* Model Fleet Status */}
      <div className="rounded-lg border border-border bg-card p-6">
        <h2 className="mb-4 text-lg font-semibold flex items-center gap-2">
          <Zap className="h-5 w-5 text-gold" />
          Model Fleet
        </h2>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {models.map((model) => (
            <div key={model.id} className="flex items-center gap-3 rounded-md border border-border bg-muted/30 px-4 py-3">
              {model.color_tag && (
                <span className="h-3 w-3 rounded-full shrink-0" style={{ backgroundColor: model.color_tag }} />
              )}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{model.display_name}</p>
                <p className="text-xs text-muted-foreground">{(model as any).model_providers?.display_name}</p>
              </div>
              <span className={`text-xs font-medium ${model.enabled ? "text-success" : "text-muted-foreground"}`}>
                {model.enabled ? "Active" : "Off"}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="rounded-lg border border-border bg-card p-6">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold">Recent Runs</h2>
            <Link to="/console"><Button size="sm" variant="outline" className="gap-1"><Plus className="h-3 w-3" /> New Run</Button></Link>
          </div>
          {recentRuns.length === 0 ? (
            <p className="text-sm text-muted-foreground py-8 text-center">No runs yet. Create your first ensemble run.</p>
          ) : (
            <div className="space-y-3">
              {recentRuns.map((run) => (
                <Link key={run.id} to={`/runs/${run.id}`} className="block">
                  <div className="flex items-center justify-between rounded-md border border-border bg-muted/20 px-4 py-3 hover:bg-muted/40 transition-colors">
                    <div>
                      <p className="text-sm font-medium">{run.title}</p>
                      <p className="text-xs text-muted-foreground">{new Date(run.created_at).toLocaleDateString()}</p>
                    </div>
                    <StatusBadge status={run.status} />
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>

        <div className="rounded-lg border border-border bg-card p-6">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold">Recent Meetings</h2>
            <Link to="/boardroom"><Button size="sm" variant="outline" className="gap-1"><Plus className="h-3 w-3" /> New Meeting</Button></Link>
          </div>
          {recentMeetings.length === 0 ? (
            <p className="text-sm text-muted-foreground py-8 text-center">No meetings yet. Convene the boardroom.</p>
          ) : (
            <div className="space-y-3">
              {recentMeetings.map((meeting) => (
                <Link key={meeting.id} to={`/meetings/${meeting.id}`} className="block">
                  <div className="flex items-center justify-between rounded-md border border-border bg-muted/20 px-4 py-3 hover:bg-muted/40 transition-colors">
                    <div>
                      <p className="text-sm font-medium">{meeting.title}</p>
                      <p className="text-xs text-muted-foreground">{meeting.topic}</p>
                    </div>
                    <StatusBadge status={meeting.status} />
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
