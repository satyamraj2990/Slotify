import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { Label } from '@/components/ui/label';
import { Trash2, Plus, BookOpen, GraduationCap, Star, Award } from 'lucide-react';
import { motion as m } from 'framer-motion';
import { studentEnrollmentsApi, coursesApi } from '@/lib/api';
import { useAuth } from '@/context/auth';
import { useToast } from '@/hooks/use-toast';
import type { Course, StudentEnrollment } from '@/lib/supabase';

const ENROLLMENT_TYPES = {
  core: { label: 'Core', icon: BookOpen, color: 'bg-red-500', description: 'Mandatory core subjects' },
  major: { label: 'Major', icon: GraduationCap, color: 'bg-blue-500', description: 'Major specialization courses' },
  minor: { label: 'Minor', icon: Star, color: 'bg-green-500', description: 'Minor specialization courses' },
  elective: { label: 'Elective', icon: Plus, color: 'bg-purple-500', description: 'Optional elective courses' },
  value_add: { label: 'Value Added', icon: Award, color: 'bg-orange-500', description: 'Skill enhancement courses' }
};

interface SubjectSelectionProps {
  semester?: string;
  year?: number;
}

export default function SubjectSelection({ 
  semester: propSemester, 
  year: propYear 
}: SubjectSelectionProps) {
  const { user, profile } = useAuth();
  const { toast } = useToast();
  
  const [semester, setSemester] = useState(propSemester || 'Fall');
  const [year, setYear] = useState(propYear || new Date().getFullYear());
  const [selectedCourse, setSelectedCourse] = useState('');
  const [selectedType, setSelectedType] = useState<keyof typeof ENROLLMENT_TYPES>('elective');
  const [availableCourses, setAvailableCourses] = useState<Course[]>([]);
  const [enrollments, setEnrollments] = useState<StudentEnrollment[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Fetch data when component mounts or filters change
  useEffect(() => {
    if (user?.id) {
      fetchData();
    }
  }, [user?.id, semester, year]);

  const fetchData = async () => {
    if (!user?.id) return;
    
    setLoading(true);
    try {
      // Try to get enrollments (may fail if table doesn't exist)
      let enrollmentsData = [];
      try {
        enrollmentsData = await studentEnrollmentsApi.getByStudent(user.id, semester, year);
      } catch (enrollmentError) {
        console.warn('Could not fetch enrollments (table may not exist):', enrollmentError);
      }
      
      // Try to get available courses with fallback
      let availableCoursesData = [];
      try {
        availableCoursesData = await studentEnrollmentsApi.getAvailableCourses(user.id, semester, year);
      } catch (courseError) {
        console.warn('Could not fetch available courses, using fallback:', courseError);
        // Fallback: get all courses for this semester/year
        const allCourses = await coursesApi.getAll();
        availableCoursesData = allCourses.filter(c => c.semester === semester && c.year === year);
      }
      
      setEnrollments(enrollmentsData);
      setAvailableCourses(availableCoursesData);
      
      if (availableCoursesData.length === 0) {
        toast({
          title: 'No Courses Available',
          description: `No courses found for ${semester} ${year}. Please contact admin to add courses.`,
        });
      }
    } catch (error) {
      console.error('Error fetching data:', error);
      
      toast({
        title: 'Database Connection Error',
        description: 'Could not connect to database. Please run the setup script in Supabase.',
        variant: 'destructive'
      });
      
      // Set fallback data to prevent blank screen
      setAvailableCourses([]);
      setEnrollments([]);
    } finally {
      setLoading(false);
    }
  };

  const handleEnroll = async () => {
    if (!selectedCourse || !user?.id) return;
    
    setSubmitting(true);
    try {
      await studentEnrollmentsApi.enroll({
        student_id: user.id,
        course_id: selectedCourse,
        semester,
        year,
        enrollment_type: selectedType
      });
      
      toast({
        title: 'Success',
        description: 'Successfully enrolled in course'
      });
      
      // Reset form and refresh data
      setSelectedCourse('');
      await fetchData();
      
    } catch (error) {
      console.error('Error enrolling:', error);
      toast({
        title: 'Error',
        description: 'Failed to enroll in course. You may already be enrolled.',
        variant: 'destructive'
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDrop = async (enrollmentId: string) => {
    try {
      await studentEnrollmentsApi.drop(enrollmentId);
      toast({
        title: 'Success',
        description: 'Successfully dropped course'
      });
      await fetchData();
    } catch (error) {
      console.error('Error dropping course:', error);
      toast({
        title: 'Error',
        description: 'Failed to drop course',
        variant: 'destructive'
      });
    }
  };

  const semesters = [
    { value: 'Fall', label: 'Fall Semester' },
    { value: 'Spring', label: 'Spring Semester' },
    { value: 'Summer', label: 'Summer Semester' }
  ];

  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 3 }, (_, i) => currentYear + i - 1);

  const selectedCourseData = availableCourses.find(c => c.id === selectedCourse);

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BookOpen className="h-5 w-5" />
            Subject Selection
          </CardTitle>
          <CardDescription>
            Select your subjects for the semester. Choose from core, major, minor, elective, and value-added courses.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Semester and Year Selection */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div className="space-y-2">
              <Label htmlFor="semester">Semester</Label>
              <Select value={semester} onValueChange={setSemester}>
                <SelectTrigger>
                  <SelectValue placeholder="Select semester" />
                </SelectTrigger>
                <SelectContent>
                  {semesters.map((sem) => (
                    <SelectItem key={sem.value} value={sem.value}>
                      {sem.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="year">Academic Year</Label>
              <Select value={year.toString()} onValueChange={(value) => setYear(parseInt(value))}>
                <SelectTrigger>
                  <SelectValue placeholder="Select year" />
                </SelectTrigger>
                <SelectContent>
                  {years.map((yr) => (
                    <SelectItem key={yr} value={yr.toString()}>
                      {yr}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <Separator className="my-6" />

          {/* Course Selection */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Add New Course</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="course">Available Courses</Label>
                <Select value={selectedCourse} onValueChange={setSelectedCourse}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a course" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableCourses.map((course) => (
                      <SelectItem key={course.id} value={course.id}>
                        <div className="flex flex-col">
                          <span className="font-medium">{course.code}</span>
                          <span className="text-sm text-muted-foreground">{course.name}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {availableCourses.length === 0 && !loading && (
                  <p className="text-sm text-muted-foreground">No available courses for this semester</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="type">Enrollment Type</Label>
                <Select value={selectedType} onValueChange={(value: keyof typeof ENROLLMENT_TYPES) => setSelectedType(value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(ENROLLMENT_TYPES).map(([key, type]) => {
                      const Icon = type.icon;
                      return (
                        <SelectItem key={key} value={key}>
                          <div className="flex items-center gap-2">
                            <Icon className="h-4 w-4" />
                            <span>{type.label}</span>
                          </div>
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-end">
                <Button 
                  onClick={handleEnroll}
                  disabled={!selectedCourse || submitting || loading}
                  className="w-full"
                >
                  {submitting ? 'Enrolling...' : 'Enroll'}
                </Button>
              </div>
            </div>

            {/* Course Preview */}
            {selectedCourseData && (
              <Alert>
                <BookOpen className="h-4 w-4" />
                <AlertDescription>
                  <div className="space-y-1">
                    <div className="font-medium">{selectedCourseData.code} - {selectedCourseData.name}</div>
                    <div className="text-sm text-muted-foreground">
                      Credits: {selectedCourseData.credits} | Department: {selectedCourseData.department}
                    </div>
                    <div className="text-sm">
                      <span className="font-medium">Type:</span> {ENROLLMENT_TYPES[selectedType].description}
                    </div>
                  </div>
                </AlertDescription>
              </Alert>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Current Enrollments */}
      <Card>
        <CardHeader>
          <CardTitle>My Selected Courses</CardTitle>
          <CardDescription>
            Courses you have selected for {semester} {year}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">
              <div className="text-muted-foreground">Loading courses...</div>
            </div>
          ) : enrollments.length === 0 ? (
            <div className="text-center py-8">
              <BookOpen className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">No courses selected</h3>
              <p className="text-muted-foreground">Select courses from the dropdown above to get started</p>
            </div>
          ) : (
            <div className="space-y-4">
              {Object.entries(
                enrollments.reduce((acc, enrollment) => {
                  const type = enrollment.enrollment_type;
                  if (!acc[type]) acc[type] = [];
                  acc[type].push(enrollment);
                  return acc;
                }, {} as Record<string, StudentEnrollment[]>)
              ).map(([type, typeEnrollments]) => {
                const typeInfo = ENROLLMENT_TYPES[type as keyof typeof ENROLLMENT_TYPES];
                const Icon = typeInfo.icon;
                
                return (
                  <div key={type}>
                    <div className="flex items-center gap-2 mb-3">
                      <Icon className="h-4 w-4" />
                      <h4 className="font-medium">{typeInfo.label} Courses</h4>
                      <Badge variant="secondary">{typeEnrollments.length}</Badge>
                    </div>
                    
                    <div className="grid gap-3">
                      {typeEnrollments.map((enrollment, index) => (
                        <m.div
                          key={enrollment.id}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: index * 0.1 }}
                          className="flex items-center justify-between p-4 border rounded-lg bg-card"
                        >
                          <div className="flex-1">
                            <div className="flex items-center gap-3">
                              <div className={`w-3 h-3 rounded-full ${typeInfo.color}`} />
                              <div>
                                <h5 className="font-medium">
                                  {enrollment.course?.code} - {enrollment.course?.name}
                                </h5>
                                <div className="text-sm text-muted-foreground">
                                  Credits: {enrollment.course?.credits} | Department: {enrollment.course?.department}
                                </div>
                              </div>
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-2">
                            <Badge variant={enrollment.status === 'enrolled' ? 'default' : 'secondary'}>
                              {enrollment.status}
                            </Badge>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleDrop(enrollment.id)}
                              className="text-red-600 hover:text-red-700"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </m.div>
                      ))}
                    </div>
                  </div>
                );
              })}
              
              {/* Summary */}
              <Separator />
              <div className="flex justify-between items-center text-sm">
                <span className="font-medium">Total Courses Selected:</span>
                <Badge variant="outline">{enrollments.length}</Badge>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="font-medium">Total Credits:</span>
                <Badge variant="outline">
                  {enrollments.reduce((sum, e) => sum + (e.course?.credits || 0), 0)}
                </Badge>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}