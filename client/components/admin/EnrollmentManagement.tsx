import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Users, 
  BookOpen, 
  GraduationCap, 
  Star, 
  Award, 
  Plus, 
  Trash2, 
  Edit, 
  Search,
  AlertTriangle,
  CheckCircle,
  TrendingUp
} from 'lucide-react';
import { motion as m } from 'framer-motion';
import { studentEnrollmentsApi, coursesApi, profilesApi } from '@/lib/api';
import { useAuth } from '@/context/auth';
import { useToast } from '@/hooks/use-toast';
import type { Course, StudentEnrollment, Profile } from '@/lib/supabase';

const ENROLLMENT_TYPES = {
  core: { label: 'Core', icon: BookOpen, color: 'bg-red-500', description: 'Mandatory core subjects' },
  major: { label: 'Major', icon: GraduationCap, color: 'bg-blue-500', description: 'Major specialization courses' },
  minor: { label: 'Minor', icon: Star, color: 'bg-green-500', description: 'Minor specialization courses' },
  elective: { label: 'Elective', icon: Plus, color: 'bg-purple-500', description: 'Optional elective courses' },
  value_add: { label: 'Value Added', icon: Award, color: 'bg-orange-500', description: 'Skill enhancement courses' }
};

interface EnrollmentStats {
  course_id: string;
  course: Course;
  total_enrolled: number;
  by_type: Record<string, number>;
}

export function EnrollmentManagement() {
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [enrollments, setEnrollments] = useState<StudentEnrollment[]>([]);
  const [enrollmentStats, setEnrollmentStats] = useState<EnrollmentStats[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [students, setStudents] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(false);
  const [statsLoading, setStatsLoading] = useState(false);
  
  // Filters
  const [semester, setSemester] = useState('Fall');
  const [year, setYear] = useState(new Date().getFullYear());
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCourse, setSelectedCourse] = useState('');
  const [selectedStudent, setSelectedStudent] = useState('');
  
  // New enrollment dialog
  const [showNewEnrollment, setShowNewEnrollment] = useState(false);
  const [newEnrollment, setNewEnrollment] = useState({
    student_id: '',
    course_id: '',
    enrollment_type: 'elective' as keyof typeof ENROLLMENT_TYPES
  });

  useEffect(() => {
    if (user?.role === 'admin') {
      fetchData();
      fetchStats();
    }
  }, [user?.role, semester, year]);

  const fetchData = async () => {
    setLoading(true);
    try {
      // Fetch enrollments
      const enrollmentsData = await studentEnrollmentsApi.getAll(semester, year);
      setEnrollments(enrollmentsData);

      // Fetch courses and students
      const [coursesData, studentsData] = await Promise.all([
        coursesApi.getAll(),
        profilesApi.getAll()
      ]);
      
      setCourses(coursesData.filter(c => c.semester === semester && c.year === year));
      setStudents(studentsData.filter(p => p.role === 'student'));
      
    } catch (error) {
      console.error('Error fetching enrollment data:', error);
      toast({
        title: 'Error',
        description: 'Failed to load enrollment data',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    setStatsLoading(true);
    try {
      const stats = await studentEnrollmentsApi.getEnrollmentStats(semester, year);
      setEnrollmentStats(stats);
    } catch (error) {
      console.error('Error fetching enrollment stats:', error);
    } finally {
      setStatsLoading(false);
    }
  };

  const handleCreateEnrollment = async () => {
    if (!newEnrollment.student_id || !newEnrollment.course_id) {
      toast({
        title: 'Error',
        description: 'Please select both student and course',
        variant: 'destructive'
      });
      return;
    }

    try {
      await studentEnrollmentsApi.enroll({
        student_id: newEnrollment.student_id,
        course_id: newEnrollment.course_id,
        semester,
        year,
        enrollment_type: newEnrollment.enrollment_type
      });

      toast({
        title: 'Success',
        description: 'Student enrolled successfully'
      });

      setShowNewEnrollment(false);
      setNewEnrollment({
        student_id: '',
        course_id: '',
        enrollment_type: 'elective'
      });
      
      await fetchData();
      await fetchStats();
    } catch (error) {
      console.error('Error creating enrollment:', error);
      toast({
        title: 'Error',
        description: 'Failed to enroll student. They may already be enrolled.',
        variant: 'destructive'
      });
    }
  };

  const handleDropEnrollment = async (enrollmentId: string) => {
    try {
      await studentEnrollmentsApi.drop(enrollmentId);
      toast({
        title: 'Success',
        description: 'Enrollment dropped successfully'
      });
      await fetchData();
      await fetchStats();
    } catch (error) {
      console.error('Error dropping enrollment:', error);
      toast({
        title: 'Error',
        description: 'Failed to drop enrollment',
        variant: 'destructive'
      });
    }
  };

  const handleUpdateEnrollmentType = async (enrollmentId: string, newType: keyof typeof ENROLLMENT_TYPES) => {
    try {
      await studentEnrollmentsApi.update(enrollmentId, {
        enrollment_type: newType
      });
      toast({
        title: 'Success',
        description: 'Enrollment type updated successfully'
      });
      await fetchData();
      await fetchStats();
    } catch (error) {
      console.error('Error updating enrollment:', error);
      toast({
        title: 'Error',
        description: 'Failed to update enrollment type',
        variant: 'destructive'
      });
    }
  };

  // Filter enrollments
  const filteredEnrollments = enrollments.filter(enrollment => {
    const matchesSearch = searchTerm === '' || 
      enrollment.student?.display_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      enrollment.course?.code?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      enrollment.course?.name?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesCourse = selectedCourse === '' || enrollment.course_id === selectedCourse;
    const matchesStudent = selectedStudent === '' || enrollment.student_id === selectedStudent;
    
    return matchesSearch && matchesCourse && matchesStudent;
  });

  const semesters = [
    { value: 'Fall', label: 'Fall Semester' },
    { value: 'Spring', label: 'Spring Semester' },
    { value: 'Summer', label: 'Summer Semester' }
  ];

  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 3 }, (_, i) => currentYear + i - 1);

  if (user?.role !== 'admin') {
    return (
      <Alert>
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>
          Access denied. Admin privileges required.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Enrollment Management
          </CardTitle>
          <CardDescription>
            Manage student enrollments across courses and semesters
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Filters */}
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
            <div className="space-y-2">
              <Label>Semester</Label>
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
              <Label>Academic Year</Label>
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

            <div className="space-y-2">
              <Label>Search</Label>
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Student name or course..."
                  className="pl-8"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Filter by Course</Label>
              <Select value={selectedCourse} onValueChange={setSelectedCourse}>
                <SelectTrigger>
                  <SelectValue placeholder="All courses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All courses</SelectItem>
                  {courses.map((course) => (
                    <SelectItem key={course.id} value={course.id}>
                      {course.code} - {course.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Actions</Label>
              <Dialog open={showNewEnrollment} onOpenChange={setShowNewEnrollment}>
                <DialogTrigger asChild>
                  <Button className="w-full">
                    <Plus className="h-4 w-4 mr-2" />
                    New Enrollment
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Create New Enrollment</DialogTitle>
                    <DialogDescription>
                      Enroll a student in a course for {semester} {year}
                    </DialogDescription>
                  </DialogHeader>
                  
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label>Student</Label>
                      <Select 
                        value={newEnrollment.student_id} 
                        onValueChange={(value) => setNewEnrollment(prev => ({ ...prev, student_id: value }))}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select student" />
                        </SelectTrigger>
                        <SelectContent>
                          {students.map((student) => (
                            <SelectItem key={student.id} value={student.id}>
                              {student.display_name || `${student.first_name} ${student.last_name}`}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label>Course</Label>
                      <Select 
                        value={newEnrollment.course_id} 
                        onValueChange={(value) => setNewEnrollment(prev => ({ ...prev, course_id: value }))}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select course" />
                        </SelectTrigger>
                        <SelectContent>
                          {courses.map((course) => (
                            <SelectItem key={course.id} value={course.id}>
                              {course.code} - {course.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label>Enrollment Type</Label>
                      <Select 
                        value={newEnrollment.enrollment_type} 
                        onValueChange={(value: keyof typeof ENROLLMENT_TYPES) => setNewEnrollment(prev => ({ ...prev, enrollment_type: value }))}
                      >
                        <SelectTrigger>
                          <SelectValue />
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
                  </div>

                  <DialogFooter>
                    <Button variant="outline" onClick={() => setShowNewEnrollment(false)}>
                      Cancel
                    </Button>
                    <Button onClick={handleCreateEnrollment}>
                      Create Enrollment
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Enrollment Statistics */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Course Enrollment Statistics
          </CardTitle>
          <CardDescription>
            Overview of enrollments by course for {semester} {year}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {statsLoading ? (
            <div className="text-center py-8 text-muted-foreground">Loading statistics...</div>
          ) : enrollmentStats.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">No enrollment data available</div>
          ) : (
            <div className="grid gap-4">
              {enrollmentStats.map((stat, index) => (
                <m.div
                  key={stat.course_id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="flex items-center justify-between p-4 border rounded-lg"
                >
                  <div className="flex-1">
                    <div className="font-medium">
                      {stat.course.code} - {stat.course.name}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      Max Capacity: {stat.course.max_students} students
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <div className="font-semibold text-lg">
                        {stat.total_enrolled}/{stat.course.max_students}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {Math.round((stat.total_enrolled / stat.course.max_students) * 100)}% Full
                      </div>
                    </div>
                    
                    <div className="flex gap-1">
                      {Object.entries(ENROLLMENT_TYPES).map(([type, typeInfo]) => {
                        const count = stat.by_type[type] || 0;
                        if (count === 0) return null;
                        
                        return (
                          <Badge 
                            key={type} 
                            variant="secondary" 
                            className="text-xs"
                            title={`${count} ${typeInfo.label} students`}
                          >
                            {count}
                          </Badge>
                        );
                      })}
                    </div>
                    
                    {stat.total_enrolled >= stat.course.max_students && (
                      <Badge variant="destructive">
                        <AlertTriangle className="h-3 w-3 mr-1" />
                        Full
                      </Badge>
                    )}
                  </div>
                </m.div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Enrollments List */}
      <Card>
        <CardHeader>
          <CardTitle>All Enrollments</CardTitle>
          <CardDescription>
            {filteredEnrollments.length} enrollment{filteredEnrollments.length !== 1 ? 's' : ''} found
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8 text-muted-foreground">Loading enrollments...</div>
          ) : filteredEnrollments.length === 0 ? (
            <div className="text-center py-8">
              <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">No enrollments found</h3>
              <p className="text-muted-foreground">
                {searchTerm || selectedCourse || selectedStudent
                  ? 'Try adjusting your filters'
                  : 'Create new enrollments to get started'
                }
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredEnrollments.map((enrollment, index) => {
                const typeInfo = ENROLLMENT_TYPES[enrollment.enrollment_type];
                const Icon = typeInfo.icon;
                
                return (
                  <m.div
                    key={enrollment.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50"
                  >
                    <div className="flex items-center gap-4 flex-1">
                      <div className={`w-3 h-3 rounded-full ${typeInfo.color}`} />
                      
                      <div className="flex-1">
                        <div className="font-medium">
                          {enrollment.student?.display_name || `${enrollment.student?.first_name} ${enrollment.student?.last_name}`}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {enrollment.course?.code} - {enrollment.course?.name}
                        </div>
                      </div>
                      
                      <div className="text-sm text-muted-foreground">
                        Credits: {enrollment.course?.credits}
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <Select
                        value={enrollment.enrollment_type}
                        onValueChange={(value: keyof typeof ENROLLMENT_TYPES) => handleUpdateEnrollmentType(enrollment.id, value)}
                      >
                        <SelectTrigger className="w-32">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {Object.entries(ENROLLMENT_TYPES).map(([key, type]) => {
                            const TypeIcon = type.icon;
                            return (
                              <SelectItem key={key} value={key}>
                                <div className="flex items-center gap-2">
                                  <TypeIcon className="h-3 w-3" />
                                  <span className="text-xs">{type.label}</span>
                                </div>
                              </SelectItem>
                            );
                          })}
                        </SelectContent>
                      </Select>
                      
                      <Badge variant={enrollment.status === 'enrolled' ? 'default' : 'secondary'}>
                        {enrollment.status}
                      </Badge>
                      
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDropEnrollment(enrollment.id)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </m.div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}