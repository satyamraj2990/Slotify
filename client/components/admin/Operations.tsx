import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertTriangle, Clock, MapPin, User, CheckCircle, X, RefreshCw, Zap } from "lucide-react";
import { motion as m } from "framer-motion";
import { useState, useEffect } from "react";
import { emergencyReallocationApi } from "@/lib/api";
import { useAuth } from "@/context/auth";
import { useToast } from "@/hooks/use-toast";
import { DisruptedClass, EmergencyReallocation } from "@/lib/supabase";

export function EnergyOptimizationPanel() {
  const unused = [
    { room: "LT-3", reason: "No classes 2pm-5pm" },
    { room: "PHY-Lab", reason: "Maintenance day" },
    { room: "Seminar-2", reason: "Free all day" },
  ];
  return (
    <Card>
      <CardHeader>
        <CardTitle>Energy Optimization</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {unused.map((u, i) => (
          <m.div key={u.room} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.05 }} className="flex items-center justify-between rounded-md border border-pink-500/30 bg-pink-500/10 p-3">
            <div>
              <div className="font-medium">{u.room}</div>
              <div className="text-xs text-muted-foreground">{u.reason}</div>
            </div>
            <Button variant="outline" className="hover:shadow-[0_0_24px_rgba(255,20,147,0.6)]">Shut utilities</Button>
          </m.div>
        ))}
      </CardContent>
    </Card>
  );
}

// Simple Emergency Reallocation Panel with proper colors
export function SimpleEmergencyReallocationPanel() {
  const cancelled = [
    { course: "MAT-202", time: "Tue 12:00", reason: "Faculty sick" },
  ];
  return (
    <Card>
      <CardHeader>
        <CardTitle>Emergency Reallocation</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {cancelled.map((c, i) => (
          <m.div key={c.course} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.05 }} className="flex items-center justify-between rounded-md border border-orange-500/30 bg-orange-500/10 p-3">
            <div>
              <div className="font-medium">{c.course} • {c.time}</div>
              <div className="text-xs text-muted-foreground">{c.reason}</div>
            </div>
            <div className="flex gap-2">
              <Button className="bg-gradient-to-r from-primary to-accent">Auto reallocate</Button>
              <Button variant="outline" className="hover:shadow-[0_0_24px_rgba(255,165,0,0.6)]">Pick substitute</Button>
            </div>
          </m.div>
        ))}
      </CardContent>
    </Card>
  );
}

export function EmergencyReallocationPanel() {
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [disruptedClasses, setDisruptedClasses] = useState<DisruptedClass[]>([]);
  const [reallocations, setReallocations] = useState<EmergencyReallocation[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeClass, setActiveClass] = useState<DisruptedClass | null>(null);
  const [showReallocationDialog, setShowReallocationDialog] = useState(false);
  const [alternativeOptions, setAlternativeOptions] = useState({
    teachers: [] as any[],
    rooms: [] as any[],
    timeSlots: [] as any[]
  });
  const [selectedOption, setSelectedOption] = useState({
    teacher: '',
    room: '',
    timeSlot: ''
  });
  const [reason, setReason] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const fetchDisruptedClasses = async () => {
    try {
      setLoading(true);
      
      // In a real implementation, this would:
      // 1. Query approved leave requests for today/upcoming days
      // 2. Find corresponding timetable entries
      // 3. Check for room availability issues
      // 4. Identify emergency situations
      
      // For demo purposes, we'll show realistic emergency scenarios
      const today = new Date();
      const mockDisrupted: DisruptedClass[] = [
        {
          id: "disrupted-1",
          course: { 
            id: "c1", 
            code: "MAT-202", 
            name: "Advanced Mathematics", 
            credits: 3, 
            department: "Mathematics", 
            semester: "Fall", 
            year: 2024, 
            course_type: "major", 
            max_students: 60, 
            created_at: "", 
            updated_at: "" 
          },
          teacher: { 
            id: "t1", 
            email: "prof.sharma@uni.edu", 
            role: "teacher", 
            first_name: "Dr.", 
            last_name: "Sharma", 
            display_name: "Dr. Sharma", 
            department: "Mathematics", 
            created_at: "", 
            updated_at: "" 
          },
          room: { 
            id: "r1", 
            room_number: "LT-3", 
            building: "Main Block", 
            capacity: 60, 
            room_type: "classroom", 
            facilities: ["projector", "ac"], 
            is_available: true, 
            created_at: "", 
            updated_at: "" 
          },
          day_of_week: 2, // Tuesday
          start_time: "10:00:00",
          end_time: "11:00:00",
          disruption_reason: "Teacher on approved medical leave - Leave ID #12345"
        },
        {
          id: "disrupted-2",
          course: { 
            id: "c2", 
            code: "CSE-301", 
            name: "Data Structures & Algorithms", 
            credits: 4, 
            department: "Computer Science", 
            semester: "Fall", 
            year: 2024, 
            course_type: "major", 
            max_students: 40, 
            created_at: "", 
            updated_at: "" 
          },
          teacher: { 
            id: "t2", 
            email: "dr.patel@uni.edu", 
            role: "teacher", 
            first_name: "Dr.", 
            last_name: "Patel", 
            display_name: "Dr. Patel", 
            department: "Computer Science", 
            created_at: "", 
            updated_at: "" 
          },
          room: { 
            id: "r2", 
            room_number: "CS-Lab-1", 
            building: "Tech Block", 
            capacity: 40, 
            room_type: "lab", 
            facilities: ["computers", "projector"], 
            is_available: false, 
            created_at: "", 
            updated_at: "" 
          },
          day_of_week: 3, // Wednesday
          start_time: "14:00:00",
          end_time: "16:00:00",
          disruption_reason: "Emergency maintenance - AC system failure affecting lab computers"
        }
      ];
      
      // Simulate loading delay for realistic experience
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setDisruptedClasses(mockDisrupted);
    } catch (error) {
      console.error('Error fetching disrupted classes:', error);
      toast({
        title: "Error",
        description: "Failed to load disrupted classes",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const findAlternatives = async (disruptedClass: DisruptedClass) => {
    setActiveClass(disruptedClass);
    setLoading(true);
    
    try {
      // Simulate finding alternatives
      const mockTeachers = [
        { id: "sub1", first_name: "Dr.", last_name: "Kumar", display_name: "Dr. Kumar", department: disruptedClass.course.department },
        { id: "sub2", first_name: "Prof.", last_name: "Singh", display_name: "Prof. Singh", department: disruptedClass.course.department }
      ];
      
      const mockRooms = [
        { id: "alt1", room_number: "LT-5", building: "Main Block", capacity: 80, room_type: "classroom" },
        { id: "alt2", room_number: "Seminar-2", building: "Admin Block", capacity: 45, room_type: "classroom" }
      ];
      
      const mockTimeSlots = [
        { day_of_week: 2, start_time: "11:00:00", end_time: "12:00:00", day_name: "Tuesday" },
        { day_of_week: 4, start_time: "10:00:00", end_time: "11:00:00", day_name: "Thursday" }
      ];
      
      setAlternativeOptions({
        teachers: mockTeachers,
        rooms: mockRooms,
        timeSlots: mockTimeSlots
      });
      
      setShowReallocationDialog(true);
    } catch (error) {
      console.error('Error finding alternatives:', error);
      toast({
        title: "Error",
        description: "Failed to find alternatives",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const autoReallocate = async (disruptedClass: DisruptedClass) => {
    if (!user) return;
    
    setSubmitting(true);
    try {
      // Simulate auto reallocation by picking best alternatives
      await findAlternatives(disruptedClass);
      
      // Auto-select first available options
      setTimeout(() => {
        setSelectedOption({
          teacher: alternativeOptions.teachers[0]?.id || '',
          room: alternativeOptions.rooms[0]?.id || '',
          timeSlot: alternativeOptions.timeSlots[0]?.day_of_week + '_' + alternativeOptions.timeSlots[0]?.start_time || ''
        });
        setReason('Auto-reallocation due to ' + disruptedClass.disruption_reason);
        
        toast({
          title: "Auto Reallocation Suggested",
          description: "Please review and approve the suggested changes.",
        });
      }, 1000);
      
    } catch (error) {
      console.error('Error in auto reallocation:', error);
      toast({
        title: "Error",
        description: "Auto reallocation failed",
        variant: "destructive"
      });
    } finally {
      setSubmitting(false);
    }
  };

  const submitReallocation = async () => {
    if (!user || !activeClass) return;
    
    setSubmitting(true);
    try {
      // Simulate creating reallocation record
      const newReallocation: EmergencyReallocation = {
        id: "realloc-" + Date.now(),
        original_timetable_id: activeClass.id,
        disruption_reason: reason || activeClass.disruption_reason,
        new_teacher_id: selectedOption.teacher,
        new_room_id: selectedOption.room,
        status: 'approved',
        created_by: user.id,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      
      setReallocations(prev => [newReallocation, ...prev]);
      
      // Remove from disrupted classes
      setDisruptedClasses(prev => prev.filter(c => c.id !== activeClass.id));
      
      setShowReallocationDialog(false);
      setActiveClass(null);
      setSelectedOption({ teacher: '', room: '', timeSlot: '' });
      setReason('');
      
      toast({
        title: "Reallocation Created",
        description: "Emergency reallocation has been successfully implemented.",
      });
      
    } catch (error) {
      console.error('Error submitting reallocation:', error);
      toast({
        title: "Error",
        description: "Failed to create reallocation",
        variant: "destructive"
      });
    } finally {
      setSubmitting(false);
    }
  };

  useEffect(() => {
    fetchDisruptedClasses();
  }, []);

  const getDayName = (dayOfWeek: number) => {
    return ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][dayOfWeek];
  };

  const formatTime = (time: string) => {
    return new Date(`2024-01-01T${time}`).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  if (loading && disruptedClasses.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-orange-500" />
            Emergency Reallocation
          </CardTitle>
          <CardDescription>Loading disrupted classes...</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {Array.from({ length: 2 }).map((_, i) => (
            <Skeleton key={i} className="h-20 w-full" />
          ))}
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 " />
                Emergency Reallocation
                {disruptedClasses.length > 0 && (
                  <Badge variant="destructive" className="ml-2">
                    {disruptedClasses.length} Active
                  </Badge>
                )}
              </CardTitle>
              <CardDescription>
                Manage classes disrupted by leave requests, room issues, or emergencies
              </CardDescription>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={fetchDisruptedClasses}
              className="gap-2"
            >
              <RefreshCw className="h-4 w-4" />
              Refresh
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {disruptedClasses.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <CheckCircle className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p className="text-sm">No emergency reallocations needed</p>
              <p className="text-xs">All classes are running as scheduled</p>
            </div>
          ) : (
            <div className="space-y-3">
              {disruptedClasses.map((disruptedClass, i) => (
                <m.div
                  key={disruptedClass.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.1 }}
                  className="border rounded-lg p-4 border-red-200"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center gap-2">
                        <Badge variant="destructive" className="text-xs">
                          DISRUPTED
                        </Badge>
                        <div className="font-semibold text-lg">
                          {disruptedClass.course.code} - {disruptedClass.course.name}
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                        <div className="flex items-center gap-2">
                          <Clock className="h-4 w-4 text-muted-foreground" />
                          <span>{getDayName(disruptedClass.day_of_week)} {formatTime(disruptedClass.start_time)}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4 text-muted-foreground" />
                          <span>{disruptedClass.teacher.display_name}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <MapPin className="h-4 w-4 text-muted-foreground" />
                          <span>{disruptedClass.room.room_number}</span>
                        </div>
                        <div className="text-muted-foreground">
                          {disruptedClass.course.max_students} students
                        </div>
                      </div>
                      
                      <div className="text-sm text-red-700 border border-red-200 px-3 py-2 rounded-md">
                        <AlertTriangle className="h-4 w-4 inline mr-2" />
                        {disruptedClass.disruption_reason}
                      </div>
                    </div>
                    
                    <div className="flex flex-col gap-2">
                      <Button
                        onClick={() => autoReallocate(disruptedClass)}
                        disabled={submitting}
                        className="bg-gradient-to-r from-primary to-accent gap-2"
                        size="sm"
                      >
                        <Zap className="h-4 w-4" />
                        Auto Reallocate
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => findAlternatives(disruptedClass)}
                        disabled={submitting}
                        size="sm"
                      >
                        Manual Setup
                      </Button>
                    </div>
                  </div>
                </m.div>
              ))}
            </div>
          )}
          
          {reallocations.length > 0 && (
            <div className="mt-6">
              <h4 className="text-sm font-medium mb-3 text-green-700">Recent Reallocations</h4>
              <div className="space-y-2">
                {reallocations.slice(0, 3).map((reallocation) => (
                  <div key={reallocation.id} className="text-xs p-2 bg-green-50 border border-green-200 rounded">
                    <div className="flex items-center justify-between">
                      <span>Reallocation #{reallocation.id.slice(-6)}</span>
                      <Badge variant="default" className="bg-green-100 text-green-800">
                        {reallocation.status}
                      </Badge>
                    </div>
                    <div className="text-muted-foreground mt-1">
                      {reallocation.disruption_reason}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Reallocation Dialog */}
      <Dialog open={showReallocationDialog} onOpenChange={setShowReallocationDialog}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-orange-500" />
              Emergency Reallocation Setup
            </DialogTitle>
            <DialogDescription>
              Configure reallocation for {activeClass?.course.code} - {activeClass?.course.name}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-6">
            {/* Current Details */}
            <div className="p-3 bg-muted rounded-lg">
              <div className="text-sm font-medium mb-2">Current Schedule</div>
              <div className="text-sm text-muted-foreground">
                {activeClass && (
                  <>
                    {getDayName(activeClass.day_of_week)} {formatTime(activeClass.start_time)} - {formatTime(activeClass.end_time)}
                    <br />
                    Teacher: {activeClass.teacher.display_name} | Room: {activeClass.room.room_number}
                  </>
                )}
              </div>
            </div>

            {/* Substitute Teacher */}
            <div className="space-y-2">
              <Label>Substitute Teacher</Label>
              <Select value={selectedOption.teacher} onValueChange={(value) => setSelectedOption(prev => ({ ...prev, teacher: value }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Select substitute teacher" />
                </SelectTrigger>
                <SelectContent>
                  {alternativeOptions.teachers.map((teacher) => (
                    <SelectItem key={teacher.id} value={teacher.id}>
                      {teacher.display_name} - {teacher.department}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Alternative Room */}
            <div className="space-y-2">
              <Label>Alternative Room</Label>
              <Select value={selectedOption.room} onValueChange={(value) => setSelectedOption(prev => ({ ...prev, room: value }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Select alternative room" />
                </SelectTrigger>
                <SelectContent>
                  {alternativeOptions.rooms.map((room) => (
                    <SelectItem key={room.id} value={room.id}>
                      {room.room_number} ({room.capacity} seats) - {room.building}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Alternative Time Slot */}
            <div className="space-y-2">
              <Label>Alternative Time Slot</Label>
              <Select value={selectedOption.timeSlot} onValueChange={(value) => setSelectedOption(prev => ({ ...prev, timeSlot: value }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Select alternative time slot" />
                </SelectTrigger>
                <SelectContent>
                  {alternativeOptions.timeSlots.map((slot, index) => (
                    <SelectItem key={index} value={`${slot.day_of_week}_${slot.start_time}`}>
                      {slot.day_name} {formatTime(slot.start_time)} - {formatTime(slot.end_time)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Reason */}
            <div className="space-y-2">
              <Label>Reallocation Reason</Label>
              <Textarea
                placeholder="Explain the reason for this reallocation..."
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                className="min-h-[80px]"
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowReallocationDialog(false)}
              disabled={submitting}
            >
              Cancel
            </Button>
            <Button
              onClick={submitReallocation}
              disabled={submitting || !selectedOption.teacher || !selectedOption.room || !reason}
              className="gap-2"
            >
              {submitting ? (
                <>
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-background border-t-foreground" />
                  Processing...
                </>
              ) : (
                <>
                  <CheckCircle className="h-4 w-4" />
                  Implement Reallocation
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
