import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useMemo, useState } from "react";

export default function OfficeHours() {
  const tutors = ["Dr. Rao", "Dr. Mehta", "Prof. Verma"];
  const [teacher, setTeacher] = useState<string>(tutors[0]);
  const slots = useMemo(() => Array.from({ length: 12 }, (_, i) => `${9 + Math.floor(i/2)}:${i % 2 ? "30" : "00"}`), []);
  const [booked, setBooked] = useState<Record<string, boolean>>({});

  const book = (t: string, s: string) => setBooked((b) => ({ ...b, [`${t}-${s}`]: true }));

  return (
    <Card>
      <CardHeader>
        <CardTitle>Office Hours Booking</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="mb-3 flex items-center gap-2">
          <span className="text-sm">Faculty:</span>
          <select value={teacher} onChange={(e)=>setTeacher(e.target.value)} className="h-8 rounded-md border border-white/10 bg-background px-2 text-sm">
            {tutors.map((t) => <option key={t}>{t}</option>)}
          </select>
        </div>
        <div className="grid grid-cols-3 gap-2 md:grid-cols-6">
          {slots.map((s) => (
            <Button key={s} size="sm" variant={booked[`${teacher}-${s}`] ? "secondary" : "outline"} disabled={booked[`${teacher}-${s}`]} onClick={()=>book(teacher, s)} className="justify-center">
              {booked[`${teacher}-${s}`] ? `Booked ${s}` : `Book ${s}`}
            </Button>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
