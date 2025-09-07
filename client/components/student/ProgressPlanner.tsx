import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { UtilizationBar } from "@/components/analytics/Charts";

export function CreditProgressDashboard() {
  const data = [
    { name: "Major", value: 72 },
    { name: "Minor", value: 40 },
    { name: "Value-Add", value: 55 },
  ];
  return (
    <Card>
      <CardHeader>
        <CardTitle>Credit & Progress</CardTitle>
      </CardHeader>
      <CardContent>
        <UtilizationBar data={data} />
      </CardContent>
    </Card>
  );
}

export function StudyPlannerPanel() {
  const suggests = [
    "2-3pm: Library (quiet) — revise MAT-202",
    "4-5pm: Group study — CSE-101 problem set",
    "6-7pm: Cafeteria (light) — read ENG-105",
  ];
  return (
    <Card>
      <CardHeader>
        <CardTitle>AI Free-time Planner</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {suggests.map((s) => (
          <div key={s} className="rounded-md border border-white/10 bg-background/50 p-2 text-sm">{s}</div>
        ))}
      </CardContent>
    </Card>
  );
}
