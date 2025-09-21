import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Download, Play, Settings, AlertCircle, CheckCircle, Users, Calendar } from 'lucide-react';
import { timetableGenerationApi } from '@/lib/api';
import { ConflictChecker } from './ConflictChecker';
import { TimetableConfigurator } from './TimetableConfigurator';

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

interface GenerationResult {
  success: boolean;
  message: string;
  data?: {
    timetable: any[];
    unassigned: any[];
    conflicts: string[];
    statistics: {
      total_sessions: number;
      assigned_sessions: number;
      teacher_utilization: Record<string, number>;
      room_utilization: Record<string, number>;
    };
  };
  error?: string;
}

interface MultiClassGenerationResult {
  success: boolean;
  timetable: any[];
  conflicts: any[];
  statistics: {
    totalClasses: number;
    totalSlots: number;
    filledSlots: number;
    efficiency: number;
    teacherUtilization: Record<string, number>;
    roomUtilization: Record<string, number>;
    classDistribution: Record<string, any>;
  };
  classWiseSchedules: Record<string, any[]>;
}

interface TimetableGeneratorProps {
  constraints?: TimetableConstraints;
  onConstraintsChange?: (constraints: TimetableConstraints) => void;
}

export function TimetableGenerator({ constraints: externalConstraints, onConstraintsChange }: TimetableGeneratorProps = {}) {
  const [semester, setSemester] = useState('');
  const [year, setYear] = useState(new Date().getFullYear());
  const [isGenerating, setIsGenerating] = useState(false);
  const [result, setResult] = useState<GenerationResult | null>(null);
  const [multiClassResult, setMultiClassResult] = useState<MultiClassGenerationResult | null>(null);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [generationMode, setGenerationMode] = useState<'single' | 'multi'>('single');
  const [detectedConflicts, setDetectedConflicts] = useState<any[]>([]);
  
  // Use external constraints if provided, otherwise use local state
  const defaultConstraints: TimetableConstraints = {
    working_days: [1, 2, 3, 4, 5, 6], // Monday to Saturday
    periods_per_day: ['P1', 'P2', 'P3', 'P4', 'P5', 'P6'],
    period_timings: {
      'P1': { start: '09:00', end: '09:50' },
      'P2': { start: '10:00', end: '10:50' },
      'P3': { start: '11:00', end: '11:50' },
      'P4': { start: '12:00', end: '12:50' },
      'P5': { start: '14:00', end: '14:50' },
      'P6': { start: '15:00', end: '15:50' }
    },
    period_duration_minutes: 50,
    max_daily_periods_per_teacher: 6,
    max_weekly_periods_per_teacher: 25,
    min_daily_periods_per_section: 4,
    max_daily_periods_per_section: 6,
    min_gap_between_periods: 0,
    lunch_zones: [
      {
        periods: ['P4'],
        mandatory: false,
        departments: []
      }
    ],
    blocked_slots: [],
    room_filters: {
      preferred_buildings: [],
      excluded_rooms: [],
      capacity_requirements: {}
    },
    lunch_break_period: 'P4'
  };
  
  const [localConstraints, setLocalConstraints] = useState<TimetableConstraints>(defaultConstraints);
  
  // Use external constraints if provided, otherwise use local constraints
  const constraints = externalConstraints || localConstraints;
  const setConstraints = onConstraintsChange || setLocalConstraints;

  const [options, setOptions] = useState({
    optimize: true,
    maxResolveAttempts: 1000
  });

  const handleGenerate = async () => {
    if (!semester || !year) {
      alert('Please provide both semester and year');
      return;
    }

    setIsGenerating(true);
    setResult(null);
    setMultiClassResult(null);

    try {
      if (generationMode === 'multi') {
        // Multi-class generation
        const multiClassPayload = {
          semester,
          year,
          constraints,
          options,
          // Additional data for multi-class (you can extend this based on your needs)
          classes: [], // Will be fetched by the API
          teachers: [],
          courses: [],
          rooms: []
        };

        const response = await fetch('/api/timetable/multi-class', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(multiClassPayload),
        });

        const data = await response.json();
        
        if (data.success) {
          setMultiClassResult(data.data);
        } else {
          setResult({
            success: false,
            message: data.message || 'Multi-class generation failed',
            error: data.error
          });
        }
      } else {
        // Single class generation (existing)
        const response = await timetableGenerationApi.generate({
          semester,
          year,
          constraints: showAdvanced ? constraints : undefined,
          options
        });

        setResult(response);
      }
    } catch (error) {
      setResult({
        success: false,
        message: error instanceof Error ? error.message : 'Unknown error occurred',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleExport = async () => {
    if (!semester || !year) {
      alert('Please provide both semester and year');
      return;
    }

    try {
      await timetableGenerationApi.downloadCSV(semester, year);
    } catch (error) {
      alert('Failed to export timetable: ' + (error instanceof Error ? error.message : 'Unknown error'));
    }
  };

  const semesters = [
    { value: 'Fall', label: 'Fall Semester' },
    { value: 'Spring', label: 'Spring Semester' },
    { value: 'Summer', label: 'Summer Semester' }
  ];

  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 5 }, (_, i) => currentYear + i - 2);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Timetable Generator
          </CardTitle>
          <CardDescription>
            Generate optimized timetables using advanced algorithms. This process analyzes courses, teachers, 
            and rooms to create conflict-free schedules.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Generation Mode Selection */}
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Generation Mode</Label>
              <div className="flex gap-4">
                <Button
                  variant={generationMode === 'single' ? 'default' : 'outline'}
                  onClick={() => setGenerationMode('single')}
                  className="flex items-center gap-2"
                >
                  <Calendar className="h-4 w-4" />
                  Single Class
                </Button>
                <Button
                  variant={generationMode === 'multi' ? 'default' : 'outline'}
                  onClick={() => setGenerationMode('multi')}
                  className="flex items-center gap-2"
                >
                  <Users className="h-4 w-4" />
                  Multi-Class
                </Button>
              </div>
              <p className="text-sm text-muted-foreground">
                {generationMode === 'single' 
                  ? 'Generate timetable for individual classes with basic constraints'
                  : 'Generate comprehensive timetables for multiple classes with advanced conflict resolution'
                }
              </p>
            </div>
          </div>

          <Separator />

          {/* Basic Configuration */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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

          {/* Advanced Settings Toggle */}
          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="advanced"
              checked={showAdvanced}
              onChange={(e) => setShowAdvanced(e.target.checked)}
              className="rounded"
            />
            <Label htmlFor="advanced">Show Advanced Configuration</Label>
          </div>

          {/* Enhanced Advanced Configuration */}
          {showAdvanced && (
            <TimetableConfigurator
              constraints={constraints}
              onConstraintsChange={setConstraints}
              showAdvanced={showAdvanced}
            />
          )}

          <Separator />

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3">
            <Button 
              onClick={handleGenerate}
              disabled={isGenerating || !semester || !year}
              className="flex items-center gap-2"
            >
              <Play className="h-4 w-4" />
              {isGenerating ? 'Generating...' : 'Generate Timetable'}
            </Button>

            <Button 
              variant="outline"
              onClick={handleExport}
              disabled={!semester || !year}
              className="flex items-center gap-2"
            >
              <Download className="h-4 w-4" />
              Export Current Timetable
            </Button>
          </div>

          {/* Progress Bar */}
          {isGenerating && (
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Generating timetable...</span>
                <span>Processing</span>
              </div>
              <Progress value={undefined} className="h-2" />
            </div>
          )}

          {/* Results */}
          {(result || multiClassResult) && (
            <div className="space-y-6">
              {/* Single Class Results */}
              {result && generationMode === 'single' && (
                <Alert className={result.success ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}>
                  <div className="flex items-start gap-2">
                    {result.success ? (
                      <CheckCircle className="h-4 w-4 text-green-600 mt-0.5" />
                    ) : (
                      <AlertCircle className="h-4 w-4 text-red-600 mt-0.5" />
                    )}
                    <div className="flex-1">
                      <AlertDescription className={result.success ? 'text-green-800' : 'text-red-800'}>
                        {result.message}
                      </AlertDescription>
                      
                      {result.success && result.data && (
                        <div className="mt-3 space-y-2">
                          <div className="flex flex-wrap gap-2">
                            <Badge variant="secondary">
                              {result.data.statistics.assigned_sessions} / {result.data.statistics.total_sessions} sessions assigned
                            </Badge>
                            <Badge variant={result.data.unassigned.length > 0 ? 'destructive' : 'default'}>
                              {result.data.unassigned.length} unassigned
                            </Badge>
                            <Badge variant={result.data.conflicts.length > 0 ? 'destructive' : 'default'}>
                              {result.data.conflicts.length} conflicts
                            </Badge>
                          </div>
                          
                          {result.data.unassigned.length > 0 && (
                            <div className="text-sm text-amber-700 bg-amber-50 p-2 rounded">
                              Some sessions could not be assigned. Consider adjusting constraints or adding more rooms/time slots.
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </Alert>
              )}

              {/* Multi-Class Results */}
              {multiClassResult && generationMode === 'multi' && (
                <div className="space-y-4">
                  <Alert className={multiClassResult.success ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}>
                    <div className="flex items-start gap-2">
                      {multiClassResult.success ? (
                        <CheckCircle className="h-4 w-4 text-green-600 mt-0.5" />
                      ) : (
                        <AlertCircle className="h-4 w-4 text-red-600 mt-0.5" />
                      )}
                      <div className="flex-1">
                        <AlertDescription className={multiClassResult.success ? 'text-green-800' : 'text-red-800'}>
                          {multiClassResult.success 
                            ? `Multi-class timetable generated successfully with ${multiClassResult.timetable.length} scheduled slots`
                            : `Multi-class generation completed with ${multiClassResult.conflicts.length} conflicts to resolve`
                          }
                        </AlertDescription>
                        
                        <div className="mt-3 space-y-2">
                          <div className="flex flex-wrap gap-2">
                            <Badge variant="secondary">
                              {multiClassResult.statistics.efficiency}% Efficiency
                            </Badge>
                            <Badge variant="default">
                              {multiClassResult.statistics.totalClasses} Classes
                            </Badge>
                            <Badge variant="secondary">
                              {multiClassResult.statistics.filledSlots} / {multiClassResult.statistics.totalSlots} Slots Filled
                            </Badge>
                            <Badge variant={multiClassResult.conflicts.length > 0 ? 'destructive' : 'default'}>
                              {multiClassResult.conflicts.length} Conflicts
                            </Badge>
                          </div>
                        </div>
                      </div>
                    </div>
                  </Alert>

                  {/* Tabbed Results View */}
                  <Tabs defaultValue="overview" className="w-full">
                    <TabsList className="grid w-full grid-cols-3">
                      <TabsTrigger value="overview">Overview</TabsTrigger>
                      <TabsTrigger value="schedules">Class Schedules</TabsTrigger>
                      <TabsTrigger value="analysis">Analysis</TabsTrigger>
                    </TabsList>

                    <TabsContent value="overview" className="space-y-4">
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <Card>
                          <CardContent className="pt-6 text-center">
                            <div className="text-2xl font-bold text-primary">{multiClassResult.statistics.efficiency}%</div>
                            <div className="text-sm text-muted-foreground">Overall Efficiency</div>
                          </CardContent>
                        </Card>
                        <Card>
                          <CardContent className="pt-6 text-center">
                            <div className="text-2xl font-bold text-primary">{multiClassResult.statistics.totalClasses}</div>
                            <div className="text-sm text-muted-foreground">Total Classes</div>
                          </CardContent>
                        </Card>
                        <Card>
                          <CardContent className="pt-6 text-center">
                            <div className="text-2xl font-bold text-primary">{multiClassResult.timetable.length}</div>
                            <div className="text-sm text-muted-foreground">Scheduled Sessions</div>
                          </CardContent>
                        </Card>
                        <Card>
                          <CardContent className="pt-6 text-center">
                            <div className="text-2xl font-bold text-primary">{multiClassResult.conflicts.filter(c => c.severity === 'critical').length}</div>
                            <div className="text-sm text-muted-foreground">Critical Issues</div>
                          </CardContent>
                        </Card>
                      </div>
                    </TabsContent>

                    <TabsContent value="schedules" className="space-y-4">
                      <div className="space-y-4">
                        {Object.entries(multiClassResult.classWiseSchedules).map(([classId, schedule]) => (
                          <Card key={classId}>
                            <CardHeader>
                              <CardTitle className="text-base">Class Schedule - {classId}</CardTitle>
                            </CardHeader>
                            <CardContent>
                              <div className="text-sm text-muted-foreground">
                                {schedule.length} sessions scheduled
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    </TabsContent>

                    <TabsContent value="analysis" className="space-y-4">
                      <ConflictChecker 
                        data={{ generatedSchedule: multiClassResult }} 
                        onConflictsFound={setDetectedConflicts}
                      />
                    </TabsContent>
                  </Tabs>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}