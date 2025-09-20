import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { motion as m } from "framer-motion";

export function ClashDetectorBanner({ clashes = 0 }: { clashes?: number }) {
  const ok = clashes === 0;
  return (
    <m.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} className={`rounded-lg border p-3 ${ok ? "border-green-500/30 bg-green-500/10" : "border-red-500/40 bg-red-500/10 shadow-[0_0_24px_rgba(239,68,68,0.35)]"}`}>
      <div className="text-sm">{ok ? "No clashes detected" : `${clashes} potential clashes — resolve before publishing`}</div>
    </m.div>
  );
}

export function WhatIfSimulation() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Scenario Simulation (What-If)</CardTitle>
        <CardDescription>Experiment safely before finalizing.</CardDescription>
      </CardHeader>
      <CardContent className="grid gap-3 md:grid-cols-3">
        <div>
          <div className="text-sm">Move Course</div>
          <select className="h-9 w-full rounded-md border border-white/10 bg-background px-2 text-sm">
            <option>MAT-202</option>
            <option>CSE-101</option>
            <option>ELE-210</option>
          </select>
        </div>
        <div>
          <div className="text-sm">To Day</div>
          <select className="h-9 w-full rounded-md border border-white/10 bg-background px-2 text-sm">
            <option>Thu</option>
            <option>Fri</option>
          </select>
        </div>
        <div>
          <div className="text-sm">To Period</div>
          <select className="h-9 w-full rounded-md border border-white/10 bg-background px-2 text-sm">
            <option>5</option>
            <option>6</option>
            <option>7</option>
          </select>
        </div>
        <div className="md:col-span-3 flex justify-end">
          <Button className="bg-gradient-to-r from-primary to-accent">Simulate</Button>
        </div>
      </CardContent>
    </Card>
  );
}

export function NEPComplianceChecker() {
  const items = [
    { 
      k: "Credits Balanced", 
      pass: true,
      link: "https://www.ugc.ac.in/nep/"
    },
    { 
      k: "Multidisciplinary Slots", 
      pass: true,
      link: "https://www.education.gov.in/nep/multidisciplinary-education"
    },
    { 
      k: "No Overload", 
      pass: true,
      link: "https://www.ugc.ac.in/nep/academic-guidelines"
    },
    { 
      k: "Internship/Practice Integrated", 
      pass: false,
      link: "https://www.education.gov.in/nep/internship-guidelines"
    },
  ];

  const handleBadgeClick = (link: string) => {
    window.open(link, '_blank', 'noopener,noreferrer');
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>NEP Compliance Checker</CardTitle>
        <CardDescription>Ensure alignment before publishing.</CardDescription>
      </CardHeader>
      <CardContent className="grid gap-2">
        {items.map((i) => (
          <div key={i.k} className={`flex items-center justify-between rounded-md border px-3 py-2 ${i.pass ? "border-green-500/30 bg-green-500/10" : "border-yellow-400/40 bg-yellow-400/10"}`}>
            <div className="text-sm">{i.k}</div>
            <button
              onClick={() => handleBadgeClick(i.link)}
              className={`text-xs px-2 py-0.5 rounded transition-all duration-200 hover:scale-105 hover:shadow-md cursor-pointer ${i.pass ? "bg-green-500/20 hover:bg-green-500/30" : "bg-yellow-400/20 hover:bg-yellow-400/30"}`}
              title={`Click to learn more about ${i.k}`}
            >
              {i.pass ? "PASS" : "CHECK"}
            </button>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
