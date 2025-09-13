import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useState } from 'react';
import { profilesApi, coursesApi } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';

export function RegisterTeacher() {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    subjects: '',
    weeklyWorkload: '',
    availability: '',
    department: ''
  });

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async () => {
    // Validate required fields
    if (!formData.fullName || !formData.email) {
      toast({
        title: "Error",
        description: "Full name and email are required",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);
    try {
      const [firstName, ...lastNameParts] = formData.fullName.split(' ');
      const lastName = lastNameParts.join(' ');
      
      const subjectsArray = formData.subjects 
        ? formData.subjects.split(',').map(s => s.trim()).filter(s => s)
        : [];

      const teacherData = {
        email: formData.email,
        role: 'teacher' as const,
        first_name: firstName,
        last_name: lastName || '',
        display_name: formData.fullName,
        department: formData.department || 'General',
        phone: formData.phone || null,
        subjects: subjectsArray.length > 0 ? subjectsArray : null,
        weekly_workload: formData.weeklyWorkload ? parseInt(formData.weeklyWorkload) : null,
        availability: formData.availability || null
      };

      await profilesApi.create(teacherData);

      toast({
        title: "Success",
        description: "Teacher registered successfully",
      });

      // Reset form
      setFormData({
        fullName: '',
        email: '',
        phone: '',
        subjects: '',
        weeklyWorkload: '',
        availability: '',
        department: ''
      });

    } catch (error) {
      console.error('Error registering teacher:', error);
      toast({
        title: "Error",
        description: "Failed to register teacher. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Register Teacher</CardTitle>
      </CardHeader>
      <CardContent className="grid gap-3 md:grid-cols-3">
        <Input 
          placeholder="Full name" 
          value={formData.fullName}
          onChange={(e) => handleInputChange('fullName', e.target.value)}
        />
        <Input 
          placeholder="Email" 
          type="email" 
          value={formData.email}
          onChange={(e) => handleInputChange('email', e.target.value)}
        />
        <Input 
          placeholder="Phone" 
          value={formData.phone}
          onChange={(e) => handleInputChange('phone', e.target.value)}
        />
        <Input 
          placeholder="Department" 
          value={formData.department}
          onChange={(e) => handleInputChange('department', e.target.value)}
        />
        <Input 
          placeholder="Subjects (comma separated)" 
          className="md:col-span-2" 
          value={formData.subjects}
          onChange={(e) => handleInputChange('subjects', e.target.value)}
        />
        <Input 
          placeholder="Weekly workload (hours)" 
          type="number"
          value={formData.weeklyWorkload}
          onChange={(e) => handleInputChange('weeklyWorkload', e.target.value)}
        />
        <Input 
          placeholder="Availability (e.g., Mon 2-5)" 
          className="md:col-span-2" 
          value={formData.availability}
          onChange={(e) => handleInputChange('availability', e.target.value)}
        />
        <div className="md:col-span-3 flex justify-end">
          <Button 
            className="bg-gradient-to-r from-primary to-accent"
            onClick={handleSubmit}
            disabled={isLoading}
          >
            {isLoading ? 'Adding Teacher...' : 'Add Teacher'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

export function RegisterCourse() {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    courseName: '',
    code: '',
    credits: '',
    theoryPractical: '',
    weeklyLectures: '',
    assignTeacher: '',
    department: '',
    semester: '',
    year: '',
    courseType: 'major'
  });

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async () => {
    // Validate required fields
    if (!formData.courseName || !formData.code || !formData.credits) {
      toast({
        title: "Error",
        description: "Course name, code, and credits are required",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);
    try {
      // Find teacher by name if provided
      let assignedTeacherId = null;
      if (formData.assignTeacher) {
        const teachers = await profilesApi.getTeachers();
        const teacher = teachers.find(t => 
          `${t.first_name} ${t.last_name}`.toLowerCase().includes(formData.assignTeacher.toLowerCase()) ||
          t.display_name?.toLowerCase().includes(formData.assignTeacher.toLowerCase())
        );
        if (teacher) {
          assignedTeacherId = teacher.id;
        }
      }

      const courseData = {
        name: formData.courseName,
        code: formData.code.toUpperCase(),
        credits: parseInt(formData.credits),
        department: formData.department || 'General',
        semester: formData.semester || 'Fall',
        year: parseInt(formData.year) || new Date().getFullYear(),
        course_type: formData.courseType as 'major' | 'minor' | 'value_add' | 'core',
        max_students: 60, // Default value
        theory_practical: formData.theoryPractical || null,
        weekly_lectures: formData.weeklyLectures ? parseInt(formData.weeklyLectures) : null,
        assigned_teacher_id: assignedTeacherId
      };

      await coursesApi.create(courseData);

      toast({
        title: "Success",
        description: "Course registered successfully",
      });

      // Reset form
      setFormData({
        courseName: '',
        code: '',
        credits: '',
        theoryPractical: '',
        weeklyLectures: '',
        assignTeacher: '',
        department: '',
        semester: '',
        year: '',
        courseType: 'major'
      });

    } catch (error) {
      console.error('Error registering course:', error);
      toast({
        title: "Error",
        description: "Failed to register course. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Register Course</CardTitle>
      </CardHeader>
      <CardContent className="grid gap-3 md:grid-cols-3">
        <Input 
          placeholder="Course name" 
          className="md:col-span-2" 
          value={formData.courseName}
          onChange={(e) => handleInputChange('courseName', e.target.value)}
        />
        <Input 
          placeholder="Code" 
          value={formData.code}
          onChange={(e) => handleInputChange('code', e.target.value)}
        />
        <Input 
          placeholder="Credits" 
          type="number" 
          value={formData.credits}
          onChange={(e) => handleInputChange('credits', e.target.value)}
        />
        <Input 
          placeholder="Theory/Practical (e.g., 2L+2P)" 
          value={formData.theoryPractical}
          onChange={(e) => handleInputChange('theoryPractical', e.target.value)}
        />
        <Input 
          placeholder="Weekly lectures" 
          type="number" 
          value={formData.weeklyLectures}
          onChange={(e) => handleInputChange('weeklyLectures', e.target.value)}
        />
        <Input 
          placeholder="Assign teacher (name)" 
          value={formData.assignTeacher}
          onChange={(e) => handleInputChange('assignTeacher', e.target.value)}
        />
        <Input 
          placeholder="Department" 
          value={formData.department}
          onChange={(e) => handleInputChange('department', e.target.value)}
        />
        <Input 
          placeholder="Semester" 
          value={formData.semester}
          onChange={(e) => handleInputChange('semester', e.target.value)}
        />
        <Input 
          placeholder="Year" 
          type="number" 
          value={formData.year}
          onChange={(e) => handleInputChange('year', e.target.value)}
        />
        <div className="md:col-span-3 flex justify-end">
          <Button 
            className="bg-gradient-to-r from-primary to-accent"
            onClick={handleSubmit}
            disabled={isLoading}
          >
            {isLoading ? 'Adding Course...' : 'Add Course'}
          </Button>
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
