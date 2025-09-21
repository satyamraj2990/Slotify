import { z } from "zod";

// =============================================================================
// AUTHENTICATION VALIDATION SCHEMAS
// =============================================================================

export const loginSchema = z.object({
  email: z
    .string()
    .min(1, "Email is required")
    .email("Please enter a valid email address")
    .max(100, "Email must be less than 100 characters"),
  
  password: z
    .string()
    .min(1, "Password is required")
    .min(6, "Password must be at least 6 characters")
    .max(100, "Password must be less than 100 characters"),
});

export const signupSchema = z.object({
  email: z
    .string()
    .min(1, "Email is required")
    .email("Please enter a valid email address")
    .max(100, "Email must be less than 100 characters")
    .refine(
      (email) => email.endsWith(".edu") || email.includes("college") || email.includes("university"),
      "Please use your institutional email address"
    ),
  
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .max(100, "Password must be less than 100 characters")
    .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
    .regex(/[a-z]/, "Password must contain at least one lowercase letter")
    .regex(/[0-9]/, "Password must contain at least one number")
    .regex(/[^A-Za-z0-9]/, "Password must contain at least one special character"),
  
  firstName: z
    .string()
    .min(1, "First name is required")
    .min(2, "First name must be at least 2 characters")
    .max(50, "First name must be less than 50 characters")
    .regex(/^[a-zA-Z\s]+$/, "First name can only contain letters and spaces"),
  
  lastName: z
    .string()
    .min(1, "Last name is required")
    .min(2, "Last name must be at least 2 characters")
    .max(50, "Last name must be less than 50 characters")
    .regex(/^[a-zA-Z\s]+$/, "Last name can only contain letters and spaces"),
  
  role: z.enum(["student", "teacher", "admin"], {
    required_error: "Please select a role",
    invalid_type_error: "Invalid role selected",
  }),
  
  department: z
    .string()
    .min(2, "Department must be at least 2 characters")
    .max(100, "Department must be less than 100 characters")
    .optional()
    .or(z.literal("")),
}).refine(
  (data) => {
    // Department is required for teachers and admins
    if ((data.role === "teacher" || data.role === "admin") && !data.department?.trim()) {
      return false;
    }
    return true;
  },
  {
    message: "Department is required for teachers and administrators",
    path: ["department"],
  }
);

export const forgotPasswordSchema = z.object({
  email: z
    .string()
    .min(1, "Email is required")
    .email("Please enter a valid email address"),
});

// =============================================================================
// TEACHER REGISTRATION VALIDATION SCHEMAS  
// =============================================================================

export const teacherRegistrationSchema = z.object({
  fullName: z
    .string()
    .min(1, "Full name is required")
    .min(3, "Full name must be at least 3 characters")
    .max(100, "Full name must be less than 100 characters")
    .regex(/^[a-zA-Z\s.]+$/, "Name can only contain letters, spaces, and periods"),
  
  email: z
    .string()
    .min(1, "Email is required")
    .email("Please enter a valid email address")
    .max(100, "Email must be less than 100 characters"),
  
  phone: z
    .string()
    .regex(/^[+]?[\d\s\-()]{10,15}$/, "Please enter a valid phone number")
    .optional()
    .or(z.literal("")),
  
  department: z
    .string()
    .min(1, "Department is required")
    .min(2, "Department must be at least 2 characters")
    .max(100, "Department must be less than 100 characters"),
  
  subjects: z
    .string()
    .min(1, "At least one subject is required")
    .refine(
      (subjects) => {
        const subjectList = subjects.split(',').map(s => s.trim()).filter(s => s);
        return subjectList.length > 0 && subjectList.every(s => s.length >= 2);
      },
      "Please enter valid subjects separated by commas (each at least 2 characters)"
    ),
  
  weeklyWorkload: z
    .string()
    .min(1, "Weekly workload is required")
    .refine(
      (val) => {
        const num = parseFloat(val);
        return !isNaN(num) && num > 0 && num <= 60;
      },
      "Weekly workload must be between 1 and 60 hours"
    ),
  
  availability: z
    .string()
    .min(1, "Availability is required")
    .min(5, "Please provide more detailed availability information"),
});

// =============================================================================
// COURSE REGISTRATION VALIDATION SCHEMAS
// =============================================================================

export const courseRegistrationSchema = z.object({
  courseName: z
    .string()
    .min(1, "Course name is required")
    .min(3, "Course name must be at least 3 characters")
    .max(200, "Course name must be less than 200 characters"),
  
  code: z
    .string()
    .min(1, "Course code is required")
    .min(2, "Course code must be at least 2 characters")
    .max(20, "Course code must be less than 20 characters")
    .regex(/^[A-Z0-9]+$/, "Course code must contain only uppercase letters and numbers"),
  
  credits: z
    .string()
    .min(1, "Credits are required")
    .refine(
      (val) => {
        const num = parseFloat(val);
        return !isNaN(num) && num > 0 && num <= 10;
      },
      "Credits must be between 1 and 10"
    ),
  
  theoryPractical: z
    .string()
    .regex(/^\d+L(\+\d+P)?$|^\d+P$/, "Format should be like '3L+1P' or '2L' or '2P'")
    .optional()
    .or(z.literal("")),
  
  weeklyLectures: z
    .string()
    .refine(
      (val) => {
        if (!val) return true; // Optional field
        const num = parseInt(val);
        return !isNaN(num) && num >= 1 && num <= 20;
      },
      "Weekly lectures must be between 1 and 20"
    )
    .optional()
    .or(z.literal("")),
  
  assignTeacher: z
    .string()
    .max(100, "Teacher name must be less than 100 characters")
    .optional()
    .or(z.literal("")),
  
  department: z
    .string()
    .min(1, "Department is required")
    .max(100, "Department must be less than 100 characters"),
  
  semester: z
    .string()
    .regex(/^[1-8]$/, "Semester must be between 1 and 8")
    .optional()
    .or(z.literal("")),
  
  year: z
    .string()
    .regex(/^(1st|2nd|3rd|4th)$/, "Year must be 1st, 2nd, 3rd, or 4th")
    .optional()
    .or(z.literal("")),
  
  courseType: z.enum(["major", "minor", "value_add", "core"], {
    required_error: "Course type is required",
  }),
});

// =============================================================================
// ROOM/CONSTRAINTS VALIDATION SCHEMAS
// =============================================================================

export const roomSetupSchema = z.object({
  roomNumber: z
    .string()
    .min(1, "Room number is required")
    .max(20, "Room number must be less than 20 characters")
    .regex(/^[A-Za-z0-9\-]+$/, "Room number can only contain letters, numbers, and hyphens"),
  
  building: z
    .string()
    .min(1, "Building is required")
    .min(2, "Building name must be at least 2 characters")
    .max(100, "Building name must be less than 100 characters"),
  
  capacity: z
    .string()
    .min(1, "Capacity is required")
    .refine(
      (val) => {
        const num = parseInt(val);
        return !isNaN(num) && num >= 1 && num <= 500;
      },
      "Capacity must be between 1 and 500"
    ),
  
  roomType: z.enum(["classroom", "laboratory", "auditorium", "seminar"], {
    required_error: "Room type is required",
  }),
  
  facilities: z
    .string()
    .max(500, "Facilities description must be less than 500 characters")
    .optional()
    .or(z.literal("")),
});

export const schedulingConstraintsSchema = z.object({
  holidayDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be in YYYY-MM-DD format")
    .refine(
      (date) => {
        const parsed = new Date(date);
        const today = new Date();
        return parsed >= today;
      },
      "Holiday date must be in the future"
    )
    .optional()
    .or(z.literal("")),
  
  blockedHours: z
    .string()
    .regex(/^(Mon|Tue|Wed|Thu|Fri|Sat|Sun)\s\d{1,2}-\d{1,2}$/, "Format: 'Day StartHour-EndHour' (e.g., 'Fri 1-3')")
    .optional()
    .or(z.literal("")),
  
  workingDays: z
    .string()
    .regex(/^(Mon|Tue|Wed|Thu|Fri|Sat|Sun)(-|(,\s*))(Mon|Tue|Wed|Thu|Fri|Sat|Sun)$/, "Format: 'Day-Day' or 'Day, Day, Day'")
    .optional()
    .or(z.literal("")),
  
  maxPeriodsPerDay: z
    .string()
    .refine(
      (val) => {
        if (!val) return true;
        const num = parseInt(val);
        return !isNaN(num) && num >= 1 && num <= 10;
      },
      "Max periods per day must be between 1 and 10"
    )
    .optional()
    .or(z.literal("")),
});

// =============================================================================
// TIMETABLE CONFIGURATION VALIDATION SCHEMAS
// =============================================================================

export const timetableConfigSchema = z.object({
  numberOfClasses: z
    .number()
    .min(1, "Must have at least 1 class")
    .max(10, "Maximum 10 classes allowed"),
  
  sectionsPerClass: z
    .number()
    .min(1, "Must have at least 1 section per class")
    .max(10, "Maximum 10 sections per class allowed"),
  
  minDailyPeriods: z
    .number()
    .min(1, "Minimum daily periods must be at least 1")
    .max(10, "Maximum 10 periods per day"),
  
  maxDailyPeriods: z
    .number()
    .min(1, "Maximum daily periods must be at least 1")
    .max(10, "Maximum 10 periods per day"),
  
  minWeeklyPeriods: z
    .number()
    .min(5, "Minimum weekly periods must be at least 5")
    .max(50, "Maximum 50 periods per week"),
  
  maxWeeklyPeriods: z
    .number()
    .min(5, "Maximum weekly periods must be at least 5")
    .max(50, "Maximum 50 periods per week"),
  
  workingDays: z
    .array(z.number().min(0).max(6))
    .min(1, "At least one working day must be selected")
    .max(7, "Maximum 7 working days"),
  
  periodsPerDay: z
    .array(z.string().min(1, "Period name cannot be empty"))
    .min(1, "At least one period must be selected")
    .max(10, "Maximum 10 periods per day"),
  
  periodDuration: z
    .number()
    .min(30, "Period duration must be at least 30 minutes")
    .max(180, "Period duration must be at most 180 minutes"),
  
}).refine(
  (data) => data.minDailyPeriods <= data.maxDailyPeriods,
  {
    message: "Minimum daily periods cannot be greater than maximum daily periods",
    path: ["minDailyPeriods"],
  }
).refine(
  (data) => data.minWeeklyPeriods <= data.maxWeeklyPeriods,
  {
    message: "Minimum weekly periods cannot be greater than maximum weekly periods",
    path: ["minWeeklyPeriods"],
  }
);

// =============================================================================
// LEAVE APPLICATION VALIDATION SCHEMA
// =============================================================================

export const leaveApplicationSchema = z.object({
  date: z
    .date({
      required_error: "Leave date is required",
      invalid_type_error: "Please select a valid date",
    })
    .refine(
      (date) => date > new Date(),
      "Leave date must be in the future"
    ),
  
  reason: z
    .string()
    .min(1, "Reason is required")
    .min(10, "Please provide a detailed reason (at least 10 characters)")
    .max(500, "Reason must be less than 500 characters"),
  
  substituteTeacher: z
    .string()
    .min(2, "Substitute teacher name must be at least 2 characters")
    .max(100, "Substitute teacher name must be less than 100 characters")
    .regex(/^[a-zA-Z\s.]+$/, "Name can only contain letters, spaces, and periods")
    .optional()
    .or(z.literal("")),
  
  substituteContact: z
    .string()
    .regex(/^[+]?[\d\s\-()]{10,15}$|^[^\s@]+@[^\s@]+\.[^\s@]+$/, "Please enter a valid phone number or email")
    .optional()
    .or(z.literal("")),
});

// =============================================================================
// EXPORT TYPES FOR TYPESCRIPT INFERENCE
// =============================================================================

export type LoginFormData = z.infer<typeof loginSchema>;
export type SignupFormData = z.infer<typeof signupSchema>;
export type ForgotPasswordFormData = z.infer<typeof forgotPasswordSchema>;
export type TeacherRegistrationFormData = z.infer<typeof teacherRegistrationSchema>;
export type CourseRegistrationFormData = z.infer<typeof courseRegistrationSchema>;
export type RoomSetupFormData = z.infer<typeof roomSetupSchema>;
export type SchedulingConstraintsFormData = z.infer<typeof schedulingConstraintsSchema>;
export type TimetableConfigFormData = z.infer<typeof timetableConfigSchema>;
export type LeaveApplicationFormData = z.infer<typeof leaveApplicationSchema>;