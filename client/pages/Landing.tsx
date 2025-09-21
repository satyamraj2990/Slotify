import { motion as m } from "framer-motion";
import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import Particles from "@/components/background/Particles";
import { CalendarCog, Users2, MonitorCheck, HelpCircle, ScanSearch, Sun, Moon } from "lucide-react";

export default function Landing() {
  // Theme toggle logic
  const [theme, setTheme] = useState(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("theme") || "dark";
    }
    return "dark";
  });

  useEffect(() => {
    document.documentElement.classList.remove("light", "dark");
    document.documentElement.classList.add(theme);
    localStorage.setItem("theme", theme);
  }, [theme]);

  const toggleTheme = () => setTheme(theme === "dark" ? "light" : "dark");
  const [showHelp, setShowHelp] = useState(false);

  return (
    <div
      className="relative min-h-svh overflow-hidden font-sans"
      style={{
        fontFamily: "Inter, Poppins, Nunito, sans-serif",
        scrollbarWidth: "none",
        msOverflowStyle: "none",
      }}
    >
      {/* Hide scrollbar */}
      <style>
        {`
          body::-webkit-scrollbar, div::-webkit-scrollbar {
            display: none;
            width: 0 !important;
            background: transparent !important;
          }
        `}
      </style>

      {/* Theme toggle */}
      <button
        onClick={toggleTheme}
        className="absolute top-4 right-4 z-30 flex items-center gap-2 rounded-full border border-border/20 bg-background/70 px-3 py-2 shadow-md backdrop-blur-md transition hover:bg-accent/20 hover:border-primary/40 focus:outline-none focus:ring-2 focus:ring-primary/60 dark:border-white/20 dark:bg-white/10"
        aria-label="Toggle theme"
      >
        {theme === "dark" ? <Sun className="w-5 h-5 text-yellow-300" /> : <Moon className="w-5 h-5 text-primary" />}
        <span className="hidden md:inline text-xs font-semibold text-foreground dark:text-white/80">
          {theme === "dark" ? "Light" : "Dark"} Mode
        </span>
      </button>

      {/* SOS button top-right */}
      <div className="absolute top-16 right-4 z-30 flex flex-col items-end">
        <button
          onClick={() => setShowHelp(v => !v)}
          className="flex items-center justify-center rounded-full bg-background/70 border border-primary/30 px-3 py-2 shadow-md backdrop-blur transition hover:bg-accent/20 focus:outline-none dark:bg-white/10 dark:border-pink-400/30 dark:hover:bg-pink-500/20"
          aria-label="Need Help"
        >
          <span className="text-2xl" role="img" aria-label="Need Help">🆘</span>
        </button>
        {showHelp && (
          <div className="mt-2 w-64 bg-background/95 border border-primary/30 rounded-xl shadow-lg p-4 text-sm text-foreground backdrop-blur flex flex-col items-center animate-fade-in transition-all duration-300
            hover:bg-green-50 hover:border-green-300 hover:shadow-[0_0_32px_0_rgba(34,197,94,0.25)] dark:bg-black/90 dark:text-gray-100 dark:hover:bg-green-900 dark:hover:border-green-700"
          >
            <div className="flex items-center gap-2 mb-2">
              <HelpCircle className="text-primary" />
              <span className="font-semibold">Contact Support</span>
            </div>
            <span className="mb-1">Email:</span>
            <a href="mailto:satyamraj2990@gmail.com" className="text-primary font-bold hover:underline">
              satyamraj2990@gmail.com
            </a>
            <div className="mt-3 text-center">
             
            </div>
            <button
              onClick={() => setShowHelp(false)}
              className="mt-3 px-3 py-1 rounded bg-primary text-primary-foreground text-xs hover:bg-primary/90 transition"
            >
              Close
            </button>
          </div>
        )}
      </div>

      {/* Background */}
      <Particles />
      <div className="absolute inset-0 -z-20 flex items-center justify-center pointer-events-none select-none">
        <img src="/Slotify-logo.svg" alt="Slotify watermark" className="w-[60vw] max-w-4xl opacity-10 object-contain" />
      </div>

      {/* Gradient Blobs */}
      <div className="absolute inset-0 -z-10 pointer-events-none">
        <div className="absolute -top-24 -left-24 size-96 rounded-full bg-gradient-to-br from-pink-500/30 via-fuchsia-500/20 to-blue-500/20 blur-3xl animate-pulse" />
        <div className="absolute top-1/2 -right-24 size-80 rounded-full bg-gradient-to-br from-blue-500/20 via-pink-500/20 to-fuchsia-500/20 blur-3xl animate-pulse" />
      </div>

      <div className="container mx-auto px-4 flex flex-col justify-center items-center min-h-screen">
        {/* Title Section */}
        <div className="flex flex-col items-center justify-center text-center w-full">
          <div className="mb-2 flex flex-col items-center">
            {/* Logo + Title */}
            <div className="flex flex-row items-center gap-3">
              <div className="flex items-center justify-center bg-white/10 rounded-2xl p-2 shadow-lg" style={{ width: "70px", height: "70px" }}>
                <img src="/Slotify-logo.svg" alt="Slotiफाई logo" className="h-12 w-12 object-contain opacity-90" />
              </div>
              <m.h1
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4 }}
                className="text-3xl md:text-4xl font-extrabold tracking-tight leading-tight bg-gradient-to-r from-pink-400 via-fuchsia-400 to-blue-400 bg-clip-text text-transparent"
              >
                <span className="bg-gradient-to-r from-blue-400 via-pink-400 to-fuchsia-400 bg-clip-text text-transparent font-extrabold">
                  Slotiफाई
                </span>
                <span className="block text-sm md:text-lg font-bold bg-gradient-to-r from-blue-400 via-pink-400 to-fuchsia-400 bg-clip-text text-transparent">
                  (NEP 2020 Aligned)
                </span>
              </m.h1>
            </div>

            {/* Quote */}
            <div className="group relative mt-2 flex items-center justify-center w-full">
              <div className="w-full max-w-xl px-4 py-3 rounded-2xl bg-white/10 dark:bg-black/20 backdrop-blur-md shadow-lg border border-blue-500/30 dark:border-blue-400/30 flex flex-col items-center justify-center transition-all duration-300
                hover:backdrop-blur-xl hover:scale-105 hover:border-pink-400/60 hover:shadow-[0_0_32px_0_rgba(236,72,153,0.25)] hover:bg-pink-500/10"
              >
                <span className="text-base md:text-lg font-semibold text-center italic bg-gradient-to-r from-blue-500 via-pink-500 to-fuchsia-500 bg-clip-text text-transparent">
                  "विद्या ददाति विनयम्"
                </span>
                <span className="block mt-1 text-base md:text-xl font-extrabold text-center bg-gradient-to-r from-blue-500 via-pink-500 to-fuchsia-500 bg-clip-text text-transparent">
                  Knowledge bestows <span className="text-pink-500">Humility</span>,  
                  <span className="block font-bold text-fuchsia-400">and Humility opens the door to Wisdom.</span>
                </span>
              </div>
            </div>
          </div>

          {/* Subtitle */}
          <m.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.15 }} className="mt-2 text-muted-foreground max-w-2xl text-lg md:text-xl">
            Automate conflict-free schedules, track utilization, and empower Admins, Teachers, and Students with smart tools.
          </m.p>

          {/* Login Buttons */}
          <m.div
            initial={{ opacity: 0, y: 32 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25, duration: 0.7, type: "spring", bounce: 0.2 }}
            className="mt-8 flex flex-col items-center w-full"
          >
            {/* Entities grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full max-w-3xl justify-items-center">
              {[
                { label: "Admin Login", icon: "🛡️", desc: "Manage data, generate AI timetables, approve leaves" },
                { label: "Teacher Login", icon: "🎓", desc: "View schedule, request leave, swap lectures" },
                { label: "Student Login", icon: "👨‍🎓", desc: "My timetable, vacant rooms, library seats" }
              ].map(({ label, icon, desc }) => (
                <m.div
                  key={label}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.97 }}
                  className="w-full max-w-xs flex flex-col items-center"
                >
                  <div className="group flex flex-col items-center justify-center rounded-2xl border-2 border-pink-400/30 bg-gradient-to-r from-pink-400/20 via-fuchsia-400/20 to-blue-400/20 px-8 py-7 font-semibold w-full">
                    <span className="mb-1 text-3xl">{icon}</span>
                    <span className="text-lg font-extrabold">{label.replace(" Login", "")}</span>
                    <span className="text-xs font-medium text-center mt-2">{desc}</span>
                  </div>
                </m.div>
              ))}
            </div>
            {/* Login button centered below entities */}
            <div className="w-full flex justify-center mt-8">
              <m.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.98 }}>
                <Link
                  to="/login"
                  className="group relative flex items-center justify-center rounded-2xl px-6 py-3 font-extrabold text-base md:text-lg text-center bg-gradient-to-r from-pink-500/30 via-fuchsia-500/30 to-blue-500/30 border-2 border-pink-400/30 backdrop-blur-xl hover:border-pink-400/60"
                  style={{ maxWidth: "180px", width: "100%" }}
                >
                  <span className="font-extrabold text-base md:text-lg">Login</span>
                </Link>
              </m.div>
            </div>
          </m.div>
        </div>

        {/* Features */}
        <section className="grid gap-6 py-8 md:grid-cols-2 items-center w-full">
          <m.div initial={{ opacity: 0, y: 32 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.7, type: "spring", bounce: 0.2 }} className="rounded-2xl border border-white/10 bg-gradient-to-r from-pink-400/10 via-fuchsia-400/10 to-blue-400/10 p-6 backdrop-blur-lg shadow-xl flex flex-col items-center justify-center">
            <div className="text-xl md:text-2xl font-bold mb-2 text-white flex items-center gap-2">About 📚</div>
            <p className="text-sm md:text-base text-white/80 font-medium text-center">
              NEP 2020 emphasizes multidisciplinary, credit-based learning. Our AI engine automates timetable generation, maintains compliance, and optimizes resources.
            </p>
          </m.div>

          {/* Feature List */}
          <div className="grid gap-4 sm:grid-cols-2 items-center">
            <Feature icon={<CalendarCog />} title="AI Timetable Creation" desc="One-click conflict-free generation." />
            <Feature icon={<ScanSearch />} title="Vacancy Monitoring" desc="Classrooms, labs, and library occupancy." />
            <Feature icon={<MonitorCheck />} title="Multi-role Dashboards" desc="Tailored Admin, Teacher, Student views." />
            <Feature icon={<Users2 />} title="Scenario Simulation" desc="What-if moves with live clash checks." />
          </div>
        </section>
      </div>
    </div>
  );
}

function Feature({ icon, title, desc }: { icon: React.ReactNode; title: string; desc: string }) {
  return (
    <m.div initial={{ opacity: 0, y: 32 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.7, type: "spring", bounce: 0.2 }} className="rounded-2xl border border-white/10 bg-gradient-to-r from-pink-400/5 via-fuchsia-400/5 to-blue-400/5 p-4 backdrop-blur hover:shadow-[0_0_16px_rgba(255,20,147,0.15)]">
      <div className="mb-2 inline-flex items-center gap-2 text-pink-400">
        {icon} <span className="font-medium text-white/90">{title}</span>
      </div>
      <div className="text-xs text-white/70">{desc}</div>
    </m.div>
  );
}
