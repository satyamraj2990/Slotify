import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useMemo, useState, useEffect } from "react";
import { profilesApi, officeHoursApi } from "@/lib/api";
import { useAuth } from "@/context/auth";

export default function OfficeHours() {
  const { profile } = useAuth();
  const [tutors, setTutors] = useState<string[]>([]);
  const [teacher, setTeacher] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const slots = useMemo(() => Array.from({ length: 12 }, (_, i) => `${9 + Math.floor(i/2)}:${i % 2 ? "30" : "00"}`), []);
  const [booked, setBooked] = useState<Record<string, boolean>>({});

  useEffect(() => {
    const fetchTeachers = async () => {
      try {
        const teachers = await profilesApi.getTeachers();
        const teacherNames = teachers.map(t => t.display_name || `${t.first_name} ${t.last_name}`);
        setTutors(teacherNames);
        if (teacherNames.length > 0) {
          setTeacher(teacherNames[0]);
        }
        
        // Fetch existing office hours bookings
        const officeHours = await officeHoursApi.getAll();
        const bookingMap: Record<string, boolean> = {};
        officeHours.forEach(hour => {
          if (hour.teacher) {
            const teacherName = hour.teacher.display_name || `${hour.teacher.first_name} ${hour.teacher.last_name}`;
            const timeSlot = hour.start_time;
            // Mark as booked if not available
            bookingMap[`${teacherName}-${timeSlot}`] = !hour.is_available;
          }
        });
        setBooked(bookingMap);
      } catch (error) {
        console.error('Error fetching teachers:', error);
        // Fallback to mock data
        setTutors(["Dr. Rao", "Dr. Mehta", "Prof. Verma"]);
        setTeacher("Dr. Rao");
      } finally {
        setLoading(false);
      }
    };

    fetchTeachers();
  }, []);

  const book = async (teacherName: string, timeSlot: string) => {
    try {
      // Find the teacher by name
      const teachers = await profilesApi.getTeachers();
      const selectedTeacher = teachers.find(t => 
        (t.display_name || `${t.first_name} ${t.last_name}`) === teacherName
      );
      
      if (!selectedTeacher) {
        console.error('Teacher not found');
        return;
      }

      // Find existing office hour slot or create new booking
      const officeHours = await officeHoursApi.getAll();
      const existingSlot = officeHours.find(hour => 
        hour.teacher_id === selectedTeacher.id && 
        hour.start_time === timeSlot && 
        hour.is_available
      );

      if (existingSlot) {
        // Book the existing available slot
        await officeHoursApi.update(existingSlot.id, {
          is_available: false,
          booked_by: profile?.id
        });
      } else {
        // Create a new booking (this might not be allowed depending on business logic)
        console.log('No available slot found for booking');
        return;
      }
      
      // Update local state
      setBooked((b) => ({ ...b, [`${teacherName}-${timeSlot}`]: true }));
      
    } catch (error) {
      console.error('Error booking office hour:', error);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Office Hours Booking</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-3">
            <div className="h-8 bg-muted/20 rounded w-1/3" />
            <div className="grid grid-cols-3 gap-2 md:grid-cols-6">
              {Array.from({length: 12}, (_, i) => (
                <div key={i} className="h-8 bg-muted/20 rounded" />
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Office Hours Booking</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="mb-3 flex items-center gap-2">
          <span className="text-sm">Faculty:</span>
          <select value={teacher} onChange={(e)=>setTeacher(e.target.value)} className="h-8 rounded-md border border-white/10 bg-background px-2 text-sm">
            {tutors.map((t) => <option key={t}>{t}</option>)}
          </select>
        </div>
        <div className="grid grid-cols-3 gap-2 md:grid-cols-6">
          {slots.map((s) => (
            <Button key={s} size="sm" variant={booked[`${teacher}-${s}`] ? "secondary" : "outline"} disabled={booked[`${teacher}-${s}`]} onClick={()=>book(teacher, s)} className="justify-center">
              {booked[`${teacher}-${s}`] ? `Booked ${s}` : `Book ${s}`}
            </Button>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
