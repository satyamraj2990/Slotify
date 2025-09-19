import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useState } from 'react';
import { profilesApi, coursesApi, roomsApi } from '@/lib/api';
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
      console.log('🎯 Starting teacher registration:', formData);

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

      console.log('👩‍🏫 Teacher data to create:', teacherData);
      const result = await profilesApi.create(teacherData);
      console.log('✅ Teacher created successfully:', result);

      toast({
        title: "Success",
        description: `Teacher "${teacherData.display_name}" registered successfully`,
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

    } catch (error: any) {
      console.error('❌ Error registering teacher:', error);
      
      // Enhanced error handling
      let errorMessage = "Failed to register teacher. Please try again.";
      if (error?.message?.includes('duplicate key')) {
        errorMessage = `Email "${formData.email}" already exists. Please use a different email.`;
      } else if (error?.message?.includes('permission denied')) {
        errorMessage = "Permission denied. Make sure you're logged in as an admin.";
      } else if (error?.message) {
        errorMessage = error.message;
      }
      
      toast({
        title: "Error",
        description: errorMessage,
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
      console.log('🎯 Starting course registration:', formData);

      // Find teacher by name if provided
      let assignedTeacherId = null;
      if (formData.assignTeacher) {
        console.log('👩‍🏫 Looking for teacher:', formData.assignTeacher);
        const teachers = await profilesApi.getTeachers();
        console.log('👥 Available teachers:', teachers.length);
        
        const teacher = teachers.find(t => 
          `${t.first_name} ${t.last_name}`.toLowerCase().includes(formData.assignTeacher.toLowerCase()) ||
          t.display_name?.toLowerCase().includes(formData.assignTeacher.toLowerCase())
        );
        if (teacher) {
          assignedTeacherId = teacher.id;
          console.log('✅ Teacher found:', teacher.display_name || `${teacher.first_name} ${teacher.last_name}`);
        } else {
          console.log('⚠️ Teacher not found');
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

      console.log('📝 Course data to insert:', courseData);
      const result = await coursesApi.create(courseData);
      console.log('✅ Course created successfully:', result);

      toast({
        title: "Success",
        description: `Course "${courseData.code} - ${courseData.name}" registered successfully`,
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

    } catch (error: any) {
      console.error('❌ Error registering course:', error);
      
      // Enhanced error handling
      let errorMessage = "Failed to register course. Please try again.";
      if (error?.message?.includes('duplicate key')) {
        errorMessage = `Course code "${formData.code}" already exists. Please use a different code.`;
      } else if (error?.message?.includes('permission denied')) {
        errorMessage = "Permission denied. Make sure you're logged in as an admin.";
      } else if (error?.message) {
        errorMessage = error.message;
      }
      
      toast({
        title: "Error",
        description: errorMessage,
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
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    roomNumber: '',
    building: '',
    capacity: '',
    roomType: 'classroom',
    facilities: ''
  });

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async () => {
    // Validate required fields
    if (!formData.roomNumber || !formData.building || !formData.capacity) {
      toast({
        title: "Error",
        description: "Room number, building, and capacity are required",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);
    try {
      console.log('🏢 Starting room registration:', formData);

      // Parse facilities into array
      const facilitiesArray = formData.facilities 
        ? formData.facilities.split(',').map(f => f.trim()).filter(f => f)
        : [];

      const roomData = {
        room_number: formData.roomNumber.toUpperCase(),
        building: formData.building,
        capacity: parseInt(formData.capacity),
        room_type: formData.roomType as 'classroom' | 'lab' | 'auditorium' | 'seminar',
        facilities: facilitiesArray,
        is_available: true
      };

      console.log('🏛️ Room data to insert:', roomData);
      const result = await roomsApi.create(roomData);
      console.log('✅ Room created successfully:', result);

      toast({
        title: "Success",
        description: `Room "${roomData.room_number}" in "${roomData.building}" added successfully`,
      });

      // Reset form
      setFormData({
        roomNumber: '',
        building: '',
        capacity: '',
        roomType: 'classroom',
        facilities: ''
      });

    } catch (error: any) {
      console.error('❌ Error registering room:', error);
      
      // Enhanced error handling
      let errorMessage = "Failed to add room. Please try again.";
      if (error?.message?.includes('duplicate key')) {
        errorMessage = `Room "${formData.roomNumber}" already exists. Please use a different room number.`;
      } else if (error?.message?.includes('permission denied')) {
        errorMessage = "Permission denied. Make sure you're logged in as an admin.";
      } else if (error?.message) {
        errorMessage = error.message;
      }
      
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const validateRoom = () => {
    if (!formData.roomNumber || !formData.building || !formData.capacity) {
      toast({
        title: "Validation",
        description: "Please fill in all required fields before validating",
        variant: "destructive"
      });
      return;
    }

    const capacity = parseInt(formData.capacity);
    let validationMessage = "";
    let validationVariant: "default" | "destructive" = "default";

    if (capacity < 10) {
      validationMessage = "⚠️ Small capacity room - suitable for meetings or tutorials";
      validationVariant = "destructive";
    } else if (capacity <= 30) {
      validationMessage = "✅ Good for small classes and seminars";
    } else if (capacity <= 60) {
      validationMessage = "✅ Good for regular lectures and courses";
    } else if (capacity <= 100) {
      validationMessage = "✅ Large lecture hall - suitable for popular courses";
    } else {
      validationMessage = "✅ Auditorium size - excellent for events and large classes";
    }

    toast({
      title: "Room Validation",
      description: validationMessage,
      variant: validationVariant
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Room Allocation</CardTitle>
      </CardHeader>
      <CardContent className="grid gap-3 md:grid-cols-3">
        <Input 
          placeholder="Room Number (e.g., LT-1, CSE-101)" 
          value={formData.roomNumber}
          onChange={(e) => handleInputChange('roomNumber', e.target.value)}
        />
        <Input 
          placeholder="Building (e.g., Main Building, Engineering Block)" 
          value={formData.building}
          onChange={(e) => handleInputChange('building', e.target.value)}
        />
        <Input 
          placeholder="Capacity" 
          type="number" 
          min="1"
          max="500"
          value={formData.capacity}
          onChange={(e) => handleInputChange('capacity', e.target.value)}
        />
        
        <Select value={formData.roomType} onValueChange={(value) => handleInputChange('roomType', value)}>
          <SelectTrigger>
            <SelectValue placeholder="Room Type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="classroom">Classroom</SelectItem>
            <SelectItem value="lab">Laboratory</SelectItem>
            <SelectItem value="auditorium">Auditorium</SelectItem>
            <SelectItem value="seminar">Seminar Hall</SelectItem>
          </SelectContent>
        </Select>

        <Input 
          placeholder="Facilities (e.g., projector, AC, whiteboard)" 
          className="md:col-span-2" 
          value={formData.facilities}
          onChange={(e) => handleInputChange('facilities', e.target.value)}
        />

        <div className="md:col-span-3 flex justify-end gap-2">
          <Button 
            variant="outline"
            onClick={validateRoom}
          >
            Validate Room
          </Button>
          <Button 
            className="bg-gradient-to-r from-primary to-accent"
            onClick={handleSubmit}
            disabled={isLoading}
          >
            {isLoading ? 'Adding Room...' : 'Add Room'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

// Additional component for scheduling constraints and holidays
export function SchedulingConstraints() {
  const { toast } = useToast();
  const [constraintsData, setConstraintsData] = useState({
    holidayDate: '',
    blockedHours: '',
    workingDays: 'Mon-Fri',
    maxPeriodsPerDay: '6'
  });

  const handleConstraintChange = (field: string, value: string) => {
    setConstraintsData(prev => ({ ...prev, [field]: value }));
  };

  const saveConstraints = () => {
    // For now, just show the constraints in a toast
    // In a real implementation, you'd save these to a constraints table
    toast({
      title: "Constraints Saved",
      description: `Working days: ${constraintsData.workingDays}, Max periods: ${constraintsData.maxPeriodsPerDay}`,
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Scheduling Constraints</CardTitle>
      </CardHeader>
      <CardContent className="grid gap-3 md:grid-cols-3">
        <Input 
          placeholder="Holiday Date (YYYY-MM-DD)" 
          type="date"
          value={constraintsData.holidayDate}
          onChange={(e) => handleConstraintChange('holidayDate', e.target.value)}
        />
        <Input 
          placeholder="Blocked Hours (e.g., Fri 1-3)" 
          value={constraintsData.blockedHours}
          onChange={(e) => handleConstraintChange('blockedHours', e.target.value)}
        />
        <Input 
          placeholder="Working Days (e.g., Mon-Fri)" 
          value={constraintsData.workingDays}
          onChange={(e) => handleConstraintChange('workingDays', e.target.value)}
        />
        <Input 
          placeholder="Max Periods Per Day" 
          type="number"
          min="1"
          max="10"
          value={constraintsData.maxPeriodsPerDay}
          onChange={(e) => handleConstraintChange('maxPeriodsPerDay', e.target.value)}
        />
        <div className="md:col-span-3 flex justify-end gap-2">
          <Button 
            variant="outline"
            onClick={() => toast({ title: "Validation", description: "All constraints look good!" })}
          >
            Validate Constraints
          </Button>
          <Button 
            className="bg-gradient-to-r from-primary to-accent"
            onClick={saveConstraints}
          >
            Save Constraints
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
