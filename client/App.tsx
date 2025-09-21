import "./global.css";

import React from "react";
import { Toaster } from "@/components/ui/toaster";
import { createRoot } from "react-dom/client";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate, useLocation } from "react-router-dom";
import Index from "./pages/Index";
import Landing from "./pages/Landing";
import Login from "./pages/Login";
import NotFound from "./pages/NotFound";
import { Button } from "@/components/ui/button";
import { Moon, Sun } from "lucide-react";
import { useEffect, useState } from "react";
import { AuthProvider, useAuth } from "@/context/auth";
import { NotificationProvider } from "@/context/notifications";
import Particles from "@/components/background/Particles";
import ChatAssistant from "@/components/common/ChatAssistant";
import { NotificationDropdown } from "@/components/common/NotificationSystem";

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
    <div className="min-h-screen bg-background">
      <Particles />
      <div className="absolute inset-0 -z-10 overflow-hidden">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute -top-24 -left-24 size-80 rounded-full bg-pink-500/15 blur-3xl animate-float" />
          <div className="absolute top-1/3 -right-24 size-72 rounded-full bg-fuchsia-500/15 blur-3xl animate-float" style={{ animationDelay: "1s" }} />
        </div>
      </div>
<<<<<<< HEAD
      
      {/* Right Side Navigation Bar - Show only on app pages */}
      {showChat && (
        <div className="absolute top-4 right-4 z-20">
          <div className="flex items-center gap-4 px-6 py-3 rounded-full border border-border/20 bg-background/95 backdrop-blur-md shadow-lg dark:border-white/10 dark:bg-background/80">
            <TopBarUser />
=======
      <div className="sticky top-0 z-20 border-b bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-2">
            <img
              src="/logo-slotify.svg"
              alt="Slotiफाई logo"
              className="h-8 w-8 rounded-md object-contain ring-1 ring-white/10 bg-white/5 p-0.5 shadow-[0_0_16px_rgba(236,72,153,0.35)]"
            />
            <div className="font-extrabold tracking-tight">Slotiफाई</div>
          </div>
          <div className="flex items-center gap-2">
            <Button asChild variant="outline" size="sm">
              <a href="#export">Export</a>
            </Button>
            <NotificationDropdown />
>>>>>>> origin/master
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground">Theme</span>
              <Button
                variant="ghost"
                size="icon"
                className="rounded-full h-8 w-8 hover:bg-muted"
                onClick={() => setEnabled(!enabled)}
                aria-label="Toggle dark mode"
              >
                {enabled ? <Sun className="h-4 w-4 text-yellow-400" /> : <Moon className="h-4 w-4 text-primary" />}
              </Button>
            </div>
          </div>
        </div>
      )}
      
      <div className="w-full py-6 px-6">{children}</div>
      {showChat && <ChatAssistant />}
    </div>
  );
};

function TopBarUser() {
  const { user, profile, logout } = useAuth();
  
  // If no user, don't show anything
  if (!user) return null;
  
  // Show user info and logout button
  return (
    <div className="flex items-center gap-3">
      {profile ? (
        <>
          <span className="px-2 py-1 rounded-full border border-white/10 bg-secondary/50 capitalize text-xs">
            {profile.role}
          </span>
          <span className="text-sm font-medium">{profile.display_name || `${profile.first_name} ${profile.last_name}` || user.email}</span>
        </>
      ) : (
        <span className="text-sm">{user.email}</span>
      )}
      <button 
        className="bg-pink-500 text-white px-3 py-1.5 rounded-full hover:bg-pink-600 font-medium transition-colors text-xs" 
        onClick={logout}
      >
        Logout
      </button>
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
        <NotificationProvider>
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
        </NotificationProvider>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

createRoot(document.getElementById("root")!).render(<App />);
