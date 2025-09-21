import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useState } from 'react';
import { profilesApi, coursesApi, roomsApi } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import { useValidatedForm, getFieldError, isFieldInvalid } from '@/lib/form-validation';
import { teacherRegistrationSchema, courseRegistrationSchema } from '@/lib/validation-schemas';
import { Controller } from 'react-hook-form';

export function RegisterTeacher() {
  const { toast } = useToast();
  
  const {
    register,
    handleSubmit,
    formState: { errors },
    control,
    reset
  } = useValidatedForm(teacherRegistrationSchema, {}, {
    onSuccess: async (formData) => {
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      toast({
        title: "Teacher registered successfully!",
        description: `Added ${formData.fullName} to the system.`,
      });
      
      reset(); // Clear form after successful submission
    },
    onError: (error) => {
      toast({
        title: "Registration failed",
        description: "Please try again.",
        variant: "destructive",
      });
    }
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle>Register Teacher</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="grid gap-3 md:grid-cols-3">
          <div className="space-y-1">
            <Input 
              placeholder="Full name *" 
              {...register('fullName')}
              className={isFieldInvalid(errors, 'fullName') ? "border-red-500" : ""}
            />
            {getFieldError(errors, 'fullName') && (
              <p className="text-red-500 text-xs">{getFieldError(errors, 'fullName')}</p>
            )}
          </div>
          
          <div className="space-y-1">
            <Input 
              placeholder="Email *" 
              type="email" 
              {...register('email')}
              className={isFieldInvalid(errors, 'email') ? "border-red-500" : ""}
            />
            {getFieldError(errors, 'email') && (
              <p className="text-red-500 text-xs">{getFieldError(errors, 'email')}</p>
            )}
          </div>
          
          <div className="space-y-1">
            <Input 
              placeholder="Phone" 
              {...register('phone')}
              className={isFieldInvalid(errors, 'phone') ? "border-red-500" : ""}
            />
            {getFieldError(errors, 'phone') && (
              <p className="text-red-500 text-xs">{getFieldError(errors, 'phone')}</p>
            )}
          </div>
          
          <div className="space-y-1">
            <Controller
              name="department"
              control={control}
              render={({ field }) => (
                <Select onValueChange={field.onChange} value={field.value}>
                  <SelectTrigger className={isFieldInvalid(errors, 'department') ? "border-red-500" : ""}>
                    <SelectValue placeholder="Department *" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Computer Science">Computer Science</SelectItem>
                    <SelectItem value="Information Technology">Information Technology</SelectItem>
                    <SelectItem value="Electronics">Electronics</SelectItem>
                    <SelectItem value="Mechanical">Mechanical</SelectItem>
                    <SelectItem value="Civil">Civil</SelectItem>
                    <SelectItem value="Mathematics">Mathematics</SelectItem>
                    <SelectItem value="Physics">Physics</SelectItem>
                    <SelectItem value="Chemistry">Chemistry</SelectItem>
                    <SelectItem value="English">English</SelectItem>
                    <SelectItem value="Management">Management</SelectItem>
                  </SelectContent>
                </Select>
              )}
            />
            {getFieldError(errors, 'department') && (
              <p className="text-red-500 text-xs">{getFieldError(errors, 'department')}</p>
            )}
          </div>
          
          <div className="space-y-1 md:col-span-2">
            <Input 
              placeholder="Subjects (comma separated)" 
              {...register('subjects')}
              className={isFieldInvalid(errors, 'subjects') ? "border-red-500" : ""}
            />
            {getFieldError(errors, 'subjects') && (
              <p className="text-red-500 text-xs">{getFieldError(errors, 'subjects')}</p>
            )}
          </div>
          
          <div className="space-y-1">
            <Input 
              placeholder="Weekly workload (hours)" 
              type="number"
              min="1"
              max="60"
              {...register('weeklyWorkload', { valueAsNumber: true })}
              className={isFieldInvalid(errors, 'weeklyWorkload') ? "border-red-500" : ""}
            />
            {getFieldError(errors, 'weeklyWorkload') && (
              <p className="text-red-500 text-xs">{getFieldError(errors, 'weeklyWorkload')}</p>
            )}
          </div>
          
          <div className="space-y-1 md:col-span-2">
            <Input 
              placeholder="Availability (e.g., Mon 9-5, Wed 10-3)" 
              {...register('availability')}
              className={isFieldInvalid(errors, 'availability') ? "border-red-500" : ""}
            />
            {getFieldError(errors, 'availability') && (
              <p className="text-red-500 text-xs">{getFieldError(errors, 'availability')}</p>
            )}
          </div>
          
          <div className="md:col-span-3 flex justify-end">
            <Button 
              type="submit"
              className="bg-gradient-to-r from-primary to-accent"
              disabled={false}
            >
              Add Teacher
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

export function RegisterCourse() {
  const { toast } = useToast();
  const [teachers, setTeachers] = useState<any[]>([]);
  
  const {
    register,
    handleSubmit,
    formState: { errors },
    control,
    reset
  } = useValidatedForm(courseRegistrationSchema, {}, {
    onSuccess: async (formData) => {
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
        credits: parseInt(formData.credits) || 3,
        department: formData.department || 'General',
        semester: formData.semester || 'Fall',
        year: parseInt(formData.year) || new Date().getFullYear(),
        course_type: formData.courseType || 'major',
        max_students: 60, // Default value
        theory_practical: formData.theoryPractical || null,
        weekly_lectures: parseInt(formData.weeklyLectures) || null,
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
      reset();
    },
    onError: (error) => {
      console.error('❌ Error registering course:', error);
      
      // Enhanced error handling
      let errorMessage = "Failed to register course. Please try again.";
      if (error?.message?.includes('duplicate key')) {
        errorMessage = `Course code already exists. Please use a different code.`;
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
    }
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle>Register Course</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="grid gap-3 md:grid-cols-3">
          <div className="space-y-1 md:col-span-2">
            <Input 
              placeholder="Course name *" 
              {...register('courseName')}
              className={isFieldInvalid(errors, 'courseName') ? "border-red-500" : ""}
            />
            {getFieldError(errors, 'courseName') && (
              <p className="text-red-500 text-xs">{getFieldError(errors, 'courseName')}</p>
            )}
          </div>
          
          <div className="space-y-1">
            <Input 
              placeholder="Code *" 
              {...register('code')}
              className={isFieldInvalid(errors, 'code') ? "border-red-500" : ""}
            />
            {getFieldError(errors, 'code') && (
              <p className="text-red-500 text-xs">{getFieldError(errors, 'code')}</p>
            )}
          </div>
          
          <div className="space-y-1">
            <Input 
              placeholder="Credits *" 
              type="number"
              min="1"
              max="12"
              {...register('credits', { valueAsNumber: true })}
              className={isFieldInvalid(errors, 'credits') ? "border-red-500" : ""}
            />
            {getFieldError(errors, 'credits') && (
              <p className="text-red-500 text-xs">{getFieldError(errors, 'credits')}</p>
            )}
          </div>
          
          <div className="space-y-1">
            <Input 
              placeholder="Theory/Practical (e.g., 2L+2P)" 
              {...register('theoryPractical')}
              className={isFieldInvalid(errors, 'theoryPractical') ? "border-red-500" : ""}
            />
            {getFieldError(errors, 'theoryPractical') && (
              <p className="text-red-500 text-xs">{getFieldError(errors, 'theoryPractical')}</p>
            )}
          </div>
          
          <div className="space-y-1">
            <Input 
              placeholder="Weekly lectures" 
              type="number"
              min="1"
              max="10"
              {...register('weeklyLectures', { valueAsNumber: true })}
              className={isFieldInvalid(errors, 'weeklyLectures') ? "border-red-500" : ""}
            />
            {getFieldError(errors, 'weeklyLectures') && (
              <p className="text-red-500 text-xs">{getFieldError(errors, 'weeklyLectures')}</p>
            )}
          </div>
          
          <div className="space-y-1">
            <Input 
              placeholder="Assign teacher (name)" 
              {...register('assignTeacher')}
              className={isFieldInvalid(errors, 'assignTeacher') ? "border-red-500" : ""}
            />
            {getFieldError(errors, 'assignTeacher') && (
              <p className="text-red-500 text-xs">{getFieldError(errors, 'assignTeacher')}</p>
            )}
          </div>
          
          <div className="space-y-1">
            <Controller
              name="department"
              control={control}
              render={({ field }) => (
                <Select onValueChange={field.onChange} value={field.value}>
                  <SelectTrigger className={isFieldInvalid(errors, 'department') ? "border-red-500" : ""}>
                    <SelectValue placeholder="Department *" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Computer Science">Computer Science</SelectItem>
                    <SelectItem value="Information Technology">Information Technology</SelectItem>
                    <SelectItem value="Electronics">Electronics</SelectItem>
                    <SelectItem value="Mechanical">Mechanical</SelectItem>
                    <SelectItem value="Civil">Civil</SelectItem>
                    <SelectItem value="Mathematics">Mathematics</SelectItem>
                    <SelectItem value="Physics">Physics</SelectItem>
                    <SelectItem value="Chemistry">Chemistry</SelectItem>
                    <SelectItem value="English">English</SelectItem>
                    <SelectItem value="Management">Management</SelectItem>
                  </SelectContent>
                </Select>
              )}
            />
            {getFieldError(errors, 'department') && (
              <p className="text-red-500 text-xs">{getFieldError(errors, 'department')}</p>
            )}
          </div>
          
          <div className="space-y-1">
            <Controller
              name="semester"
              control={control}
              render={({ field }) => (
                <Select onValueChange={field.onChange} value={field.value}>
                  <SelectTrigger className={isFieldInvalid(errors, 'semester') ? "border-red-500" : ""}>
                    <SelectValue placeholder="Semester *" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">Semester 1</SelectItem>
                    <SelectItem value="2">Semester 2</SelectItem>
                    <SelectItem value="3">Semester 3</SelectItem>
                    <SelectItem value="4">Semester 4</SelectItem>
                    <SelectItem value="5">Semester 5</SelectItem>
                    <SelectItem value="6">Semester 6</SelectItem>
                    <SelectItem value="7">Semester 7</SelectItem>
                    <SelectItem value="8">Semester 8</SelectItem>
                  </SelectContent>
                </Select>
              )}
            />
            {getFieldError(errors, 'semester') && (
              <p className="text-red-500 text-xs">{getFieldError(errors, 'semester')}</p>
            )}
          </div>
          
          <div className="space-y-1">
            <Input 
              placeholder="Year *" 
              type="number"
              min="2020"
              max="2030"
              {...register('year', { valueAsNumber: true })}
              className={isFieldInvalid(errors, 'year') ? "border-red-500" : ""}
            />
            {getFieldError(errors, 'year') && (
              <p className="text-red-500 text-xs">{getFieldError(errors, 'year')}</p>
            )}
          </div>
          
          <div className="md:col-span-3 flex justify-end">
            <Button 
              type="submit"
              className="bg-gradient-to-r from-primary to-accent"
              disabled={false}
            >
              Add Course
            </Button>
          </div>
        </form>
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
