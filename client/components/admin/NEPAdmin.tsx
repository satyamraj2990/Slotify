import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { UtilizationBar } from "@/components/analytics/Charts";

export function ExpertiseMappingPanel() {
  const data = [
    { name: "Dr. Rao", value: 92 },
    { name: "Dr. Mehta", value: 78 },
    { name: "Prof. Verma", value: 84 },
  ];
  return (
    <Card>
      <CardHeader>
        <CardTitle>Faculty Expertise Mapping</CardTitle>
        <CardDescription>AI aligns subjects to expertise, not just availability.</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="text-sm mb-2">Top matches (score)</div>
        <UtilizationBar data={data} />
      </CardContent>
    </Card>
  );
}

export function WorkloadBalancerPanel() {
  const data = [
    { name: "Rao", value: 65 },
    { name: "Mehta", value: 80 },
    { name: "Verma", value: 55 },
    { name: "Iyer", value: 72 },
  ];
  return (
    <Card>
      <CardHeader>
        <CardTitle>Workload Balancer</CardTitle>
        <CardDescription>Ensures fair class distribution across faculty.</CardDescription>
      </CardHeader>
      <CardContent>
        <UtilizationBar data={data} />
        <div className="mt-3 text-xs text-muted-foreground">Red glow indicates overload; optimize to balance.</div>
      </CardContent>
    </Card>
  );
}

export function InfraUtilReport() {
  const data = [
    { name: "LT-1", value: 78 },
    { name: "LT-2", value: 52 },
    { name: "Lab-CSE", value: 61 },
    { name: "Seminar", value: 28 },
  ];
  return (
    <Card>
      <CardHeader>
        <CardTitle>Infrastructure Utilization</CardTitle>
        <CardDescription>Identify underused rooms/labs.</CardDescription>
      </CardHeader>
      <CardContent>
        <UtilizationBar data={data} />
      </CardContent>
    </Card>
  );
}

export function CourseOnboardingWizard() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Course Onboarding Wizard</CardTitle>
        <CardDescription>Quickly add NEP courses with credits and practical split.</CardDescription>
      </CardHeader>
      <CardContent className="grid gap-3 md:grid-cols-2">
        <div>
          <div className="text-sm">Course Code</div>
          <Input placeholder="CSE-301" />
        </div>
        <div>
          <div className="text-sm">Course Name</div>
          <Input placeholder="Advanced AI" />
        </div>
        <div>
          <div className="text-sm">Credits</div>
          <Input type="number" placeholder="4" />
        </div>
        <div>
          <div className="text-sm">Category</div>
          <select className="h-9 rounded-md border border-white/10 bg-background px-2 text-sm">
            <option>Major</option>
            <option>Minor</option>
            <option>Skill-Based</option>
            <option>Value-Added</option>
          </select>
        </div>
        <div className="md:col-span-2">
          <div className="text-sm">Practical Split</div>
          <Input placeholder="2L + 2P" />
        </div>
        <div className="md:col-span-2 flex justify-end gap-2">
          <Button variant="outline">Validate</Button>
          <Button className="bg-gradient-to-r from-primary to-accent">Add Course</Button>
        </div>
      </CardContent>
    </Card>
  );
}
