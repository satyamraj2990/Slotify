import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export function RegisterTeacher() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Register Teacher</CardTitle>
      </CardHeader>
      <CardContent className="grid gap-3 md:grid-cols-3">
        <Input placeholder="Full name" />
        <Input placeholder="Email" type="email" />
        <Input placeholder="Phone" />
        <Input placeholder="Subjects (comma separated)" className="md:col-span-2" />
        <Input placeholder="Weekly workload (hours)" />
        <Input placeholder="Availability (e.g., Mon 2-5)" className="md:col-span-3" />
        <div className="md:col-span-3 flex justify-end">
          <Button className="bg-gradient-to-r from-primary to-accent">Add Teacher</Button>
        </div>
      </CardContent>
    </Card>
  );
}

export function RegisterCourse() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Register Course</CardTitle>
      </CardHeader>
      <CardContent className="grid gap-3 md:grid-cols-3">
        <Input placeholder="Course name" className="md:col-span-2" />
        <Input placeholder="Code" />
        <Input placeholder="Credits" type="number" />
        <Input placeholder="Theory/Practical (e.g., 2L+2P)" />
        <Input placeholder="Weekly lectures" type="number" />
        <Input placeholder="Assign teacher (name)" />
        <div className="md:col-span-3 flex justify-end">
          <Button className="bg-gradient-to-r from-primary to-accent">Add Course</Button>
        </div>
      </CardContent>
    </Card>
  );
}

export function ConstraintsSetup() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Constraints Setup</CardTitle>
      </CardHeader>
      <CardContent className="grid gap-3 md:grid-cols-3">
        <Input placeholder="Classroom (name)" />
        <Input placeholder="Capacity" type="number" />
        <Input placeholder="Type (Room/Lab)" />
        <Input placeholder="Holiday (YYYY-MM-DD)" />
        <Input placeholder="Blocked hours (e.g., Fri 1-3)" className="md:col-span-2" />
        <div className="md:col-span-3 flex justify-end gap-2">
          <Button variant="outline">Validate</Button>
          <Button className="bg-gradient-to-r from-primary to-accent">Save Constraints</Button>
        </div>
      </CardContent>
    </Card>
  );
}
