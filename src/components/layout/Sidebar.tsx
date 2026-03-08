import { Link, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  Terminal,
  Users,
  History,
  MessageSquare,
  Database,
  FileText,
  Key,
  Settings,
  ChevronLeft,
  ChevronRight,
  Shield,
} from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { path: "/", icon: LayoutDashboard, label: "Dashboard" },
  { path: "/console", icon: Terminal, label: "Console" },
  { path: "/boardroom", icon: Users, label: "Boardroom" },
  { path: "/runs", icon: History, label: "Run History" },
  { path: "/meetings", icon: MessageSquare, label: "Meetings" },
  { divider: true },
  { path: "/models", icon: Database, label: "Model Registry" },
  { path: "/prompts", icon: FileText, label: "Prompt Library" },
  { path: "/integrations", icon: Key, label: "Integrations" },
  { path: "/settings", icon: Settings, label: "Settings" },
];

interface SidebarProps {
  collapsed: boolean;
  onToggle: () => void;
}

export function Sidebar({ collapsed, onToggle }: SidebarProps) {
  const location = useLocation();

  return (
    <aside
      className={cn(
        "flex flex-col border-r border-border bg-sidebar transition-all duration-300",
        collapsed ? "w-16" : "w-60"
      )}
    >
      <div className="flex h-14 items-center border-b border-border px-4">
        {!collapsed && (
          <div className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-gold" />
            <span className="text-sm font-bold tracking-widest text-gold uppercase">Politburo</span>
          </div>
        )}
        {collapsed && <Shield className="mx-auto h-5 w-5 text-gold" />}
      </div>

      <nav className="flex-1 space-y-1 p-2 overflow-y-auto">
        {navItems.map((item, i) => {
          if ('divider' in item) {
            return <div key={i} className="my-2 border-t border-border" />;
          }
          const Icon = item.icon;
          const isActive = location.pathname === item.path;
          return (
            <Link
              key={item.path}
              to={item.path}
              className={cn(
                "flex items-center gap-3 rounded-md px-3 py-2.5 text-sm transition-colors",
                isActive
                  ? "bg-accent text-gold"
                  : "text-sidebar-foreground hover:bg-accent hover:text-accent-foreground"
              )}
            >
              <Icon className="h-4 w-4 shrink-0" />
              {!collapsed && <span>{item.label}</span>}
            </Link>
          );
        })}
      </nav>

      <button
        onClick={onToggle}
        className="flex items-center justify-center border-t border-border p-3 text-muted-foreground hover:text-foreground transition-colors"
      >
        {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
      </button>
    </aside>
  );
}
