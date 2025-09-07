import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { motion as m } from "framer-motion";

export function VacantRoomsHeatmap({ rooms }: { rooms: { name: string; free: boolean }[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Vacant Classroom Finder</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-2">
          {rooms.map((r, i) => (
            <m.div
              key={r.name}
              className={`h-16 rounded-md border grid place-items-center text-xs font-medium ${r.free ? "bg-green-500/15 text-green-700 dark:text-green-400" : "bg-red-500/15 text-red-700 dark:text-red-400"}`}
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.02 }}
            >
              {r.name}
            </m.div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

export function NotificationsPanel({ items }: { items: { id: string; title: string; time: string }[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Notifications</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {items.map((n) => (
          <m.div key={n.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-sm flex items-center justify-between">
            <div>{n.title}</div>
            <div className="text-xs text-muted-foreground">{n.time}</div>
          </m.div>
        ))}
      </CardContent>
    </Card>
  );
}
