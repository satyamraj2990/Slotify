import { motion as m } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useAuth } from "@/context/auth";
import Particles from "@/components/background/Particles";

const roles = [
  { key: "admin", title: "Admin", desc: "Manage data, generate AI timetables, approve leaves" },
  { key: "teacher", title: "Teacher", desc: "View schedule, request leave, swap lectures" },
  { key: "student", title: "Student", desc: "My timetable, vacant rooms, library seats" },
];

export default function Login() {
  const nav = useNavigate();
  const { login, signUp, loading } = useAuth();
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [role, setRole] = useState<"admin" | "teacher" | "student">("student");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [department, setDepartment] = useState("");
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async () => {
    setError(null);
    
    if (mode === "login") {
      const res = await login(email, password);
      if (!res.ok) return setError(res.error || "Login failed");
      nav("/app", { replace: true });
      setTimeout(() => (window.location.hash = role), 0);
    } else {
      if (!firstName || !lastName) {
        return setError("First name and last name are required");
      }
      const res = await signUp(email, password, { first_name: firstName, last_name: lastName, role, department });
      if (!res.ok) return setError(res.error || "Sign up failed");
      setError(null);
      alert("Check your email for verification link!");
      setMode("login");
    }
  };

  return (
    <div className="relative min-h-[calc(100svh-64px)] overflow-hidden">
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute -top-24 -left-24 size-72 rounded-full bg-pink-500/20 blur-3xl animate-float" />
        <div className="absolute -bottom-16 -right-24 size-80 rounded-full bg-fuchsia-500/20 blur-3xl animate-float" style={{ animationDelay: "1.2s" }} />
      </div>
      <div className="mx-auto grid max-w-6xl gap-8 px-4 py-12 md:grid-cols-2 items-center">
        <div>
          <img src="/logo-slotify.svg" alt="Slotiफाई logo" className="h-10 w-auto mb-3 drop-shadow-[0_0_12px_rgba(0,229,255,0.35)]" />
          <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-[#0a2a66] via-[#1549a5] to-[#00e5ff]">Welcome to Slotiफाई</h1>
          <p className="text-muted-foreground mt-1">Select your role and sign in</p>
          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            {roles.map((r, i) => (
              <m.button
                type="button"
                key={r.key}
                onClick={() => setRole(r.key as any)}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className={`group rounded-2xl border p-5 text-left backdrop-blur-xl ${role===r.key?"border-pink-500/60 shadow-[0_0_40px_rgba(255,20,147,0.5)]":"border-white/10 bg-card/40 hover:border-pink-500/40 hover:shadow-[0_0_30px_rgba(255,20,147,0.35)]"}`}
              >
                <div className="text-2xl font-bold mb-1 group-hover:text-pink-400 transition-colors">{r.title}</div>
                <div className="text-sm text-muted-foreground">{r.desc}</div>
              </m.button>
            ))}
          </div>
        </div>
        <div className="rounded-2xl border border-white/10 bg-card/40 backdrop-blur-xl p-6 shadow-[0_0_40px_rgba(255,20,147,0.12)]">
          <div className="flex items-center justify-between mb-4">
            <div className="text-lg font-semibold">{mode === "login" ? "Login" : "Sign Up"}</div>
            <button 
              onClick={() => setMode(mode === "login" ? "signup" : "login")}
              className="text-pink-400 text-sm hover:underline"
            >
              {mode === "login" ? "Create account" : "Back to login"}
            </button>
          </div>
          <div className="space-y-3">
            {mode === "signup" && (
              <>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-sm">First Name</label>
                    <Input value={firstName} onChange={(e)=>setFirstName(e.target.value)} placeholder="John" className="mt-1" />
                  </div>
                  <div>
                    <label className="text-sm">Last Name</label>
                    <Input value={lastName} onChange={(e)=>setLastName(e.target.value)} placeholder="Doe" className="mt-1" />
                  </div>
                </div>
                {role !== "student" && (
                  <div>
                    <label className="text-sm">Department</label>
                    <Input value={department} onChange={(e)=>setDepartment(e.target.value)} placeholder="Computer Science" className="mt-1" />
                  </div>
                )}
              </>
            )}
            <div>
              <label className="text-sm">Email</label>
              <Input type="email" value={email} onChange={(e)=>setEmail(e.target.value)} placeholder="you@college.edu" className="mt-1" />
            </div>
            <div>
              <label className="text-sm">Password</label>
              <Input type="password" value={password} onChange={(e)=>setPassword(e.target.value)} placeholder="••••••••" className="mt-1" />
            </div>
            {mode === "login" && (
              <div className="flex items-center justify-between">
                <div></div>
                <Dialog>
                  <DialogTrigger asChild>
                    <button className="text-pink-400 text-sm hover:underline">Forgot password?</button>
                  </DialogTrigger>
                  <DialogContent className="border-white/10 bg-background/80 backdrop-blur-xl">
                    <DialogHeader>
                      <DialogTitle>Reset Password</DialogTitle>
                      <DialogDescription>Enter your email to receive reset instructions.</DialogDescription>
                    </DialogHeader>
                    <Input type="email" placeholder="you@college.edu" />
                    <DialogFooter>
                      <Button className="bg-gradient-to-r from-primary to-accent">Send Reset Link</Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>
            )}
            {error && <div className="text-sm text-red-400">{error}</div>}
            <Button 
              onClick={handleSubmit} 
              disabled={loading}
              className="w-full bg-gradient-to-r from-primary to-accent"
            >
              {loading ? "Processing..." : mode === "login" ? `Sign in as ${role}` : `Create ${role} account`}
            </Button>
            {mode === "login" && (
              <div className="text-xs text-muted-foreground">
                Demo accounts - Use your email/password or create new account
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
