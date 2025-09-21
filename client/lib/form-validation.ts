import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useToast } from "@/hooks/use-toast";

// =============================================================================
// GENERIC FORM VALIDATION HOOK
// =============================================================================

export function useValidatedForm<T extends z.ZodType<any, any, any>>(
  schema: T,
  defaultValues?: Partial<z.infer<T>>,
  options?: {
    onSuccess?: (data: z.infer<T>) => Promise<void> | void;
    onError?: (error: any) => void;
    showSuccessToast?: boolean;
    successMessage?: string;
    showErrorToast?: boolean;
    errorMessage?: string;
  }
) {
  const { toast } = useToast();
  
  const form = useForm<z.infer<T>>({
    resolver: zodResolver(schema),
    defaultValues: defaultValues as any,
    mode: "onChange", // Enable real-time validation
  });  const handleSubmit = form.handleSubmit(
    async (data) => {
      try {
        await options?.onSuccess?.(data);
        
        if (options?.showSuccessToast) {
          toast({
            title: "Success",
            description: options?.successMessage || "Form submitted successfully",
            variant: "default",
          });
        }
      } catch (error: any) {
        console.error("Form submission error:", error);
        
        if (options?.showErrorToast) {
          toast({
            title: "Error",
            description: options?.errorMessage || error?.message || "Form submission failed",
            variant: "destructive",
          });
        }
        
        options?.onError?.(error);
      }
    },
    (errors) => {
      console.log("Form validation errors:", errors);
      
      // Show first validation error as toast
      const firstError = Object.values(errors)[0];
      if (firstError?.message && options?.showErrorToast !== false) {
        toast({
          title: "Validation Error",
          description: firstError.message as string,
          variant: "destructive",
        });
      }
      
      options?.onError?.(errors);
    }
  );

  return {
    ...form,
    handleSubmit,
    isSubmitting: form.formState.isSubmitting,
    isValid: form.formState.isValid,
    errors: form.formState.errors,
    isDirty: form.formState.isDirty,
  };
}

// =============================================================================
// FIELD-LEVEL VALIDATION HELPERS
// =============================================================================

export function getFieldError(errors: any, fieldName: string): string | undefined {
  const error = errors[fieldName];
  return error?.message;
}

export function isFieldInvalid(errors: any, fieldName: string): boolean {
  return !!errors[fieldName];
}

export function getFieldProps(
  register: any,
  fieldName: string,
  errors: any,
  options?: {
    required?: boolean;
    disabled?: boolean;
    placeholder?: string;
    type?: string;
  }
) {
  return {
    ...register(fieldName),
    "aria-invalid": isFieldInvalid(errors, fieldName),
    "aria-describedby": isFieldInvalid(errors, fieldName) ? `${fieldName}-error` : undefined,
    required: options?.required,
    disabled: options?.disabled,
    placeholder: options?.placeholder,
    type: options?.type,
  };
}

// =============================================================================
// ASYNC VALIDATION HELPERS
// =============================================================================

export async function validateAsync<T>(
  schema: z.ZodType<T>,
  data: unknown
): Promise<{ success: true; data: T } | { success: false; errors: z.ZodIssue[] }> {
  try {
    const result = await schema.parseAsync(data);
    return { success: true, data: result };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, errors: error.issues };
    }
    throw error;
  }
}

// =============================================================================
// FORM STATE MANAGEMENT HELPERS
// =============================================================================

export function createFormState<T extends Record<string, any>>(initialValues: T) {
  return {
    values: initialValues,
    errors: {} as Record<keyof T, string>,
    touched: {} as Record<keyof T, boolean>,
    isSubmitting: false,
    isValid: true,
  };
}

export function resetFormErrors<T>(errors: Record<keyof T, string>): Record<keyof T, string> {
  const resetErrors = {} as Record<keyof T, string>;
  Object.keys(errors).forEach((key) => {
    resetErrors[key as keyof T] = "";
  });
  return resetErrors;
}

// =============================================================================
// VALIDATION UTILITY FUNCTIONS
// =============================================================================

export function sanitizeString(value: string): string {
  return value.trim().replace(/\s+/g, " ");
}

export function normalizeEmail(email: string): string {
  return email.toLowerCase().trim();
}

export function formatPhoneNumber(phone: string): string {
  return phone.replace(/\D/g, "");
}

export function validateEmailDomain(email: string, allowedDomains: string[]): boolean {
  const domain = email.split("@")[1]?.toLowerCase();
  return allowedDomains.some(allowedDomain => 
    domain === allowedDomain || domain?.endsWith(`.${allowedDomain}`)
  );
}

export function validatePasswordStrength(password: string): {
  score: number; // 0-4
  feedback: string[];
} {
  const feedback: string[] = [];
  let score = 0;

  if (password.length >= 8) score++;
  else feedback.push("Use at least 8 characters");

  if (/[A-Z]/.test(password)) score++;
  else feedback.push("Include uppercase letters");

  if (/[a-z]/.test(password)) score++;
  else feedback.push("Include lowercase letters");

  if (/[0-9]/.test(password)) score++;
  else feedback.push("Include numbers");

  if (/[^A-Za-z0-9]/.test(password)) score++;
  else feedback.push("Include special characters");

  return { score, feedback };
}

// =============================================================================
// FORM SUBMISSION HELPERS
// =============================================================================

export async function handleFormSubmission<T>(
  formData: T,
  submitFunction: (data: T) => Promise<any>,
  options?: {
    showLoadingToast?: boolean;
    loadingMessage?: string;
    successMessage?: string;
    errorMessage?: string;
  }
) {
  const { toast } = useToast();
  
  if (options?.showLoadingToast) {
    toast({
      title: "Processing...",
      description: options?.loadingMessage || "Please wait while we process your request",
    });
  }

  try {
    const result = await submitFunction(formData);
    
    toast({
      title: "Success",
      description: options?.successMessage || "Operation completed successfully",
      variant: "default",
    });
    
    return { success: true, data: result };
  } catch (error: any) {
    toast({
      title: "Error",
      description: options?.errorMessage || error?.message || "Operation failed",
      variant: "destructive",
    });
    
    return { success: false, error };
  }
}