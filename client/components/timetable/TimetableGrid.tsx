import { motion as m } from "framer-motion";
import { cn } from "@/lib/utils";

export type Slot = {
  day: string;
  period: number;
  course?: string;
  room?: string;
  faculty?: string;
  color?: string;
  elective?: boolean;
};

const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export function TimetableGrid({
  periods = 8,
  data = [],
  compact = false,
  printRef,
}: {
  periods?: number;
  data?: Slot[];
  compact?: boolean;
  printRef?: React.Ref<HTMLDivElement> | null;
}) {
  const grid = Array.from({ length: days.length }, (_, d) =>
    Array.from({ length: periods }, (_, p) => ({ day: days[d], period: p + 1 }))
  );
  const map = new Map<string, Slot>();
  data.forEach((s) => map.set(`${s.day}-${s.period}`, s));

  return (
    <div ref={printRef as any} className={cn("overflow-auto rounded-lg border", compact && "text-xs")}> 
      <div
        className="grid"
        style={{
          gridTemplateColumns: `80px repeat(${periods}, minmax(120px, 1fr))`,
        }}
      >
        <div className="sticky left-0 z-10 bg-muted/40 p-2 font-medium">Day</div>
        {Array.from({ length: periods }, (_, i) => (
          <div key={i} className="bg-muted/40 p-2 text-center font-medium">
            P{i + 1}
          </div>
        ))}
        {grid.map((row, ri) => (
          <div key={`row-${ri}`} className="contents">
            <div key={`day-${ri}`} className="sticky left-0 z-10 bg-background p-2 font-medium">
              {days[ri]}
            </div>
            {row.map((cell, ci) => {
              const key = `${cell.day}-${cell.period}`;
              const slot = map.get(key);
              return (
                <m.div
                  layout
                  key={key}
                  className={cn(
                    "p-2 border-l border-b min-h-[64px] flex flex-col gap-1 justify-center",
                    slot ? "bg-primary/10" : "bg-background",
                    slot?.elective && "ring-1 ring-pink-500/60 shadow-[0_0_24px_rgba(255,20,147,0.35)]"
                  )}
                  initial={{ opacity: 0, scale: 0.98 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.2 }}
                >
                  {slot ? (
                    <div className="space-y-1">
                      <div className="font-medium leading-tight" style={{ color: slot.color ?? "hsl(var(--primary))" }}>
                        {slot.course}
                      </div>
                      <div className="text-muted-foreground leading-snug">
                        {slot.room} • {slot.faculty}
                      </div>
                    </div>
                  ) : (
                    <div className="text-muted-foreground/60">—</div>
                  )}
                </m.div>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}
