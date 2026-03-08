import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "@/hooks/useAuth";
import { DemoModeProvider } from "@/hooks/useDemoMode";
import { AppLayout } from "@/components/layout/AppLayout";
import Auth from "@/pages/Auth";
import ResetPassword from "@/pages/ResetPassword";
import Dashboard from "@/pages/Dashboard";
import ConsolePage from "@/pages/ConsolePage";
import BoardroomPage from "@/pages/BoardroomPage";
import RunsPage from "@/pages/RunsPage";
import RunDetailPage from "@/pages/RunDetailPage";
import MeetingsPage from "@/pages/MeetingsPage";
import MeetingDetailPage from "@/pages/MeetingDetailPage";
import ModelsPage from "@/pages/ModelsPage";
import PromptsPage from "@/pages/PromptsPage";
import IntegrationsPage from "@/pages/IntegrationsPage";
import SettingsPage from "@/pages/SettingsPage";
import NotFound from "@/pages/NotFound";

const queryClient = new QueryClient();

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="flex min-h-screen items-center justify-center bg-background"><span className="text-muted-foreground animate-thinking">Initializing...</span></div>;
  if (!user) return <Navigate to="/auth" replace />;
  return <>{children}</>;
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <DemoModeProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Routes>
              <Route path="/auth" element={<Auth />} />
              <Route path="/reset-password" element={<ResetPassword />} />
              <Route path="/" element={<ProtectedRoute><AppLayout /></ProtectedRoute>}>
                <Route index element={<Dashboard />} />
                <Route path="console" element={<ConsolePage />} />
                <Route path="boardroom" element={<BoardroomPage />} />
                <Route path="runs" element={<RunsPage />} />
                <Route path="runs/:id" element={<RunDetailPage />} />
                <Route path="meetings" element={<MeetingsPage />} />
                <Route path="meetings/:id" element={<MeetingDetailPage />} />
                <Route path="models" element={<ModelsPage />} />
                <Route path="prompts" element={<PromptsPage />} />
                <Route path="integrations" element={<IntegrationsPage />} />
                <Route path="settings" element={<SettingsPage />} />
              </Route>
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </DemoModeProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
