"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"
import { useValidatedForm, getFieldError, isFieldInvalid } from "@/lib/form-validation"
import { timetableConfigSchema, type TimetableConfigFormData } from "@/lib/validation-schemas"
import { 
  Calendar, 
  Clock, 
  Building, 
  Ban, 
  Coffee, 
  Settings, 
  Info,
  Plus,
  Trash2,
  Save,
  RotateCcw
} from "lucide-react"

interface TimetableConstraints {
  working_days: number[]
  periods_per_day: string[]
  period_timings: Record<string, { start: string; end: string }>
  period_duration_minutes: number
  max_daily_periods_per_teacher: number
  max_weekly_periods_per_teacher: number
  min_daily_periods_per_section: number
  max_daily_periods_per_section: number
  min_gap_between_periods: number
  lunch_zones: Array<{
    periods: string[]
    mandatory: boolean
    departments?: string[]
  }>
  lunch_break_period: string // Legacy support
  blocked_slots?: Array<{
    id: string
    name: string
    days: number[]
    periods: string[]
    reason: string
    departments?: string[]
  }>
  room_filters?: {
    preferred_buildings?: string[]
    excluded_rooms?: string[]
    capacity_requirements?: Record<string, number>
  }
}

interface TimetableConfiguratorProps {
  constraints: TimetableConstraints
  onConstraintsChange: (constraints: TimetableConstraints) => void
  showAdvanced?: boolean
}

export function TimetableConfigurator({ 
  constraints, 
  onConstraintsChange, 
  showAdvanced = true 
}: TimetableConfiguratorProps) {
  const [activeTemplate, setActiveTemplate] = useState<string>("")
  
  // Form validation setup
  const form = useValidatedForm(timetableConfigSchema, {
    numberOfClasses: constraints.max_daily_periods_per_section || 2,
    sectionsPerClass: 2,
    minDailyPeriods: constraints.min_daily_periods_per_section || 1,
    maxDailyPeriods: constraints.max_daily_periods_per_section || 7,
    periodDuration: constraints.period_duration_minutes || 50,
    workingDays: constraints.working_days || [1, 2, 3, 4, 5],
    periodsPerDay: constraints.periods_per_day || ['P1', 'P2', 'P3', 'P4', 'P5', 'P6', 'P7'],
  }, {
    onSuccess: (data: TimetableConfigFormData) => {
      // Update constraints with validated data
      const updatedConstraints: TimetableConstraints = {
        ...constraints,
        min_daily_periods_per_section: data.minDailyPeriods,
        max_daily_periods_per_section: data.maxDailyPeriods,
        period_duration_minutes: data.periodDuration,
        working_days: data.workingDays,
        periods_per_day: data.periodsPerDay,
      };
      onConstraintsChange(updatedConstraints);
    },
    showErrorToast: true,
    showSuccessToast: true,
    successMessage: "Timetable configuration updated successfully",
  });
  
  const dayOptions = [
    { value: 1, label: "Monday" },
    { value: 2, label: "Tuesday" },
    { value: 3, label: "Wednesday" },
    { value: 4, label: "Thursday" },
    { value: 5, label: "Friday" },
    { value: 6, label: "Saturday" },
    { value: 0, label: "Sunday" }
  ]

  // Predefined templates for common configurations
  const templates = {
    "standard-5day": {
      name: "Standard 5-Day Week",
      description: "Monday to Friday, 6 periods, 50 minutes each",
      constraints: {
        ...constraints,
        working_days: [1, 2, 3, 4, 5],
        periods_per_day: ['P1', 'P2', 'P3', 'P4', 'P5', 'P6'],
        period_duration_minutes: 50,
        lunch_zones: [{ periods: ['P4'], mandatory: false }]
      }
    },
    "standard-6day": {
      name: "Standard 6-Day Week", 
      description: "Monday to Saturday, 6 periods, 45 minutes each",
      constraints: {
        ...constraints,
        working_days: [1, 2, 3, 4, 5, 6],
        periods_per_day: ['P1', 'P2', 'P3', 'P4', 'P5', 'P6'],
        period_duration_minutes: 45,
        lunch_zones: [{ periods: ['P4'], mandatory: false }]
      }
    },
    "extended-7period": {
      name: "Extended 7-Period Day",
      description: "Monday to Friday, 7 periods, 45 minutes each",
      constraints: {
        ...constraints,
        working_days: [1, 2, 3, 4, 5],
        periods_per_day: ['P1', 'P2', 'P3', 'P4', 'P5', 'P6', 'P7'],
        period_duration_minutes: 45,
        lunch_zones: [{ periods: ['P4'], mandatory: false }]
      }
    }
  }

  const updateConstraints = (updates: Partial<TimetableConstraints>) => {
    onConstraintsChange({ ...constraints, ...updates })
  }

  const generatePeriodTimings = (count: number, duration: number, startTime: string = "09:00") => {
    const timings: Record<string, { start: string; end: string }> = {}
    let currentTime = startTime
    
    for (let i = 1; i <= count; i++) {
      const start = currentTime
      const [hours, minutes] = currentTime.split(':').map(Number)
      const endMinutes = minutes + duration
      const endHours = hours + Math.floor(endMinutes / 60)
      const end = `${endHours.toString().padStart(2, '0')}:${(endMinutes % 60).toString().padStart(2, '0')}`
      
      timings[`P${i}`] = { start, end }
      
      // Add lunch break after period 3 or 4
      if (i === 3 || i === 4) {
        const [lunchHours, lunchMinutes] = end.split(':').map(Number)
        const lunchEndMinutes = lunchMinutes + 60 // 1 hour lunch
        const lunchEndHours = lunchHours + Math.floor(lunchEndMinutes / 60)
        currentTime = `${lunchEndHours.toString().padStart(2, '0')}:${(lunchEndMinutes % 60).toString().padStart(2, '0')}`
      } else {
        currentTime = end
      }
    }
    
    return timings
  }

  const addBlockedSlot = () => {
    const newSlot = {
      id: `blocked-${Date.now()}`,
      name: "New Blocked Period",
      days: [1],
      periods: ['P1'],
      reason: "Specify reason",
      departments: []
    }
    
    updateConstraints({
      blocked_slots: [...(constraints.blocked_slots || []), newSlot]
    })
  }

  const removeBlockedSlot = (id: string) => {
    updateConstraints({
      blocked_slots: constraints.blocked_slots?.filter(slot => slot.id !== id) || []
    })
  }

  const addLunchZone = () => {
    const newZone = {
      periods: ['P4'],
      mandatory: false,
      departments: []
    }
    
    updateConstraints({
      lunch_zones: [...constraints.lunch_zones, newZone]
    })
  }

  const applyTemplate = (templateKey: string) => {
    const template = templates[templateKey as keyof typeof templates]
    if (template) {
      const newTimings = generatePeriodTimings(
        template.constraints.periods_per_day.length,
        template.constraints.period_duration_minutes
      )
      
      updateConstraints({
        ...template.constraints,
        period_timings: newTimings
      })
      setActiveTemplate(templateKey)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Settings className="h-5 w-5" />
          Advanced Timetable Configuration
        </CardTitle>
        <CardDescription>
          Customize scheduling parameters, constraints, and restrictions for precise timetable generation
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="basic" className="space-y-6">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="basic">Basic Setup</TabsTrigger>
            <TabsTrigger value="schedule">Schedule</TabsTrigger>
            <TabsTrigger value="blocks">Blocked Slots</TabsTrigger>
            <TabsTrigger value="lunch">Lunch Zones</TabsTrigger>
            <TabsTrigger value="rooms">Room Filters</TabsTrigger>
          </TabsList>

          {/* Basic Configuration */}
          <TabsContent value="basic" className="space-y-6">
            {/* Templates */}
            <div className="space-y-4">
              <Label className="text-base font-semibold">Quick Templates</Label>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {Object.entries(templates).map(([key, template]) => (
                  <Card 
                    key={key} 
                    className={`cursor-pointer transition-all ${activeTemplate === key ? 'ring-2 ring-primary' : 'hover:shadow-md'}`}
                    onClick={() => applyTemplate(key)}
                  >
                    <CardContent className="pt-4">
                      <div className="space-y-2">
                        <h4 className="font-medium">{template.name}</h4>
                        <p className="text-sm text-muted-foreground">{template.description}</p>
                        {activeTemplate === key && (
                          <Badge variant="default" className="text-xs">Active</Badge>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>

            <Separator />

            {/* Working Days */}
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                <Label className="text-base font-semibold">Working Days *</Label>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {dayOptions.map((day) => (
                  <div key={day.value} className="flex items-center space-x-2">
                    <Checkbox
                      id={`day-${day.value}`}
                      checked={constraints.working_days.includes(day.value)}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          updateConstraints({
                            working_days: [...constraints.working_days, day.value].sort()
                          })
                        } else {
                          // Prevent unchecking if it would result in no working days
                          if (constraints.working_days.length > 1) {
                            updateConstraints({
                              working_days: constraints.working_days.filter(d => d !== day.value)
                            })
                          }
                        }
                      }}
                    />
                    <Label htmlFor={`day-${day.value}`} className="text-sm">
                      {day.label}
                    </Label>
                  </div>
                ))}
              </div>
              {constraints.working_days.length === 0 && (
                <p className="text-red-500 text-xs">
                  At least one working day must be selected
                </p>
              )}
              {constraints.working_days.length > 6 && (
                <p className="text-red-500 text-xs">
                  Cannot select more than 6 working days
                </p>
              )}
            </div>

            {/* Period Configuration */}
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4" />
                <Label className="text-base font-semibold">Period Configuration</Label>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="periods-count">Number of Periods per Day</Label>
                  <Select 
                    value={constraints.periods_per_day.length.toString()}
                    onValueChange={(value) => {
                      const count = parseInt(value)
                      const periods = Array.from({ length: count }, (_, i) => `P${i + 1}`)
                      const timings = generatePeriodTimings(count, constraints.period_duration_minutes)
                      
                      updateConstraints({
                        periods_per_day: periods,
                        period_timings: timings
                      })
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {[4, 5, 6, 7, 8, 9, 10].map((num) => (
                        <SelectItem key={num} value={num.toString()}>
                          {num} periods
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="period-duration">Period Duration (minutes) *</Label>
                  <Select
                    value={constraints.period_duration_minutes.toString()}
                    onValueChange={(value) => {
                      const duration = parseInt(value)
                      if (duration >= 30 && duration <= 180) {
                        const timings = generatePeriodTimings(constraints.periods_per_day.length, duration)
                        
                        updateConstraints({
                          period_duration_minutes: duration,
                          period_timings: timings
                        })
                      }
                    }}
                  >
                    <SelectTrigger
                      className={
                        !constraints.period_duration_minutes || constraints.period_duration_minutes < 30 || constraints.period_duration_minutes > 180
                          ? "border-red-500"
                          : ""
                      }
                    >
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="30">30 minutes</SelectItem>
                      <SelectItem value="40">40 minutes</SelectItem>
                      <SelectItem value="45">45 minutes</SelectItem>
                      <SelectItem value="50">50 minutes</SelectItem>
                      <SelectItem value="60">60 minutes</SelectItem>
                      <SelectItem value="90">90 minutes</SelectItem>
                      <SelectItem value="120">120 minutes</SelectItem>
                    </SelectContent>
                  </Select>
                  {(!constraints.period_duration_minutes || constraints.period_duration_minutes < 30 || constraints.period_duration_minutes > 180) && (
                    <p className="text-red-500 text-xs">
                      Period duration must be between 30 and 180 minutes
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="start-time">Day Start Time</Label>
                  <Input
                    type="time"
                    value="09:00"
                    onChange={(e) => {
                      const timings = generatePeriodTimings(
                        constraints.periods_per_day.length, 
                        constraints.period_duration_minutes,
                        e.target.value
                      )
                      updateConstraints({ period_timings: timings })
                    }}
                  />
                </div>
              </div>
            </div>

            {/* Teacher Constraints */}
            <div className="space-y-4">
              <Label className="text-base font-semibold">Teacher Workload Limits</Label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="max-daily-teacher">Max Periods per Day (per Teacher) *</Label>
                  <Input
                    id="max-daily-teacher"
                    type="number"
                    min="1"
                    max="10"
                    value={constraints.max_daily_periods_per_teacher}
                    onChange={(e) => {
                      const value = parseInt(e.target.value);
                      if (value >= 1 && value <= 10) {
                        updateConstraints({
                          max_daily_periods_per_teacher: value
                        });
                      }
                    }}
                    className={
                      !constraints.max_daily_periods_per_teacher || constraints.max_daily_periods_per_teacher < 1 || constraints.max_daily_periods_per_teacher > 10
                        ? "border-red-500"
                        : ""
                    }
                  />
                  {(!constraints.max_daily_periods_per_teacher || constraints.max_daily_periods_per_teacher < 1 || constraints.max_daily_periods_per_teacher > 10) && (
                    <p className="text-red-500 text-xs">
                      Must be between 1 and 10 periods per day
                    </p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="max-weekly-teacher">Max Periods per Week (per Teacher) *</Label>
                  <Input
                    id="max-weekly-teacher"
                    type="number"
                    min="5"
                    max="50"
                    value={constraints.max_weekly_periods_per_teacher}
                    onChange={(e) => {
                      const value = parseInt(e.target.value);
                      if (value >= 5 && value <= 50) {
                        updateConstraints({
                          max_weekly_periods_per_teacher: value
                        });
                      }
                    }}
                    className={
                      !constraints.max_weekly_periods_per_teacher || constraints.max_weekly_periods_per_teacher < 5 || constraints.max_weekly_periods_per_teacher > 50
                        ? "border-red-500"
                        : ""
                    }
                  />
                  {(!constraints.max_weekly_periods_per_teacher || constraints.max_weekly_periods_per_teacher < 5 || constraints.max_weekly_periods_per_teacher > 50) && (
                    <p className="text-red-500 text-xs">
                      Must be between 5 and 50 periods per week
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Class Constraints */}
            <div className="space-y-4">
              <Label className="text-base font-semibold">Class Schedule Limits</Label>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="min-daily-class">Min Periods per Day (per Class) *</Label>
                  <Input
                    id="min-daily-class"
                    type="number"
                    min="1"
                    max="8"
                    value={constraints.min_daily_periods_per_section}
                    onChange={(e) => {
                      const value = parseInt(e.target.value);
                      if (value >= 1 && value <= 8 && value <= constraints.max_daily_periods_per_section) {
                        updateConstraints({
                          min_daily_periods_per_section: value
                        });
                      }
                    }}
                    className={
                      constraints.min_daily_periods_per_section > constraints.max_daily_periods_per_section
                        ? "border-red-500"
                        : ""
                    }
                  />
                  {constraints.min_daily_periods_per_section > constraints.max_daily_periods_per_section && (
                    <p className="text-red-500 text-xs">
                      Min periods cannot be greater than max periods ({constraints.max_daily_periods_per_section})
                    </p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="max-daily-class">Max Periods per Day (per Class) *</Label>
                  <Input
                    id="max-daily-class"
                    type="number"
                    min="1"
                    max="10"
                    value={constraints.max_daily_periods_per_section}
                    onChange={(e) => {
                      const value = parseInt(e.target.value);
                      if (value >= 1 && value <= 10 && value >= constraints.min_daily_periods_per_section) {
                        updateConstraints({
                          max_daily_periods_per_section: value
                        });
                      }
                    }}
                    className={
                      constraints.max_daily_periods_per_section < constraints.min_daily_periods_per_section
                        ? "border-red-500"
                        : ""
                    }
                  />
                  {constraints.max_daily_periods_per_section < constraints.min_daily_periods_per_section && (
                    <p className="text-red-500 text-xs">
                      Max periods cannot be less than min periods ({constraints.min_daily_periods_per_section})
                    </p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="min-gap">Min Gap Between Periods (minutes)</Label>
                  <Input
                    id="min-gap"
                    type="number"
                    min="0"
                    max="30"
                    value={constraints.min_gap_between_periods}
                    onChange={(e) => updateConstraints({
                      min_gap_between_periods: parseInt(e.target.value) || 0
                    })}
                  />
                </div>
              </div>
            </div>
          </TabsContent>

          {/* Schedule View */}
          <TabsContent value="schedule" className="space-y-4">
            <div className="space-y-4">
              <Label className="text-base font-semibold">Period Schedule Preview</Label>
              <div className="overflow-x-auto">
                <table className="w-full border-collapse border border-gray-200 rounded-lg">
                  <thead>
                    <tr className="bg-gray-50">
                      <th className="border border-gray-200 p-2 text-left">Period</th>
                      <th className="border border-gray-200 p-2 text-left">Start Time</th>
                      <th className="border border-gray-200 p-2 text-left">End Time</th>
                      <th className="border border-gray-200 p-2 text-left">Duration</th>
                    </tr>
                  </thead>
                  <tbody>
                    {constraints.periods_per_day.map((period) => {
                      const timing = constraints.period_timings[period]
                      return (
                        <tr key={period}>
                          <td className="border border-gray-200 p-2 font-medium">{period}</td>
                          <td className="border border-gray-200 p-2">{timing?.start || 'Not set'}</td>
                          <td className="border border-gray-200 p-2">{timing?.end || 'Not set'}</td>
                          <td className="border border-gray-200 p-2">{constraints.period_duration_minutes} min</td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </TabsContent>

          {/* Blocked Slots */}
          <TabsContent value="blocks" className="space-y-4">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Ban className="h-4 w-4" />
                  <Label className="text-base font-semibold">Blocked Time Slots</Label>
                </div>
                <Button onClick={addBlockedSlot} size="sm">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Blocked Slot
                </Button>
              </div>

              <Alert>
                <Info className="h-4 w-4" />
                <AlertDescription>
                  Blocked slots prevent scheduling during specific times. Use for holidays, assemblies, common meetings, or maintenance periods.
                </AlertDescription>
              </Alert>

              <div className="space-y-4">
                {(constraints.blocked_slots || []).map((slot, index) => (
                  <Card key={slot.id}>
                    <CardContent className="pt-4">
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <Input
                            value={slot.name}
                            onChange={(e) => {
                              const updated = [...(constraints.blocked_slots || [])]
                              updated[index] = { ...slot, name: e.target.value }
                              updateConstraints({ blocked_slots: updated })
                            }}
                            placeholder="Block name (e.g., Assembly Time)"
                          />
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            onClick={() => removeBlockedSlot(slot.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label>Days</Label>
                            <div className="flex flex-wrap gap-2">
                              {dayOptions.map((day) => (
                                <div key={day.value} className="flex items-center space-x-1">
                                  <Checkbox
                                    checked={slot.days.includes(day.value)}
                                    onCheckedChange={(checked) => {
                                      const updated = [...(constraints.blocked_slots || [])]
                                      if (checked) {
                                        updated[index] = { 
                                          ...slot, 
                                          days: [...slot.days, day.value].sort() 
                                        }
                                      } else {
                                        updated[index] = { 
                                          ...slot, 
                                          days: slot.days.filter(d => d !== day.value) 
                                        }
                                      }
                                      updateConstraints({ blocked_slots: updated })
                                    }}
                                  />
                                  <Label className="text-xs">{day.label.slice(0, 3)}</Label>
                                </div>
                              ))}
                            </div>
                          </div>
                          
                          <div className="space-y-2">
                            <Label>Periods</Label>
                            <div className="flex flex-wrap gap-2">
                              {constraints.periods_per_day.map((period) => (
                                <div key={period} className="flex items-center space-x-1">
                                  <Checkbox
                                    checked={slot.periods.includes(period)}
                                    onCheckedChange={(checked) => {
                                      const updated = [...(constraints.blocked_slots || [])]
                                      if (checked) {
                                        updated[index] = { 
                                          ...slot, 
                                          periods: [...slot.periods, period] 
                                        }
                                      } else {
                                        updated[index] = { 
                                          ...slot, 
                                          periods: slot.periods.filter(p => p !== period) 
                                        }
                                      }
                                      updateConstraints({ blocked_slots: updated })
                                    }}
                                  />
                                  <Label className="text-xs">{period}</Label>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                        
                        <Textarea
                          value={slot.reason}
                          onChange={(e) => {
                            const updated = [...(constraints.blocked_slots || [])]
                            updated[index] = { ...slot, reason: e.target.value }
                            updateConstraints({ blocked_slots: updated })
                          }}
                          placeholder="Reason for blocking (e.g., Weekly assembly, Holiday, Maintenance)"
                          rows={2}
                        />
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </TabsContent>

          {/* Lunch Zones */}
          <TabsContent value="lunch" className="space-y-4">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Coffee className="h-4 w-4" />
                  <Label className="text-base font-semibold">Lunch Break Configuration</Label>
                </div>
                <Button onClick={addLunchZone} size="sm">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Lunch Zone
                </Button>
              </div>

              <Alert>
                <Info className="h-4 w-4" />
                <AlertDescription>
                  Configure flexible lunch breaks for different departments or the entire institution. Multiple lunch zones allow staggered breaks.
                </AlertDescription>
              </Alert>

              <div className="space-y-4">
                {constraints.lunch_zones.map((zone, index) => (
                  <Card key={index}>
                    <CardContent className="pt-4">
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <Label className="font-medium">Lunch Zone {index + 1}</Label>
                          {constraints.lunch_zones.length > 1 && (
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              onClick={() => {
                                const updated = constraints.lunch_zones.filter((_, i) => i !== index)
                                updateConstraints({ lunch_zones: updated })
                              }}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          )}
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label>Lunch Periods</Label>
                            <div className="flex flex-wrap gap-2">
                              {constraints.periods_per_day.map((period) => (
                                <div key={period} className="flex items-center space-x-1">
                                  <Checkbox
                                    checked={zone.periods.includes(period)}
                                    onCheckedChange={(checked) => {
                                      const updated = [...constraints.lunch_zones]
                                      if (checked) {
                                        updated[index] = { 
                                          ...zone, 
                                          periods: [...zone.periods, period] 
                                        }
                                      } else {
                                        updated[index] = { 
                                          ...zone, 
                                          periods: zone.periods.filter(p => p !== period) 
                                        }
                                      }
                                      updateConstraints({ lunch_zones: updated })
                                    }}
                                  />
                                  <Label className="text-xs">{period}</Label>
                                </div>
                              ))}
                            </div>
                          </div>

                          <div className="space-y-3">
                            <div className="flex items-center space-x-2">
                              <Switch
                                checked={zone.mandatory}
                                onCheckedChange={(checked) => {
                                  const updated = [...constraints.lunch_zones]
                                  updated[index] = { ...zone, mandatory: checked }
                                  updateConstraints({ lunch_zones: updated })
                                }}
                              />
                              <Label className="text-sm">Mandatory lunch break</Label>
                            </div>
                            <p className="text-xs text-muted-foreground">
                              {zone.mandatory ? 
                                "No classes will be scheduled during these periods" : 
                                "Classes can be scheduled if needed"
                              }
                            </p>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </TabsContent>

          {/* Room Filters */}
          <TabsContent value="rooms" className="space-y-4">
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Building className="h-4 w-4" />
                <Label className="text-base font-semibold">Room & Building Preferences</Label>
              </div>

              <Alert>
                <Info className="h-4 w-4" />
                <AlertDescription>
                  Filter rooms and buildings to create targeted timetables for specific areas or departments.
                </AlertDescription>
              </Alert>

              <div className="space-y-6">
                {/* Preferred Buildings */}
                <div className="space-y-3">
                  <Label>Preferred Buildings</Label>
                  <Textarea
                    value={constraints.room_filters?.preferred_buildings?.join(', ') || ''}
                    onChange={(e) => {
                      const buildings = e.target.value.split(',').map(b => b.trim()).filter(Boolean)
                      updateConstraints({
                        room_filters: {
                          ...constraints.room_filters,
                          preferred_buildings: buildings
                        }
                      })
                    }}
                    placeholder="Enter building names separated by commas (e.g., CS Building, EE Block, Main Building)"
                    rows={2}
                  />
                </div>

                {/* Excluded Rooms */}
                <div className="space-y-3">
                  <Label>Excluded Rooms</Label>
                  <Textarea
                    value={constraints.room_filters?.excluded_rooms?.join(', ') || ''}
                    onChange={(e) => {
                      const rooms = e.target.value.split(',').map(r => r.trim()).filter(Boolean)
                      updateConstraints({
                        room_filters: {
                          ...constraints.room_filters,
                          excluded_rooms: rooms
                        }
                      })
                    }}
                    placeholder="Enter room numbers to exclude (e.g., Lab1, Auditorium, Room-101)"
                    rows={2}
                  />
                </div>

                {/* Capacity Requirements */}
                <div className="space-y-3">
                  <Label>Minimum Capacity Requirements</Label>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="min-classroom-capacity">Classroom Minimum Capacity</Label>
                      <Input
                        id="min-classroom-capacity"
                        type="number"
                        min="10"
                        max="200"
                        placeholder="e.g., 40"
                        value={constraints.room_filters?.capacity_requirements?.classroom || ''}
                        onChange={(e) => {
                          updateConstraints({
                            room_filters: {
                              ...constraints.room_filters,
                              capacity_requirements: {
                                ...constraints.room_filters?.capacity_requirements,
                                classroom: parseInt(e.target.value) || undefined
                              }
                            }
                          })
                        }}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="min-lab-capacity">Lab Minimum Capacity</Label>
                      <Input
                        id="min-lab-capacity"
                        type="number"
                        min="10"
                        max="100"
                        placeholder="e.g., 25"
                        value={constraints.room_filters?.capacity_requirements?.lab || ''}
                        onChange={(e) => {
                          updateConstraints({
                            room_filters: {
                              ...constraints.room_filters,
                              capacity_requirements: {
                                ...constraints.room_filters?.capacity_requirements,
                                lab: parseInt(e.target.value) || undefined
                              }
                            }
                          })
                        }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>

        <Separator />

        {/* Action Buttons */}
        <div className="flex justify-between items-center pt-4">
          <div className="flex gap-2">
            <Button variant="outline" size="sm">
              <Save className="h-4 w-4 mr-2" />
              Save as Template
            </Button>
            <Button variant="outline" size="sm">
              <RotateCcw className="h-4 w-4 mr-2" />
              Reset to Default
            </Button>
          </div>
          
          <Badge variant="secondary" className="text-xs">
            {constraints.working_days.length} days × {constraints.periods_per_day.length} periods = {constraints.working_days.length * constraints.periods_per_day.length} total slots
          </Badge>
        </div>
      </CardContent>
    </Card>
  )
}