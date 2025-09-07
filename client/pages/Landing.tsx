import { motion as m } from "framer-motion";
import { Link } from "react-router-dom";
import Particles from "@/components/background/Particles";
import { CalendarCog, Users2, MonitorCheck, HelpCircle, ScanSearch } from "lucide-react";

export default function Landing() {
  return (
    <div className="relative min-h-svh overflow-hidden">
      <div className="absolute inset-0 -z-10 pointer-events-none">
        <div className="absolute -top-24 -left-24 size-80 rounded-full bg-pink-500/10 blur-3xl" />
        <div className="absolute top-1/2 -right-24 size-72 rounded-full bg-fuchsia-500/10 blur-3xl" />
      </div>
      <div className="container">
        <div className="flex items-center justify-between py-4">
          <div className="flex items-center gap-2">
            <img src="/logo-slotify.svg" alt="Slotiफाई logo" className="h-8 w-auto object-contain ring-1 ring-white/10 bg-white/5 p-0.5 rounded-md shadow-[0_0_16px_rgba(236,72,153,0.35)]" />
            <div className="text-sm font-bold">Slotiफाई</div>
          </div>
          <Link to="/login" className="rounded-md border border-white/10 bg-card/40 px-3 py-1.5 text-sm backdrop-blur hover:shadow-[0_0_24px_rgba(255,255,255,0.25)]">Login</Link>
        </div>
        <div className="flex min-h-[60svh] flex-col items-center justify-center text-center">
          <div className="mb-4">
            <img src="/logo-slotify.svg" alt="Slotiफाई logo" className="h-14 w-auto mx-auto object-contain ring-1 ring-white/10 bg-white/5 rounded-md p-1.5 shadow-[0_0_24px_rgba(236,72,153,0.35)]" />
          </div>
          <m.h1 initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }} className="text-5xl md:text-6xl font-extrabold tracking-tight">
            Slotiफाई <span className="text-pink-400">(NEP 2020 Aligned)</span>
          </m.h1>
          <m.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.15 }} className="mt-3 text-muted-foreground max-w-2xl">
            Automate conflict-free schedules, track utilization, and empower Admins, Teachers, and Students with smart tools.
          </m.p>
          <m.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.25 }} className="mt-8 grid gap-3 sm:grid-cols-3">
            <Link to="/login" className="rounded-xl border border-white/10 bg-card/40 px-6 py-3 backdrop-blur-md hover:shadow-[0_0_30px_rgba(255,255,255,0.25)]">Admin Login</Link>
            <Link to="/login" className="rounded-xl border border-white/10 bg-card/40 px-6 py-3 backdrop-blur-md hover:shadow-[0_0_30px_rgba(255,255,255,0.25)]">Teacher Login</Link>
            <Link to="/login" className="rounded-xl border border-white/10 bg-card/40 px-6 py-3 backdrop-blur-md hover:shadow-[0_0_30px_rgba(255,255,255,0.25)]">Student Login</Link>
          </m.div>
        </div>
        <section className="grid gap-6 py-12 md:grid-cols-2">
          <div className="rounded-2xl border border-white/10 bg-card/40 p-6 backdrop-blur">
            <div className="text-xl font-semibold mb-2">About</div>
            <p className="text-sm text-muted-foreground">NEP 2020 emphasizes multidisciplinary, credit-based learning. Our AI engine automates timetable generation, maintains compliance, and optimizes resources.</p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <Feature icon={<CalendarCog />} title="AI Timetable Creation" desc="One-click conflict-free generation." />
            <Feature icon={<ScanSearch />} title="Vacancy Monitoring" desc="Classrooms, labs, and library occupancy." />
            <Feature icon={<MonitorCheck />} title="Multi-role Dashboards" desc="Tailored Admin, Teacher, Student views." />
            <Feature icon={<Users2 />} title="Scenario Simulation" desc="What-if moves with live clash checks." />
          </div>
        </section>
        <section className="py-8 text-center">
          <div className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-card/40 px-4 py-2 text-sm backdrop-blur">
            <HelpCircle className="text-pink-400" />
            <span>Need help?</span>
            <a href="#contact" className="text-pink-400 hover:underline">Contact Support</a>
          </div>
        </section>
      </div>
    </div>
  );
}

function Feature({ icon, title, desc }: { icon: React.ReactNode; title: string; desc: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-card/40 p-4 backdrop-blur hover:shadow-[0_0_30px_rgba(255,20,147,0.35)]">
      <div className="mb-2 inline-flex items-center gap-2 text-pink-400">{icon} <span className="font-medium">{title}</span></div>
      <div className="text-xs text-muted-foreground">{desc}</div>
    </div>
  );
}
