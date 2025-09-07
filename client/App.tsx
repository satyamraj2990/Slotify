import "./global.css";

import { Toaster } from "@/components/ui/toaster";
import { createRoot } from "react-dom/client";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Link, Navigate, useLocation } from "react-router-dom";
import Index from "./pages/Index";
import Landing from "./pages/Landing";
import Login from "./pages/Login";
import NotFound from "./pages/NotFound";
import {
  SidebarProvider,
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarInset,
  SidebarSeparator,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { Moon, Sun, CalendarClock, LayoutGrid, Users2, BookOpenCheck } from "lucide-react";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { AuthProvider, useAuth } from "@/context/auth";
import Particles from "@/components/background/Particles";
import ChatAssistant from "@/components/common/ChatAssistant";

const queryClient = new QueryClient();

function useDarkMode() {
  const [enabled, setEnabled] = useState<boolean>(() => {
    if (typeof window === "undefined") return false;
    const stored = localStorage.getItem("theme");
    if (stored) return stored === "dark";
    return window.matchMedia("(prefers-color-scheme: dark)").matches;
  });
  useEffect(() => {
    const root = document.documentElement;
    root.classList.toggle("dark", enabled);
    localStorage.setItem("theme", enabled ? "dark" : "light");
  }, [enabled]);
  return { enabled, setEnabled };
}

const AppShell = ({ children }: { children: React.ReactNode }) => {
  const { enabled, setEnabled } = useDarkMode();
  const loc = useLocation();
  const showChat = loc.pathname.startsWith("/app");
  return (
    <SidebarProvider>
      <Sidebar collapsible="icon">
        <SidebarHeader>
          <div className="flex items-center gap-2 px-2 py-1.5">
            <img
              src="/logo-slotify.svg"
              alt="Slotiफाई logo"
              className="h-8 w-8 rounded-md object-contain ring-1 ring-white/10 bg-white/5 p-0.5 shadow-[0_0_16px_rgba(236,72,153,0.35)]"
            />
            <div className="font-extrabold tracking-tight">Slotiफाई</div>
          </div>
        </SidebarHeader>
        <SidebarContent>
          <SidebarGroup>
            <SidebarGroupLabel>Dashboards</SidebarGroupLabel>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton asChild>
                  <a href="#admin" className="flex items-center gap-2">
                    <CalendarClock /> <span>Admin</span>
                  </a>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton asChild>
                  <a href="#teacher" className="flex items-center gap-2">
                    <Users2 /> <span>Teacher</span>
                  </a>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton asChild>
                  <a href="#student" className="flex items-center gap-2">
                    <BookOpenCheck /> <span>Student</span>
                  </a>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroup>
        </SidebarContent>
        <SidebarSeparator />
        <SidebarFooter>
          <div className="flex items-center justify-between px-2">
            <span className="text-xs text-muted-foreground">Theme</span>
            <Button
              variant="ghost"
              size="icon"
              className="rounded-full"
              onClick={() => setEnabled(!enabled)}
              aria-label="Toggle dark mode"
            >
              {enabled ? <Sun className="text-yellow-400" /> : <Moon />}
            </Button>
          </div>
        </SidebarFooter>
      </Sidebar>
      <SidebarInset>
        <Particles />
        <div className="absolute inset-0 -z-10 overflow-hidden"><div className="pointer-events-none absolute inset-0"><div className="absolute -top-24 -left-24 size-80 rounded-full bg-pink-500/15 blur-3xl animate-float" /><div className="absolute top-1/3 -right-24 size-72 rounded-full bg-fuchsia-500/15 blur-3xl animate-float" style={{ animationDelay: "1s" }} /></div></div>
        <div className="sticky top-0 z-20 border-b bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <div className={cn("flex items-center gap-2 px-4 py-3")}>
            <SidebarTrigger />
            <div className="font-bold">Slotiफाई</div>
            <div className="ml-auto flex items-center gap-2">
              <select className="h-8 rounded-md bg-secondary px-2 text-xs">
                <option>EN</option>
                <option>HI</option>
              </select>
              <Button asChild variant="outline" size="sm">
                <a href="#export">Export</a>
              </Button>
              <Button asChild size="sm" className="bg-gradient-to-r from-primary to-accent">
                <a href="#generate">Generate with AI</a>
              </Button>
              <TopbarUser />
            </div>
          </div>
        </div>
        <div className="container py-6">{children}</div>
        {showChat && <ChatAssistant />}
      </SidebarInset>
    </SidebarProvider>
  );
};

function TopbarUser() {
  const { user, profile, logout } = useAuth();
  if (!user || !profile) return null;
  return (
    <div className="text-xs flex items-center gap-2">
      <span className="px-2 py-1 rounded-full border border-white/10 bg-secondary capitalize">
        {profile.role}
      </span>
      <span className="text-sm">{profile.display_name || `${profile.first_name} ${profile.last_name}`}</span>
      <button className="text-pink-400 hover:underline" onClick={logout}>Logout</button>
    </div>
  );
}

function Protected({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent align-[-0.125em] motion-reduce:animate-[spin_1.5s_linear_infinite]" />
          <p className="mt-2 text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }
  
  if (!user) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <AuthProvider>
        <BrowserRouter>
          <AppShell>
            <Routes>
              <Route path="/" element={<Landing />} />
              <Route path="/login" element={<Login />} />
              <Route path="/app" element={<Protected><Index /></Protected>} />
              {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </AppShell>
        </BrowserRouter>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

createRoot(document.getElementById("root")!).render(<App />);
