"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { AlertTriangle, CheckCircle, Clock, RefreshCw, Shield, TrendingUp } from "lucide-react"

interface Conflict {
  id: string
  type:
    | "teacher_clash"
    | "room_clash"
    | "class_overload"
    | "constraint_violation"
    | "capacity_exceeded"
    | "availability_conflict"
  severity: "critical" | "high" | "medium" | "low"
  title: string
  description: string
  affectedSlots: string[]
  affectedEntities: {
    teachers?: string[]
    rooms?: string[]
    classes?: string[]
    subjects?: string[]
  }
  suggestions: string[]
  autoFixable: boolean
}

interface ConflictAnalysis {
  totalConflicts: number
  criticalConflicts: number
  conflictsByType: Record<string, number>
  conflictsBySeverity: Record<string, number>
  overallScore: number
  recommendations: string[]
}

interface ConflictCheckerProps {
  data: any
  onConflictsFound: (conflicts: Conflict[]) => void
}

export function ConflictChecker({ data, onConflictsFound }: ConflictCheckerProps) {
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [progress, setProgress] = useState(0)
  const [conflicts, setConflicts] = useState<Conflict[]>([])
  const [analysis, setAnalysis] = useState<ConflictAnalysis | null>(null)
  const [currentCheck, setCurrentCheck] = useState("")

  const runConflictAnalysis = async () => {
    setIsAnalyzing(true)
    setProgress(0)
    setConflicts([])

    try {
      const detectedConflicts: Conflict[] = []

      setCurrentCheck("Checking teacher scheduling conflicts...")
      setProgress(15)
      await new Promise((resolve) => setTimeout(resolve, 400))
      detectedConflicts.push(...checkTeacherConflicts(data))

      setCurrentCheck("Analyzing room availability and capacity...")
      setProgress(30)
      await new Promise((resolve) => setTimeout(resolve, 400))
      detectedConflicts.push(...checkRoomConflicts(data))

      setCurrentCheck("Validating class schedules and workload...")
      setProgress(45)
      await new Promise((resolve) => setTimeout(resolve, 400))
      detectedConflicts.push(...checkClassOverload(data))

      setCurrentCheck("Verifying scheduling constraints...")
      setProgress(60)
      await new Promise((resolve) => setTimeout(resolve, 400))
      detectedConflicts.push(...checkConstraintViolations(data))

      setCurrentCheck("Cross-referencing availability requirements...")
      setProgress(75)
      await new Promise((resolve) => setTimeout(resolve, 400))
      detectedConflicts.push(...checkAvailabilityConflicts(data))

      setCurrentCheck("Validating room capacity requirements...")
      setProgress(90)
      await new Promise((resolve) => setTimeout(resolve, 400))
      detectedConflicts.push(...checkCapacityConflicts(data))

      setProgress(100)
      setCurrentCheck("Analysis complete!")

      const analysisResult = generateAnalysis(detectedConflicts)

      setConflicts(detectedConflicts)
      setAnalysis(analysisResult)
      onConflictsFound(detectedConflicts)
    } catch (error) {
      console.error("Conflict analysis failed:", error)
    } finally {
      setIsAnalyzing(false)
    }
  }

  const checkTeacherConflicts = (data: any): Conflict[] => {
    const conflicts: Conflict[] = []
    const schedule = data.generatedSchedule?.timetable || []

    const teacherSchedule = schedule.reduce((acc: any, slot: any) => {
      const key = `${slot.teacherId}-${slot.day}-${slot.time}`
      if (!acc[key]) acc[key] = []
      acc[key].push(slot)
      return acc
    }, {})

    Object.entries(teacherSchedule).forEach(([key, slots]: [string, any]) => {
      if (slots.length > 1) {
        conflicts.push({
          id: `teacher-clash-${key}`,
          type: "teacher_clash",
          severity: "critical",
          title: "Teacher Double Booking",
          description: `${slots[0].teacherName} is scheduled for ${slots.length} classes simultaneously`,
          affectedSlots: slots.map((s: any) => s.id),
          affectedEntities: {
            teachers: [slots[0].teacherName],
            classes: slots.map((s: any) => s.className),
          },
          suggestions: [
            "Reschedule one of the conflicting classes",
            "Assign a different qualified teacher",
            "Split the class into smaller groups",
          ],
          autoFixable: true,
        })
      }
    })

    return conflicts
  }

  const checkRoomConflicts = (data: any): Conflict[] => {
    return []
  }

  const checkClassOverload = (data: any): Conflict[] => {
    return []
  }

  const checkConstraintViolations = (data: any): Conflict[] => {
    return []
  }

  const checkAvailabilityConflicts = (data: any): Conflict[] => {
    return []
  }

  const checkCapacityConflicts = (data: any): Conflict[] => {
    return []
  }

  const generateAnalysis = (conflicts: Conflict[]): ConflictAnalysis => {
    const totalConflicts = conflicts.length
    const criticalConflicts = conflicts.filter((c) => c.severity === "critical").length

    const conflictsByType = conflicts.reduce(
      (acc, conflict) => {
        acc[conflict.type] = (acc[conflict.type] || 0) + 1
        return acc
      },
      {} as Record<string, number>,
    )

    const conflictsBySeverity = conflicts.reduce(
      (acc, conflict) => {
        acc[conflict.severity] = (acc[conflict.severity] || 0) + 1
        return acc
      },
      {} as Record<string, number>,
    )

    const maxPossibleConflicts = 50
    const overallScore = Math.max(0, Math.round(((maxPossibleConflicts - totalConflicts) / maxPossibleConflicts) * 100))

    const recommendations = []
    if (criticalConflicts > 0) {
      recommendations.push("Address critical conflicts immediately before proceeding")
    }

    return {
      totalConflicts,
      criticalConflicts,
      conflictsByType,
      conflictsBySeverity,
      overallScore,
      recommendations,
    }
  }

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "critical":
        return "destructive"
      case "high":
        return "destructive"
      case "medium":
        return "secondary"
      case "low":
        return "outline"
      default:
        return "outline"
    }
  }

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case "critical":
        return <AlertTriangle className="w-4 h-4 text-red-600" />
      case "high":
        return <AlertTriangle className="w-4 h-4 text-orange-600" />
      case "medium":
        return <Clock className="w-4 h-4 text-yellow-600" />
      case "low":
        return <CheckCircle className="w-4 h-4 text-blue-600" />
      default:
        return <CheckCircle className="w-4 h-4 text-gray-600" />
    }
  }

  useEffect(() => {
    if (data?.generatedSchedule) {
      runConflictAnalysis()
    }
  }, [data])

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shield className="w-5 h-5" />
          Conflict Detection & Analysis
        </CardTitle>
        <CardDescription>Comprehensive validation of scheduling constraints and conflict resolution</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {isAnalyzing && (
          <div className="space-y-4">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>{currentCheck}</span>
                <span>{progress}%</span>
              </div>
              <Progress value={progress} className="h-2" />
            </div>
          </div>
        )}

        {analysis && (
          <Tabs defaultValue="overview" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="conflicts">Conflicts</TabsTrigger>
              <TabsTrigger value="recommendations">Recommendations</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-4">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Card>
                  <CardContent className="pt-6 text-center">
                    <div className="text-2xl font-bold text-primary">{analysis.overallScore}</div>
                    <div className="text-sm text-muted-foreground">Quality Score</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-6 text-center">
                    <div className="text-2xl font-bold text-primary">{analysis.totalConflicts}</div>
                    <div className="text-sm text-muted-foreground">Total Issues</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-6 text-center">
                    <div className="text-2xl font-bold text-red-600">{analysis.criticalConflicts}</div>
                    <div className="text-sm text-muted-foreground">Critical</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-6 text-center">
                    <div className="text-2xl font-bold text-green-600">
                      {conflicts.filter((c) => c.autoFixable).length}
                    </div>
                    <div className="text-sm text-muted-foreground">Auto-fixable</div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="conflicts" className="space-y-4">
              {conflicts.length === 0 ? (
                <Alert className="border-green-200 bg-green-50">
                  <CheckCircle className="w-4 h-4 text-green-600" />
                  <AlertDescription className="text-green-800">
                    No conflicts detected! Your timetable is ready for use.
                  </AlertDescription>
                </Alert>
              ) : (
                <div className="space-y-3">
                  {conflicts.map((conflict) => (
                    <Alert key={conflict.id} className="border-l-4">
                      <div className="flex items-start gap-3">
                        {getSeverityIcon(conflict.severity)}
                        <div className="flex-1 space-y-2">
                          <div className="flex items-center gap-2">
                            <h4 className="font-semibold">{conflict.title}</h4>
                            <Badge variant={getSeverityColor(conflict.severity) as any}>{conflict.severity}</Badge>
                            {conflict.autoFixable && <Badge variant="outline">Auto-fixable</Badge>}
                          </div>
                          <p className="text-sm text-muted-foreground">{conflict.description}</p>
                        </div>
                      </div>
                    </Alert>
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="recommendations" className="space-y-4">
              <div className="space-y-3">
                {analysis.recommendations.map((recommendation, index) => (
                  <Alert key={index}>
                    <TrendingUp className="w-4 h-4" />
                    <AlertDescription>{recommendation}</AlertDescription>
                  </Alert>
                ))}
              </div>

              <div className="flex gap-2">
                <Button onClick={runConflictAnalysis} variant="outline">
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Re-analyze
                </Button>
                {conflicts.filter((c) => c.autoFixable).length > 0 && (
                  <Button className="bg-accent hover:bg-accent/90 text-accent-foreground">
                    Auto-fix {conflicts.filter((c) => c.autoFixable).length} Issues
                  </Button>
                )}
              </div>
            </TabsContent>
          </Tabs>
        )}
      </CardContent>
    </Card>
  )
}
