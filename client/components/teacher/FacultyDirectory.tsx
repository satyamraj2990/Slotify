import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { useMemo, useState } from "react";

export type Faculty = {
  id: string;
  name: string;
  dept: string;
  email: string;
  phone: string;
  office: string;
  hours: string;
  expertise: string[];
};

export default function FacultyDirectory() {
  const list = useMemo<Faculty[]>(() => [
    { id: "f1", name: "Dr. Rao", dept: "CSE", email: "rao@uni.edu", phone: "+91 98765 00001", office: "A-204", hours: "Mon 3-5pm", expertise: ["AI", "DS"] },
    { id: "f2", name: "Dr. Mehta", dept: "Math", email: "mehta@uni.edu", phone: "+91 98765 00002", office: "B-115", hours: "Tue 1-3pm", expertise: ["Algebra", "Calculus"] },
    { id: "f3", name: "Prof. Verma", dept: "ECE", email: "verma@uni.edu", phone: "+91 98765 00003", office: "Lab-ECE-1", hours: "Wed 11-1pm", expertise: ["VLSI", "Signals"] },
  ], []);

  const [active, setActive] = useState<Faculty | null>(null);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Faculty Directory</CardTitle>
        <CardDescription>Contact details, expertise, and office hours.</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {list.map((f) => (
            <div key={f.id} className="rounded-xl border border-white/10 bg-card/40 p-4 backdrop-blur-xl">
              <div className="text-lg font-semibold">{f.name}</div>
              <div className="text-sm text-muted-foreground">{f.dept} • Office {f.office}</div>
              <div className="mt-2 text-sm">{f.email} • {f.phone}</div>
              <div className="mt-1 text-xs text-muted-foreground">Consultation: {f.hours}</div>
              <div className="mt-2 flex flex-wrap gap-1">
                {f.expertise.map((e) => (
                  <span key={e} className="rounded-full border border-pink-500/30 bg-pink-500/10 px-2 py-0.5 text-xs">{e}</span>
                ))}
              </div>
              <div className="mt-3 flex gap-2">
                <Dialog>
                  <DialogTrigger asChild>
                    <Button size="sm" variant="outline" onClick={() => setActive(f)}>Contact</Button>
                  </DialogTrigger>
                  <DialogContent className="border-white/10 bg-background/80 backdrop-blur-xl">
                    <DialogHeader>
                      <DialogTitle>Contact {active?.name}</DialogTitle>
                      <DialogDescription>Message will be routed via admin approval.</DialogDescription>
                    </DialogHeader>
                    <Input placeholder="Subject" />
                    <textarea className="min-h-24 rounded-md border border-white/10 bg-background/60 p-2 text-sm outline-none" placeholder="Your message..." />
                    <DialogFooter>
                      <Button className="bg-gradient-to-r from-primary to-accent">Send</Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
                <Button size="sm" className="bg-gradient-to-r from-primary to-accent">Book Office Hours</Button>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
