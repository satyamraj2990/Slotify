import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, PieChart, Pie, Cell } from "recharts";

export function UtilizationBar({ data }: { data: { name: string; value: number }[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Lab & Room Utilization</CardTitle>
      </CardHeader>
      <CardContent className="h-60">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data}>
            <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" tickLine={false} axisLine={false} />
            <YAxis hide domain={[0, 100]} />
            <Tooltip cursor={{ fill: "hsl(var(--muted)/0.4)" }} />
            <Bar dataKey="value" radius={[6, 6, 0, 0]} fill="hsl(var(--primary))" />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}

const COLORS = ["hsl(var(--primary))", "hsl(var(--accent))", "#22c55e", "#ef4444"];

export function LibraryDonut({ occupied, total }: { occupied: number; total: number }) {
  const percent = Math.min(100, Math.round((occupied / total) * 100));
  const chartData = [
    { name: "Occupied", value: percent },
    { name: "Vacant", value: 100 - percent },
  ];
  return (
    <Card>
      <CardHeader>
        <CardTitle>Library Occupancy</CardTitle>
      </CardHeader>
      <CardContent className="h-60 grid place-items-center">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie data={chartData} innerRadius={60} outerRadius={80} paddingAngle={1} dataKey="value">
              {chartData.map((_, i) => (
                <Cell key={`cell-${i}`} fill={i === 0 ? COLORS[1] : "hsl(var(--muted))"} />
              ))}
            </Pie>
          </PieChart>
        </ResponsiveContainer>
        <div className="absolute text-center">
          <div className="text-3xl font-extrabold">{percent}%</div>
          <div className="text-sm text-muted-foreground">occupied</div>
        </div>
      </CardContent>
    </Card>
  );
}

export function CafeOccupancy({ data }: { data: { name: string; value: number }[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Cafeteria Live Occupancy</CardTitle>
      </CardHeader>
      <CardContent className="h-60">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data}>
            <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" tickLine={false} axisLine={false} />
            <YAxis hide domain={[0, 100]} />
            <Tooltip cursor={{ fill: "hsl(var(--muted)/0.4)" }} />
            <Bar dataKey="value" radius={[6,6,0,0]} fill="hsl(var(--primary))" />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
