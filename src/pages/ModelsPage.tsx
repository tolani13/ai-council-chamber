import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Database, Plus, Save } from "lucide-react";
import { toast } from "sonner";
import type { Model, ModelProvider } from "@/lib/types";

export default function ModelsPage() {
  const { isAdmin } = useAuth();
  const [models, setModels] = useState<Model[]>([]);
  const [providers, setProviders] = useState<ModelProvider[]>([]);
  const [editingModel, setEditingModel] = useState<Model | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  const loadData = () => {
    supabase.from("models").select("*, model_providers(*)").order("sort_order").then(({ data }) => data && setModels(data as Model[]));
    supabase.from("model_providers").select("*").order("display_name").then(({ data }) => data && setProviders(data));
  };

  useEffect(() => { loadData(); }, []);

  const toggleModel = async (id: string, enabled: boolean) => {
    await supabase.from("models").update({ enabled }).eq("id", id);
    loadData();
  };

  const saveModel = async (model: Partial<Model> & { id?: string }) => {
    if (model.id) {
      const { error } = await supabase.from("models").update({
        display_name: model.display_name,
        api_model_name: model.api_model_name,
        temperature_default: model.temperature_default,
        max_tokens_default: model.max_tokens_default,
        seat_type: model.seat_type,
        color_tag: model.color_tag,
        sort_order: model.sort_order,
      }).eq("id", model.id);
      if (error) { toast.error(error.message); return; }
    } else {
      const { error } = await supabase.from("models").insert({
        provider_id: model.provider_id!,
        model_key: model.model_key!,
        display_name: model.display_name!,
        api_model_name: model.api_model_name!,
        temperature_default: model.temperature_default ?? 0.7,
        max_tokens_default: model.max_tokens_default ?? 4096,
        seat_type: model.seat_type,
        color_tag: model.color_tag,
        sort_order: model.sort_order ?? 99,
      });
      if (error) { toast.error(error.message); return; }
    }
    toast.success("Model saved");
    setDialogOpen(false);
    setEditingModel(null);
    loadData();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
            <Database className="h-8 w-8 text-gold" />
            Model Registry
          </h1>
          <p className="mt-1 text-muted-foreground">Manage AI models and providers</p>
        </div>
        {isAdmin && (
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => setEditingModel(null)} className="gap-2"><Plus className="h-4 w-4" /> Add Model</Button>
            </DialogTrigger>
            <DialogContent className="bg-card border-border">
              <DialogHeader><DialogTitle>{editingModel ? "Edit Model" : "Add Model"}</DialogTitle></DialogHeader>
              <ModelForm model={editingModel} providers={providers} onSave={saveModel} />
            </DialogContent>
          </Dialog>
        )}
      </div>

      {/* Providers */}
      <div className="rounded-lg border border-border bg-card p-5">
        <h2 className="mb-4 text-lg font-semibold">Providers</h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {providers.map((p) => (
            <div key={p.id} className="flex items-center justify-between rounded-md border border-border bg-muted/30 px-4 py-3">
              <span className="text-sm font-medium">{p.display_name}</span>
              <span className={`text-xs ${p.enabled ? "text-success" : "text-muted-foreground"}`}>{p.enabled ? "On" : "Off"}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Models Table */}
      <div className="rounded-lg border border-border bg-card overflow-hidden">
        <div className="grid grid-cols-[auto_1fr_1fr_auto_auto_auto] gap-4 border-b border-border bg-muted/30 px-5 py-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          <span>Status</span><span>Model</span><span>Provider / API Name</span><span>Seat</span><span>Temp</span><span>Actions</span>
        </div>
        {models.map((model) => (
          <div key={model.id} className="grid grid-cols-[auto_1fr_1fr_auto_auto_auto] gap-4 items-center border-b border-border px-5 py-3 last:border-0">
            <Switch checked={model.enabled} onCheckedChange={(v) => toggleModel(model.id, v)} disabled={!isAdmin} />
            <div className="flex items-center gap-2">
              {model.color_tag && <span className="h-3 w-3 rounded-full" style={{ backgroundColor: model.color_tag }} />}
              <div>
                <p className="text-sm font-medium">{model.display_name}</p>
                <p className="text-xs text-muted-foreground font-mono">{model.model_key}</p>
              </div>
            </div>
            <div>
              <p className="text-sm">{(model as any).model_providers?.display_name}</p>
              <p className="text-xs text-muted-foreground font-mono">{model.api_model_name}</p>
            </div>
            <span className="text-xs text-muted-foreground capitalize">{model.seat_type || "—"}</span>
            <span className="text-xs font-mono text-muted-foreground">{model.temperature_default}</span>
            {isAdmin && (
              <Button variant="ghost" size="sm" onClick={() => { setEditingModel(model); setDialogOpen(true); }}>Edit</Button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

function ModelForm({ model, providers, onSave }: { model: Model | null; providers: ModelProvider[]; onSave: (m: any) => void }) {
  const [form, setForm] = useState({
    display_name: model?.display_name || "",
    model_key: model?.model_key || "",
    api_model_name: model?.api_model_name || "",
    provider_id: model?.provider_id || "",
    temperature_default: model?.temperature_default ?? 0.7,
    max_tokens_default: model?.max_tokens_default ?? 4096,
    seat_type: model?.seat_type || "advisor",
    color_tag: model?.color_tag || "#888888",
    sort_order: model?.sort_order ?? 99,
  });

  return (
    <div className="space-y-4">
      <div>
        <Label className="text-xs">Display Name</Label>
        <Input value={form.display_name} onChange={(e) => setForm({ ...form, display_name: e.target.value })} className="mt-1 bg-muted border-border" />
      </div>
      {!model && (
        <>
          <div>
            <Label className="text-xs">Model Key (unique)</Label>
            <Input value={form.model_key} onChange={(e) => setForm({ ...form, model_key: e.target.value })} className="mt-1 bg-muted border-border" />
          </div>
          <div>
            <Label className="text-xs">Provider</Label>
            <Select value={form.provider_id} onValueChange={(v) => setForm({ ...form, provider_id: v })}>
              <SelectTrigger className="mt-1 bg-muted border-border"><SelectValue /></SelectTrigger>
              <SelectContent>{providers.map((p) => <SelectItem key={p.id} value={p.id}>{p.display_name}</SelectItem>)}</SelectContent>
            </Select>
          </div>
        </>
      )}
      <div>
        <Label className="text-xs">API Model Name</Label>
        <Input value={form.api_model_name} onChange={(e) => setForm({ ...form, api_model_name: e.target.value })} className="mt-1 bg-muted border-border" />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label className="text-xs">Temperature</Label>
          <Input type="number" step={0.1} min={0} max={2} value={form.temperature_default} onChange={(e) => setForm({ ...form, temperature_default: parseFloat(e.target.value) })} className="mt-1 bg-muted border-border" />
        </div>
        <div>
          <Label className="text-xs">Max Tokens</Label>
          <Input type="number" value={form.max_tokens_default} onChange={(e) => setForm({ ...form, max_tokens_default: parseInt(e.target.value) })} className="mt-1 bg-muted border-border" />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label className="text-xs">Seat Type</Label>
          <Select value={form.seat_type} onValueChange={(v) => setForm({ ...form, seat_type: v })}>
            <SelectTrigger className="mt-1 bg-muted border-border"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="advisor">Advisor</SelectItem>
              <SelectItem value="specialist">Specialist</SelectItem>
              <SelectItem value="moderator">Moderator</SelectItem>
              <SelectItem value="coordinator">Coordinator</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label className="text-xs">Color Tag</Label>
          <Input type="color" value={form.color_tag || "#888"} onChange={(e) => setForm({ ...form, color_tag: e.target.value })} className="mt-1 h-9 bg-muted border-border" />
        </div>
      </div>
      <Button onClick={() => onSave({ ...form, id: model?.id })} className="w-full gap-2"><Save className="h-4 w-4" /> Save</Button>
    </div>
  );
}
