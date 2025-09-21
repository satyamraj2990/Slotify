import { useState } from "react";
import { Calendar, CalendarDays, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/context/auth";
import { leaveRequestsApi } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";

interface SimpleLeaveFormProps {
  trigger?: React.ReactNode;
  onSuccess?: () => void;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export default function SimpleLeaveForm({ trigger, onSuccess, open: controlledOpen, onOpenChange }: SimpleLeaveFormProps) {
  const [internalOpen, setInternalOpen] = useState(false);
  const open = controlledOpen !== undefined ? controlledOpen : internalOpen;
  const setOpen = onOpenChange || setInternalOpen;
  const [loading, setLoading] = useState(false);
  const [leaveDate, setLeaveDate] = useState("");
  const [reason, setReason] = useState("");
  const [substituteName, setSubstituteName] = useState("");
  const [substituteContact, setSubstituteContact] = useState("");
  
  const { user } = useAuth();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !leaveDate || !reason.trim()) {
      toast({
        title: "Missing Information",
        description: "Please fill in date and reason fields.",
        variant: "destructive"
      });
      return;
    }

    // Validate date is not in the past
    const selectedDate = new Date(leaveDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    if (selectedDate < today) {
      toast({
        title: "Invalid Date",
        description: "Leave date cannot be in the past.",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    try {
      await leaveRequestsApi.create({
        teacher_id: user.id,
        leave_date: leaveDate,
        reason: reason.trim(),
        substitute_name: substituteName.trim() || undefined,
        substitute_contact: substituteContact.trim() || undefined
      });

      toast({
        title: "Leave Request Submitted",
        description: "Your leave request has been submitted for approval.",
      });

      // Reset form
      setLeaveDate("");
      setReason("");
      setSubstituteName("");
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

  // Get minimum date (tomorrow)
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const minDate = tomorrow.toISOString().split('T')[0];

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
          {/* Date Selection - Simple Input */}
          <div className="space-y-2">
            <Label htmlFor="leave-date">Leave Date *</Label>
            <Input
              id="leave-date"
              type="date"
              value={leaveDate}
              onChange={(e) => setLeaveDate(e.target.value)}
              min={minDate}
              required
              className="w-full"
            />
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

          {/* Substitute Teacher Information - Optional */}
          <div className="space-y-4 border-t pt-4">
            <div className="space-y-2">
              <Label htmlFor="substitute-name">Substitute Teacher Name (Optional)</Label>
              <Input
                id="substitute-name"
                placeholder="Dr. Jane Smith"
                value={substituteName}
                onChange={(e) => setSubstituteName(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="substitute-contact">Contact Information (Optional)</Label>
              <Input
                id="substitute-contact"
                placeholder="Phone number or email"
                value={substituteContact}
                onChange={(e) => setSubstituteContact(e.target.value)}
              />
            </div>
          </div>

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
              disabled={loading || !leaveDate || !reason.trim()}
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