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
import { Download, Play, Settings, AlertCircle, CheckCircle } from 'lucide-react';
import { timetableGenerationApi } from '@/lib/api';

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

export function TimetableGenerator() {
  const [semester, setSemester] = useState('');
  const [year, setYear] = useState(new Date().getFullYear());
  const [isGenerating, setIsGenerating] = useState(false);
  const [result, setResult] = useState<GenerationResult | null>(null);
  const [showAdvanced, setShowAdvanced] = useState(false);
  
  // Advanced constraints
  const [constraints, setConstraints] = useState({
    working_days: [1, 2, 3, 4, 5], // Monday to Friday
    periods_per_day: ['P1', 'P2', 'P3', 'P4', 'P5', 'P6'],
    period_duration_minutes: 60,
    max_daily_periods_per_teacher: 6,
    min_gap_between_periods: 0,
    lunch_break_period: 'P4'
  });

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

    try {
      const response = await timetableGenerationApi.generate({
        semester,
        year,
        constraints: showAdvanced ? constraints : undefined,
        options
      });

      setResult(response);
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
            <Label htmlFor="advanced">Show Advanced Settings</Label>
          </div>

          {/* Advanced Settings */}
          {showAdvanced && (
            <Card className="bg-gray-50">
              <CardHeader>
                <CardTitle className="text-sm">Advanced Constraints</CardTitle>
                <CardDescription className="text-xs">
                  Fine-tune the generation algorithm parameters
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="period-duration">Period Duration (minutes)</Label>
                    <Input
                      id="period-duration"
                      type="number"
                      value={constraints.period_duration_minutes}
                      onChange={(e) => setConstraints({
                        ...constraints,
                        period_duration_minutes: parseInt(e.target.value) || 60
                      })}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="max-periods">Max Daily Periods per Teacher</Label>
                    <Input
                      id="max-periods"
                      type="number"
                      value={constraints.max_daily_periods_per_teacher}
                      onChange={(e) => setConstraints({
                        ...constraints,
                        max_daily_periods_per_teacher: parseInt(e.target.value) || 6
                      })}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="lunch-break">Lunch Break Period</Label>
                    <Select 
                      value={constraints.lunch_break_period} 
                      onValueChange={(value) => setConstraints({
                        ...constraints,
                        lunch_break_period: value
                      })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {constraints.periods_per_day.map((period) => (
                          <SelectItem key={period} value={period}>
                            {period}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="max-attempts">Max Resolve Attempts</Label>
                    <Input
                      id="max-attempts"
                      type="number"
                      value={options.maxResolveAttempts}
                      onChange={(e) => setOptions({
                        ...options,
                        maxResolveAttempts: parseInt(e.target.value) || 1000
                      })}
                    />
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="optimize"
                    checked={options.optimize}
                    onChange={(e) => setOptions({
                      ...options,
                      optimize: e.target.checked
                    })}
                    className="rounded"
                  />
                  <Label htmlFor="optimize">Enable optimization (recommended)</Label>
                </div>
              </CardContent>
            </Card>
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
          {result && (
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
        </CardContent>
      </Card>
    </div>
  );
}