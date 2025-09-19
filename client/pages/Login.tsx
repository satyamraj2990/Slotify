import { motion as m } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useAuth } from "@/context/auth";
import Particles from "@/components/background/Particles";
import { AdminIcon, TeacherIcon, StudentIcon } from "@/components/ui/RoleIcons";

type Role = "admin" | "teacher" | "student";

const roles: { key: Role; title: string; desc: string; icon: React.FC }[] = [
  { key: "admin", title: "Admin", desc: "Manage data, generate AI timetables, approve leaves", icon: AdminIcon },
  { key: "teacher", title: "Teacher", desc: "View schedule, request leave, swap lectures", icon: TeacherIcon },
  { key: "student", title: "Student", desc: "My timetable, vacant rooms, library seats", icon: StudentIcon },
];

export default function Login() {
  const nav = useNavigate();
  const { login, signUp, loading } = useAuth();
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [role, setRole] = useState<Role>("student");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [department, setDepartment] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (): Promise<void> => {
    setError(null);

    if (mode === "login") {
      try {
        // Add timeout logic for login
        const timeoutPromise = new Promise((_, reject) =>
          setTimeout(() => reject(new Error("Login request timed out")), 10000)
        );
        const res = await Promise.race([login(email, password), timeoutPromise]);
        // @ts-ignore
        if (!res.ok) return setError(res.error || "Login failed");
        nav(`/app#${role}`);
      } catch (err: any) {
        setError(err?.message === "Login request timed out"
          ? "Login timed out. Please check your connection and try again."
          : "Login failed - please try again");
      }
    } else {
      if (!firstName || !lastName) {
        return setError("First name and last name are required");
      }
      const res = await signUp(email, password, {
        first_name: firstName,
        last_name: lastName,
        role,
        department,
      });
      if (!res.ok) return setError(res.error || "Sign up failed");
      alert("Check your email for verification link!");
      setMode("login");
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col items-center justify-center min-h-screen w-screen bg-gradient-to-br from-[#181c2e] via-[#2a1a3a] to-[#3a1a2a] font-sans overflow-hidden"
      style={{ fontFamily: 'Inter, Poppins, Nunito, sans-serif' }}
    >
      {/* Animated video bottom left - using nam.mp4 */}
      <div className="fixed bottom-16 left-4 -z-10 pointer-events-none group transition-all duration-300 flex items-end">
        <video
          src="/nam.mp4"
          autoPlay
          loop
          muted
          playsInline
          className="rounded-2xl border border-white/20 w-[28vw] h-[28vw] max-w-xl max-h-[38vh] shadow-xl object-contain transition-all duration-300"
          style={{ opacity: 0.98 }}
        />
      </div>
      {/* Animated video bottom right - using man.mp4 */}
      <div className="fixed bottom-16 right-4 -z-10 pointer-events-none group transition-all duration-300 flex items-end">
        <video
          src="/man.mp4"
          autoPlay
          loop
          muted
          playsInline
          className="rounded-2xl border border-white/20 w-[28vw] h-[28vw] max-w-xl max-h-[38vh] shadow-xl object-contain transition-all duration-300"
          style={{ opacity: 0.98 }}
        />
      </div>

      {/* Top-left and Top-right Images */}
      <button className="absolute top-8 right-8 rounded-2xl shadow-lg hover:scale-105 hover:shadow-[0_0_32px_8px_rgba(0,255,128,0.35)] transition-all duration-200 flex items-center justify-center w-36 h-40">
        <img src="/nep.png" alt="NEP" className="w-32 h-36 object-contain rounded-2xl" style={{ objectPosition: 'center' }} />
      </button>
      <button className="absolute top-8 left-8 rounded-2xl shadow-lg hover:scale-105 hover:shadow-[0_0_32px_8px_rgba(0,255,128,0.35)] transition-all duration-200 flex items-center justify-center w-36 h-40">
        <img src="/chd.png" alt="CHD" className="w-32 h-36 object-contain rounded-2xl" style={{ objectPosition: 'center' }} />
      </button>

      {/* Particles Background */}
      <Particles />

      {/* Background Glows */}
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute -top-32 -left-32 w-96 h-96 rounded-full bg-gradient-to-br from-pink-500/40 via-blue-500/30 to-fuchsia-500/40 blur-3xl animate-float" />
        <div className="absolute -bottom-24 -right-32 w-[28rem] h-[28rem] rounded-full bg-gradient-to-br from-cyan-400/30 via-fuchsia-400/20 to-pink-400/30 blur-3xl animate-float" style={{ animationDelay: '1.2s' }} />
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[80vw] h-[40vh] bg-gradient-to-r from-pink-500/10 via-blue-500/10 to-fuchsia-500/10 rounded-full blur-2xl" />
      </div>

      {/* Main Content Centered */}
      <div className="flex flex-col items-center justify-center text-center w-full mt-12 mb-8">
        {/* Logo + Quote */}
        <div className="flex flex-col items-center mb-4 animate-fadein-glow">
          <div className="h-20 w-20 rounded-3xl bg-gradient-to-br from-pink-400/60 via-blue-400/40 to-fuchsia-400/60 shadow-[0_0_48px_12px_rgba(255,20,147,0.25)] flex items-center justify-center border-4 border-white/20 backdrop-blur-xl mb-2 animate-glow">
            <img src="/Slotify-logo.svg" alt="Slotify" className="h-14 w-14 drop-shadow-[0_0_16px_rgba(255,20,147,0.7)]" />
          </div>
          <blockquote className="italic text-lg md:text-xl text-pink-100/90 font-serif font-semibold mt-1 mb-2 text-center drop-shadow-[0_0_8px_rgba(255,20,147,0.5)]">
            "विद्या ददाति विनयम्" <span className="text-xs text-white/60 ml-2 font-sans italic">(Knowledge gives humility)</span>
          </blockquote>
        </div>

        {/* Role Selection - evenly spaced, responsive */}
        <div className="flex flex-row justify-center items-center gap-8 w-full max-w-3xl mx-auto mb-8">
          {roles.map((r, i) => {
            const Icon = r.icon;
            return (
              <m.button
                key={r.key}
                onClick={() => setRole(r.key)}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0, scale: role === r.key ? 1.08 : 1 }}
                transition={{ delay: i * 0.07, type: 'spring', stiffness: 350 }}
                className={`group flex flex-col items-center justify-center rounded-2xl border border-[#4f5d8c]/30 bg-white/5 backdrop-blur-lg px-8 py-7 shadow-lg transition-all duration-200 font-semibold min-w-[160px] max-w-xs
                  ${role === r.key ? 'scale-105 border-2 border-[#c084fc]/60 shadow-[0_0_32px_8px_rgba(124,95,255,0.13)] z-10' : ''}`}
              >
                <span className="mb-1 text-3xl"><Icon /></span>
                <span className="text-base font-extrabold bg-gradient-to-r from-[#7c5fff] via-[#e0aaff] to-[#f472b6] bg-clip-text text-transparent">{r.title}</span>
                <span className="text-xs text-white/70 font-medium text-center mt-1">{r.desc}</span>
              </m.button>
            );
          })}
        </div>

        {/* Login / Signup Form - centered, with padding and shadow */}
        <div className="w-full flex flex-col items-center h-full justify-center">
          <section className="rounded-3xl border-2 border-white/10 bg-white/10 backdrop-blur-2xl p-10 shadow-[0_0_64px_rgba(0,229,255,0.10)] flex flex-col gap-6 w-full max-w-xl mx-auto">
            <form className="space-y-4" onSubmit={e => { e.preventDefault(); handleSubmit(); }}>
              <div className="flex items-center justify-between mb-2">
                <div className="text-xl font-semibold text-white/90">{mode === "login" ? "Login" : "Sign Up"}</div>
                <button type="button" onClick={() => setMode(mode === "login" ? "signup" : "login")} className="text-pink-300 text-sm font-medium hover:underline">
                  {mode === "login" ? "Create account" : "Back to login"}
                </button>
              </div>

              {mode === "signup" && (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-sm text-white/80">First Name</label>
                    <Input value={firstName} onChange={(e) => setFirstName(e.target.value)} placeholder="John" className="mt-1" />
                  </div>
                  <div>
                    <label className="text-sm text-white/80">Last Name</label>
                    <Input value={lastName} onChange={(e) => setLastName(e.target.value)} placeholder="Doe" className="mt-1" />
                  </div>
                  {role !== "student" && (
                    <div className="col-span-2">
                      <label className="text-sm text-white/80">Department</label>
                      <Input value={department} onChange={(e) => setDepartment(e.target.value)} placeholder="Computer Science" className="mt-1" />
                    </div>
                  )}
                </div>
              )}

              <div>
                <label className="text-sm text-white/80">Email</label>
                <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@college.edu" className="mt-1" />
              </div>

              <div className="relative">
                <label className="text-sm text-white/80">Password</label>
                <div className="relative">
                  <Input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="mt-1 pr-12"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(v => !v)}
                    className="absolute top-1/2 right-3 -translate-y-1/2 text-2xl cursor-pointer"
                  >
                    {showPassword ? '🐵' : '🙈'}
                  </button>
                </div>
              </div>

              {mode === "login" && (
                <div className="flex items-center justify-between">
                  <div></div>
                  <Dialog>
                    <DialogTrigger asChild>
                      <button type="button" className="text-pink-300 text-sm hover:underline">Forgot password?</button>
                    </DialogTrigger>
                    <DialogContent className="border-white/10 bg-background/80 backdrop-blur-xl">
                      <DialogHeader>
                        <DialogTitle>Reset Password</DialogTitle>
                        <DialogDescription>Enter your email to receive reset instructions.</DialogDescription>
                      </DialogHeader>
                      <Input type="email" placeholder="you@college.edu" />
                      <DialogFooter>
                        <Button>Send Reset Link</Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                </div>
              )}

              {error && <div className="text-sm text-pink-200 font-medium">{error}</div>}

              <m.button
                type="submit"
                disabled={loading}
                whileHover={{
                  scale: 1.07,
                  filter: "brightness(1.08)",
                  backgroundPosition: "100% 50%",
                  transition: { duration: 0.8, ease: "easeInOut" }
                }}
                whileTap={{ scale: 0.98 }}
                transition={{ type: 'spring', stiffness: 350 }}
                className={`w-full relative flex items-center justify-center gap-3 overflow-hidden
                  ${
                    mode === "signup"
                      ? "bg-gradient-to-r from-pink-500 via-fuchsia-500 to-cyan-400 text-white font-extrabold py-3 rounded-2xl shadow-2xl text-lg md:text-xl px-6 border-2 border-pink-400/40 transition-all duration-200"
                      : "text-white font-bold py-3 rounded-2xl shadow-[0_8px_32px_0_rgba(124,95,255,0.12)] text-lg md:text-xl px-6 border border-white/20 backdrop-blur-xl font-sans"
                  }`}
                style={mode === "login" ? {
                  fontFamily: 'Poppins, Inter, Nunito, sans-serif',
                  background: 'linear-gradient(90deg, #ec4899, #7c5fff, #3b82f6, #ec4899)',
                  backgroundSize: '200% 200%',
                  backgroundPosition: '0% 50%',
                  color: '#fff',
                  position: 'relative',
                  overflow: 'hidden',
                  boxShadow: '0 4px 32px 0 rgba(124,95,255,0.10), 0 0 0 4px rgba(236,72,153,0.10)',
                  border: '1.5px solid rgba(255,255,255,0.13)',
                  backdropFilter: 'blur(16px) saturate(180%)',
                  WebkitBackdropFilter: 'blur(16px) saturate(180%)',
                  transition: 'background-position 0.8s cubic-bezier(0.4,0,0.2,1)',
                } : undefined}
              >
                {mode === "login" && (
                  <>
                    <span className="absolute inset-0 rounded-2xl pointer-events-none" style={{
                      boxShadow: "0 0 32px 8px rgba(236,72,153,0.18), 0 0 0 4px rgba(124,95,255,0.18)",
                      border: "2px solid rgba(236,72,153,0.18)",
                      opacity: 0.5,
                      zIndex: 0,
                    }} />
                    <span className="relative z-10 flex items-center gap-2">
                      <svg width="22" height="22" fill="none" viewBox="0 0 24 24" className="inline-block text-blue-200 drop-shadow-glow">
                        <path d="M15 12H3" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                        <path d="M9 8l-4 4 4 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        <rect x="17" y="7" width="4" height="10" rx="2" stroke="currentColor" strokeWidth="2" />
                      </svg>
                      <span className="font-bold tracking-wide" style={{
                        fontFamily: 'Poppins, Inter, Nunito, sans-serif',
                        letterSpacing: '0.03em',
                        textShadow: '0 2px 12px rgba(124,95,255,0.18), 0 0 8px rgba(236,72,153,0.18)',
                      }}>
                        {loading ? "Processing..." : `Sign in as ${role}`}
                      </span>
                    </span>
                  </>
                )}
                {mode === "signup" && (
                  <>
                    <span className="absolute inset-0 rounded-2xl pointer-events-none animate-pulse border-2 border-pink-400/40 border-dashed" />
                    <span className="flex items-center justify-center gap-2 relative z-10">
                      <svg width="22" height="22" fill="none" viewBox="0 0 24 24" className="inline-block text-cyan-200 drop-shadow-glow">
                        <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" />
                        <path d="M12 8v4l3 2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                      {loading ? "Processing..." : `Create ${role} account`}
                    </span>
                  </>
                )}
              </m.button>
              {/* Add keyframes for gradient animation */}
              <style>
                {`
                  @keyframes gradient-move {
                    0% { background-position: 0% 50%; }
                    50% { background-position: 100% 50%; }
                    100% { background-position: 0% 50%; }
                  }
                `}
              </style>
            </form>
          </section>
        </div>
      </div>
    </div>
  );
}
