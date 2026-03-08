
-- =============================================
-- POLITBURO CONSOLE - FULL DATABASE SCHEMA
-- =============================================

-- 1. Roles enum
CREATE TYPE public.app_role AS ENUM ('founder', 'superadmin', 'analyst', 'viewer');

-- 2. User roles table
CREATE TABLE public.user_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    role app_role NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (user_id, role)
);
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Security definer function for role checks
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role)
$$;

CREATE OR REPLACE FUNCTION public.has_admin_role(_user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role IN ('founder', 'superadmin'))
$$;

-- Policies for user_roles
CREATE POLICY "Users can view own roles" ON public.user_roles FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Admins can view all roles" ON public.user_roles FOR SELECT TO authenticated USING (public.has_admin_role(auth.uid()));
CREATE POLICY "Admins can manage roles" ON public.user_roles FOR ALL TO authenticated USING (public.has_admin_role(auth.uid()));

-- 3. Profiles table
CREATE TABLE public.profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
    display_name TEXT,
    avatar_url TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Profiles viewable by authenticated" ON public.profiles FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, display_name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'display_name', NEW.email));
  -- First user gets founder role
  IF (SELECT COUNT(*) FROM public.user_roles) = 0 THEN
    INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'founder');
  ELSE
    INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'viewer');
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 4. Updated_at trigger function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public
AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$;

-- 5. Model Providers
CREATE TABLE public.model_providers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    provider_key TEXT NOT NULL UNIQUE,
    display_name TEXT NOT NULL,
    enabled BOOLEAN NOT NULL DEFAULT true,
    api_base_url TEXT,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.model_providers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated can view providers" ON public.model_providers FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins can manage providers" ON public.model_providers FOR ALL TO authenticated USING (public.has_admin_role(auth.uid()));
CREATE TRIGGER update_model_providers_updated_at BEFORE UPDATE ON public.model_providers FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 6. Models
CREATE TABLE public.models (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    provider_id UUID REFERENCES public.model_providers(id) ON DELETE CASCADE NOT NULL,
    model_key TEXT NOT NULL UNIQUE,
    display_name TEXT NOT NULL,
    api_model_name TEXT NOT NULL,
    enabled BOOLEAN NOT NULL DEFAULT true,
    sort_order INT NOT NULL DEFAULT 0,
    temperature_default NUMERIC(3,2) DEFAULT 0.7,
    max_tokens_default INT DEFAULT 4096,
    role_preset TEXT,
    seat_type TEXT,
    color_tag TEXT,
    icon_name TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.models ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated can view models" ON public.models FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins can manage models" ON public.models FOR ALL TO authenticated USING (public.has_admin_role(auth.uid()));
CREATE TRIGGER update_models_updated_at BEFORE UPDATE ON public.models FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 7. Prompt Templates
CREATE TABLE public.prompt_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    template_type TEXT NOT NULL DEFAULT 'system',
    content TEXT NOT NULL,
    enabled BOOLEAN NOT NULL DEFAULT true,
    version INT NOT NULL DEFAULT 1,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.prompt_templates ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated can view templates" ON public.prompt_templates FOR SELECT TO authenticated USING (true);
CREATE POLICY "Non-viewers can manage templates" ON public.prompt_templates FOR ALL TO authenticated
  USING (public.has_admin_role(auth.uid()) OR public.has_role(auth.uid(), 'analyst'));
CREATE TRIGGER update_prompt_templates_updated_at BEFORE UPDATE ON public.prompt_templates FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 8. Runs
CREATE TABLE public.runs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    description TEXT,
    mode TEXT NOT NULL DEFAULT 'console' CHECK (mode IN ('console', 'boardroom')),
    status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'running', 'completed', 'failed')),
    system_prompt TEXT,
    task_prompt TEXT,
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.runs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own runs" ON public.runs FOR SELECT TO authenticated USING (created_by = auth.uid() OR public.has_admin_role(auth.uid()));
CREATE POLICY "Non-viewers can create runs" ON public.runs FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = created_by AND (public.has_admin_role(auth.uid()) OR public.has_role(auth.uid(), 'analyst')));
CREATE POLICY "Non-viewers can update own runs" ON public.runs FOR UPDATE TO authenticated
  USING (created_by = auth.uid() AND (public.has_admin_role(auth.uid()) OR public.has_role(auth.uid(), 'analyst')));
CREATE TRIGGER update_runs_updated_at BEFORE UPDATE ON public.runs FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 9. Run Participants
CREATE TABLE public.run_participants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    run_id UUID REFERENCES public.runs(id) ON DELETE CASCADE NOT NULL,
    model_id UUID REFERENCES public.models(id) ON DELETE CASCADE NOT NULL,
    role_in_run TEXT NOT NULL DEFAULT 'advisor',
    seat_order INT NOT NULL DEFAULT 0,
    enabled BOOLEAN NOT NULL DEFAULT true
);
ALTER TABLE public.run_participants ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view run participants" ON public.run_participants FOR SELECT TO authenticated USING (
  EXISTS (SELECT 1 FROM public.runs WHERE runs.id = run_id AND (runs.created_by = auth.uid() OR public.has_admin_role(auth.uid())))
);
CREATE POLICY "Non-viewers can manage participants" ON public.run_participants FOR ALL TO authenticated USING (
  EXISTS (SELECT 1 FROM public.runs WHERE runs.id = run_id AND runs.created_by = auth.uid() AND (public.has_admin_role(auth.uid()) OR public.has_role(auth.uid(), 'analyst')))
);

-- 10. Steps
CREATE TABLE public.steps (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    run_id UUID REFERENCES public.runs(id) ON DELETE CASCADE NOT NULL,
    model_id UUID REFERENCES public.models(id) ON DELETE SET NULL,
    step_type TEXT NOT NULL DEFAULT 'advisor_response',
    provider TEXT,
    model_name TEXT,
    input_text TEXT,
    output_text TEXT,
    raw_payload_json JSONB,
    latency_ms INT,
    token_usage_json JSONB,
    error_message TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.steps ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view steps" ON public.steps FOR SELECT TO authenticated USING (
  EXISTS (SELECT 1 FROM public.runs WHERE runs.id = run_id AND (runs.created_by = auth.uid() OR public.has_admin_role(auth.uid())))
);
CREATE POLICY "System can insert steps" ON public.steps FOR INSERT TO authenticated WITH CHECK (
  EXISTS (SELECT 1 FROM public.runs WHERE runs.id = run_id AND (runs.created_by = auth.uid() OR public.has_admin_role(auth.uid())))
);

-- 11. Meetings
CREATE TABLE public.meetings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    topic TEXT,
    status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'completed')),
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.meetings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own meetings" ON public.meetings FOR SELECT TO authenticated USING (created_by = auth.uid() OR public.has_admin_role(auth.uid()));
CREATE POLICY "Non-viewers can create meetings" ON public.meetings FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = created_by AND (public.has_admin_role(auth.uid()) OR public.has_role(auth.uid(), 'analyst')));
CREATE POLICY "Non-viewers can update own meetings" ON public.meetings FOR UPDATE TO authenticated
  USING (created_by = auth.uid() AND (public.has_admin_role(auth.uid()) OR public.has_role(auth.uid(), 'analyst')));
CREATE TRIGGER update_meetings_updated_at BEFORE UPDATE ON public.meetings FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 12. Turns
CREATE TABLE public.turns (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    meeting_id UUID REFERENCES public.meetings(id) ON DELETE CASCADE NOT NULL,
    turn_number INT NOT NULL DEFAULT 1,
    agenda_text TEXT,
    moderator_prompt TEXT,
    summary_text TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.turns ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view turns" ON public.turns FOR SELECT TO authenticated USING (
  EXISTS (SELECT 1 FROM public.meetings WHERE meetings.id = meeting_id AND (meetings.created_by = auth.uid() OR public.has_admin_role(auth.uid())))
);
CREATE POLICY "Non-viewers can manage turns" ON public.turns FOR ALL TO authenticated USING (
  EXISTS (SELECT 1 FROM public.meetings WHERE meetings.id = meeting_id AND meetings.created_by = auth.uid())
);

-- 13. Utterances
CREATE TABLE public.utterances (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    meeting_id UUID REFERENCES public.meetings(id) ON DELETE CASCADE NOT NULL,
    turn_id UUID REFERENCES public.turns(id) ON DELETE CASCADE,
    model_id UUID REFERENCES public.models(id) ON DELETE SET NULL,
    speaker_type TEXT NOT NULL DEFAULT 'model' CHECK (speaker_type IN ('user', 'moderator', 'model', 'system')),
    speaker_name TEXT NOT NULL,
    reply_to_utterance_id UUID REFERENCES public.utterances(id) ON DELETE SET NULL,
    utterance_text TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.utterances ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view utterances" ON public.utterances FOR SELECT TO authenticated USING (
  EXISTS (SELECT 1 FROM public.meetings WHERE meetings.id = meeting_id AND (meetings.created_by = auth.uid() OR public.has_admin_role(auth.uid())))
);
CREATE POLICY "Non-viewers can insert utterances" ON public.utterances FOR INSERT TO authenticated WITH CHECK (
  EXISTS (SELECT 1 FROM public.meetings WHERE meetings.id = meeting_id AND meetings.created_by = auth.uid())
);

-- 14. App Settings
CREATE TABLE public.app_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    setting_key TEXT NOT NULL UNIQUE,
    setting_value_json JSONB NOT NULL DEFAULT '{}',
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.app_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated can view settings" ON public.app_settings FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins can manage settings" ON public.app_settings FOR ALL TO authenticated USING (public.has_admin_role(auth.uid()));
CREATE TRIGGER update_app_settings_updated_at BEFORE UPDATE ON public.app_settings FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 15. Audit Logs
CREATE TABLE public.audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    actor_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    actor_role TEXT,
    action TEXT NOT NULL,
    entity_type TEXT,
    entity_id TEXT,
    payload_summary JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins can view audit logs" ON public.audit_logs FOR SELECT TO authenticated USING (public.has_admin_role(auth.uid()));
CREATE POLICY "System can insert audit logs" ON public.audit_logs FOR INSERT TO authenticated WITH CHECK (true);

-- 16. Seed default app settings
INSERT INTO public.app_settings (setting_key, setting_value_json) VALUES
  ('demo_mode', '"enabled"'),
  ('default_coordinator_model', '"chatgpt-4o"'),
  ('app_name', '"Politburo Console"');

-- 17. Seed model providers
INSERT INTO public.model_providers (provider_key, display_name, enabled, api_base_url) VALUES
  ('openai', 'OpenAI', true, 'https://api.openai.com/v1'),
  ('deepseek', 'DeepSeek', true, 'https://api.deepseek.com/v1'),
  ('mistral', 'Mistral AI', true, 'https://api.mistral.ai/v1'),
  ('cohere', 'Cohere', true, 'https://api.cohere.ai/v2'),
  ('kimi', 'Moonshot (Kimi)', true, 'https://api.moonshot.cn/v1'),
  ('anthropic', 'Anthropic', true, 'https://api.anthropic.com/v1'),
  ('google', 'Google AI', true, 'https://generativelanguage.googleapis.com/v1beta'),
  ('xai', 'xAI', true, 'https://api.x.ai/v1');

-- 18. Seed models
INSERT INTO public.models (provider_id, model_key, display_name, api_model_name, sort_order, seat_type, color_tag) VALUES
  ((SELECT id FROM public.model_providers WHERE provider_key = 'openai'), 'chatgpt-4o', 'ChatGPT-4o', 'gpt-4o', 1, 'advisor', '#10a37f'),
  ((SELECT id FROM public.model_providers WHERE provider_key = 'deepseek'), 'deepseek-chat', 'DeepSeek Chat', 'deepseek-chat', 2, 'advisor', '#4d6bfe'),
  ((SELECT id FROM public.model_providers WHERE provider_key = 'mistral'), 'mistral-large', 'Mistral Large', 'mistral-large-latest', 3, 'specialist', '#ff7000'),
  ((SELECT id FROM public.model_providers WHERE provider_key = 'cohere'), 'aya-expanse-32b', 'Aya Expanse 32B', 'aya-expanse-32b', 4, 'specialist', '#39594d'),
  ((SELECT id FROM public.model_providers WHERE provider_key = 'kimi'), 'kimi-2-5', 'Kimi 2.5', 'moonshot-v1-128k', 5, 'advisor', '#6c5ce7');

-- 19. Seed prompt templates
INSERT INTO public.prompt_templates (name, template_type, content) VALUES
  ('Default System Prompt', 'system', 'You are a senior AI advisor participating in a multi-model ensemble analysis. Provide clear, structured, and actionable analysis. Be precise and substantive. Avoid filler. State your confidence level when relevant.'),
  ('Default Coordinator Prompt', 'coordinator', 'You are the Coordinator. You have received responses from multiple AI advisors on the same task. Your job is to:
1. Identify areas of consensus
2. Highlight key disagreements or divergent perspectives
3. Synthesize a consolidated recommendation
4. Note any critical gaps or risks identified by any advisor
5. Provide a final structured decision with confidence assessment

Advisor responses are provided below. Synthesize them into a single coherent decision document.'),
  ('Default Boardroom Moderator', 'boardroom_moderator', 'You are the Boardroom Moderator chairing this strategic discussion. Your role is to:
1. Summarize the key points raised by each participant
2. Identify the strongest arguments and most critical concerns
3. Highlight areas of agreement and disagreement
4. Provide a structured summary of the discussion round
5. Recommend focus areas for the next round if applicable

Maintain a neutral, analytical tone. Be thorough but concise.');
