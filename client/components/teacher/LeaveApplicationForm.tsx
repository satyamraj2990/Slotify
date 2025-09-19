import { useState } from "react";
import { Calendar, CalendarDays, Send, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { useAuth } from "@/context/auth";
import { leaveRequestsApi } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";

interface LeaveApplicationFormProps {
  trigger?: React.ReactNode;
  onSuccess?: () => void;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export default function LeaveApplicationForm({ trigger, onSuccess, open: controlledOpen, onOpenChange }: LeaveApplicationFormProps) {
  const [internalOpen, setInternalOpen] = useState(false);
  const open = controlledOpen !== undefined ? controlledOpen : internalOpen;
  const setOpen = onOpenChange || setInternalOpen;
  const [loading, setLoading] = useState(false);
  const [date, setDate] = useState<Date>();
  const [reason, setReason] = useState("");
  const [substituteTeacher, setSubstituteTeacher] = useState("");
  const [substituteContact, setSubstituteContact] = useState("");
  
  const { user } = useAuth();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !date || !reason.trim()) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields.",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    try {
      await leaveRequestsApi.create({
        teacher_id: user.id,
        leave_date: date.toISOString().split('T')[0],
        reason: reason.trim(),
        substitute_name: substituteTeacher.trim() || undefined,
        substitute_contact: substituteContact.trim() || undefined
      });

      toast({
        title: "Leave Request Submitted",
        description: "Your leave request has been submitted for approval.",
      });

      // Reset form
      setDate(undefined);
      setReason("");
      setSubstituteTeacher("");
      setSubstituteContact("");
      setOpen(false);
      onSuccess?.();
      
    } catch (error) {
      console.error('Error submitting leave request:', error);
      toast({
        title: "Submission Failed",
        description: "Failed to submit leave request. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const defaultTrigger = (
    <Button variant="outline" className="gap-2">
      <CalendarDays className="h-4 w-4" />
      Apply for Leave
    </Button>
  );

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || defaultTrigger}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Apply for Leave
          </DialogTitle>
          <DialogDescription>
            Submit a leave request for administrative approval. All fields marked with * are required.
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Date Selection */}
          <div className="space-y-2">
            <Label htmlFor="leave-date">Leave Date *</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  id="leave-date"
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !date && "text-muted-foreground"
                  )}
                >
                  <CalendarDays className="mr-2 h-4 w-4" />
                  {date ? format(date, "PPP") : "Select leave date"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <CalendarComponent
                  mode="single"
                  selected={date}
                  onSelect={setDate}
                  disabled={(date) => date < new Date()}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>

          {/* Reason */}
          <div className="space-y-2">
            <Label htmlFor="reason">Reason for Leave *</Label>
            <Textarea
              id="reason"
              placeholder="Please provide a detailed reason for your leave request..."
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="min-h-[80px]"
              required
            />
          </div>

          {/* Substitute Teacher Information */}
          <Card className="border-dashed">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <User className="h-4 w-4" />
                Substitute Teacher (Optional)
              </CardTitle>
              <CardDescription className="text-xs">
                Provide substitute teacher details if arrangements have been made
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="substitute-name">Substitute Teacher Name</Label>
                <Input
                  id="substitute-name"
                  placeholder="Dr. Jane Smith"
                  value={substituteTeacher}
                  onChange={(e) => setSubstituteTeacher(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="substitute-contact">Contact Information</Label>
                <Input
                  id="substitute-contact"
                  placeholder="Phone number or email"
                  value={substituteContact}
                  onChange={(e) => setSubstituteContact(e.target.value)}
                />
              </div>
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <div className="flex justify-end space-x-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={loading || !date || !reason.trim()}
              className="gap-2"
            >
              {loading ? (
                <>
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-background border-t-foreground" />
                  Submitting...
                </>
              ) : (
                <>
                  <Send className="h-4 w-4" />
                  Submit Request
                </>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}