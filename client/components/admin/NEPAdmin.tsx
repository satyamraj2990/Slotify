import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FacultyExpertiseMapping, WorkloadBalancer, InfrastructureUtilization, TrendingElectives } from "@/components/analytics/Charts";

export function ExpertiseMappingPanel() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Faculty Expertise Mapping</CardTitle>
        <CardDescription>AI aligns subjects to expertise, not just availability.</CardDescription>
      </CardHeader>
      <CardContent>
        <FacultyExpertiseMapping />
      </CardContent>
    </Card>
  );
}

export function WorkloadBalancerPanel() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Workload Balancer</CardTitle>
        <CardDescription>Ensures fair class distribution across faculty.</CardDescription>
      </CardHeader>
      <CardContent>
        <WorkloadBalancer />
      </CardContent>
    </Card>
  );
}

export function InfraUtilReport() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Infrastructure Utilization</CardTitle>
        <CardDescription>Identify underused rooms/labs.</CardDescription>
      </CardHeader>
      <CardContent>
        <InfrastructureUtilization />
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
      <CardContent className="space-y-6">
        {/* Course Form - Compact Grid */}
        <div className="grid gap-3 md:grid-cols-3">
          <div>
            <div className="text-sm font-medium mb-1">Course Code</div>
            <Input placeholder="CSE-301" className="h-8" />
          </div>
          <div className="md:col-span-2">
            <div className="text-sm font-medium mb-1">Course Name</div>
            <Input placeholder="Advanced AI" className="h-8" />
          </div>
          <div>
            <div className="text-sm font-medium mb-1">Credits</div>
            <Input type="number" placeholder="4" className="h-8" />
          </div>
          <div>
            <div className="text-sm font-medium mb-1">Category</div>
            <select className="h-8 rounded-md border border-white/10 bg-background px-2 text-sm w-full">
              <option>Major</option>
              <option>Minor</option>
              <option>Skill-Based</option>
              <option>Value-Added</option>
            </select>
          </div>
          <div>
            <div className="text-sm font-medium mb-1">Practical Split</div>
            <Input placeholder="2L + 2P" className="h-8" />
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-between items-center">
          <div className="flex gap-2">
            <Button variant="outline" size="sm">Validate</Button>
            <Button size="sm" className="bg-gradient-to-r from-primary to-accent">Add Course</Button>
          </div>
          <div className="text-xs text-muted-foreground">
            Last added: <span className="text-primary">DSA-202</span> • 2 mins ago
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-4 gap-4 p-3 bg-muted/30 rounded-lg">
          <div className="text-center">
            <div className="text-lg font-bold text-primary">24</div>
            <div className="text-xs text-muted-foreground">Total Courses</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-bold text-green-600">18</div>
            <div className="text-xs text-muted-foreground">Active</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-bold text-blue-600">6</div>
            <div className="text-xs text-muted-foreground">Electives</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-bold text-orange-600">96</div>
            <div className="text-xs text-muted-foreground">Total Credits</div>
          </div>
        </div>

        {/* Recent Courses */}
        <div>
          <div className="text-sm font-medium mb-2">Recently Added Courses</div>
          <div className="space-y-2">
            {[
              { code: "DSA-202", name: "Data Structures", credits: 4, category: "Major" },
              { code: "ML-301", name: "Machine Learning", credits: 3, category: "Elective" },
              { code: "WD-101", name: "Web Development", credits: 2, category: "Skill-Based" }
            ].map((course, index) => (
              <div key={index} className="flex items-center justify-between p-2 bg-muted/20 rounded-md">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-primary/10 text-primary rounded-full flex items-center justify-center text-xs font-medium">
                    {course.code.split('-')[0]}
                  </div>
                  <div>
                    <div className="text-sm font-medium">{course.code}</div>
                    <div className="text-xs text-muted-foreground">{course.name}</div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs bg-blue-500/10 text-blue-600 px-2 py-1 rounded">
                    {course.credits} credits
                  </span>
                  <span className="text-xs bg-green-500/10 text-green-600 px-2 py-1 rounded">
                    {course.category}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
        
        {/* Trending Electives Section */}
        <div>
          <TrendingElectives />
        </div>
      </CardContent>
    </Card>
  );
}
