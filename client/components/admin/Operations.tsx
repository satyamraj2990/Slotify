import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { motion as m } from "framer-motion";

export function EnergyOptimizationPanel() {
  const unused = [
    { room: "LT-3", reason: "No classes 2pm-5pm" },
    { room: "PHY-Lab", reason: "Maintenance day" },
    { room: "Seminar-2", reason: "Free all day" },
  ];
  return (
    <Card>
      <CardHeader>
        <CardTitle>Energy Optimization</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {unused.map((u, i) => (
          <m.div key={u.room} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.05 }} className="flex items-center justify-between rounded-md border border-pink-500/30 bg-pink-500/10 p-3">
            <div>
              <div className="font-medium">{u.room}</div>
              <div className="text-xs text-muted-foreground">{u.reason}</div>
            </div>
            <Button variant="outline" className="hover:shadow-[0_0_24px_rgba(255,20,147,0.6)]">Shut utilities</Button>
          </m.div>
        ))}
      </CardContent>
    </Card>
  );
}

export function EmergencyReallocationPanel() {
  const cancelled = [
    { course: "MAT-202", time: "Tue 12:00", reason: "Faculty sick" },
  ];
  return (
    <Card>
      <CardHeader>
        <CardTitle>Emergency Reallocation</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {cancelled.map((c) => (
          <div key={c.course} className="rounded-md border border-white/10 p-3">
            <div className="font-medium">{c.course} • {c.time}</div>
            <div className="text-xs text-muted-foreground">{c.reason}</div>
            <div className="mt-2 flex gap-2">
              <Button className="bg-gradient-to-r from-primary to-accent">Auto reallocate</Button>
              <Button variant="outline">Pick substitute</Button>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
