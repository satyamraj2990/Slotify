/*
Slotiफाई - TimetableGenerator (TypeScript)
Server-side timetable generation using heuristics + local search optimization

IMPORTANT: This is a CPU-bound operation and should only run on the server side.
Place this file in: server/lib/timetable-generator.ts
*/

import type { Course, Room, Profile } from "../../shared/api"

// ------------------------- Extended Types for Generator -------------------------

export type DayIndex = 1 | 2 | 3 | 4 | 5 | 6 // Mon..Sat (1-indexed as per your DB)

export interface GeneratorConstraints {
  working_days: DayIndex[]
  periods_per_day: string[] // e.g., ['P1', 'P2', 'P3', 'P4', 'P5', 'P6']
  period_timings: Record<string, { start: string; end: string }> // Period time mappings
  period_duration_minutes: number
  max_daily_periods_per_teacher: number
  max_weekly_periods_per_teacher: number // Weekly limit
  min_daily_periods_per_section: number // NEW: Minimum classes per day per section (4-5)
  max_daily_periods_per_section: number // NEW: Maximum classes per day per section
  min_gap_between_periods: number
  lunch_zones: LunchZone[] // Multiple lunch periods support
}

export interface LunchZone {
  periods: string[] // e.g., ['P4', 'P5'] for extended lunch
  departments?: string[] // Optional: specific departments
  mandatory: boolean // If true, no classes can be scheduled during these periods
}

export interface TeacherAvailability extends Profile {
  subjects: string[]
  weekly_workload: number
  max_daily?: number
  availability_raw?: string // "Mon 9-17, Tue 9-17"
  available_slots?: Set<string> // filled by preprocessing (e.g. "Mon|P1")
  preferred_slots?: Set<string>
}

export interface CourseSession {
  course_id: string
  session_type: "L" | "P" | "T" // Lecture, Practical, Tutorial
  duration_periods: number
  requires_lab?: boolean
  group_size?: number
}

export interface TimetableEntry {
  id?: string
  course_id: string
  teacher_id: string
  room_id: string
  day: DayIndex
  period: string
  session_type: "L" | "P" | "T"
  semester: string
  year: number
  is_active: boolean
  created_at?: string
  updated_at?: string
}

export interface GenerationResult {
  timetable: TimetableEntry[]
  unassigned: CourseSession[]
  conflicts: string[]
  statistics: {
    total_sessions: number
    assigned_sessions: number
    teacher_utilization: Record<string, number>
    room_utilization: Record<string, number>
  }
}

// ------------------------- TimetableGenerator Class -------------------------

export class TimetableGenerator {
  private courses: Course[]
  private teachers: TeacherAvailability[]
  private rooms: Room[]
  private constraints: GeneratorConstraints
  private periods: string[]
  private sessions: CourseSession[]

  constructor(courses: Course[], teachers: TeacherAvailability[], rooms: Room[], constraints: GeneratorConstraints) {
    this.courses = courses
    this.teachers = teachers
    this.rooms = rooms.filter((r) => r.is_available)
    this.constraints = constraints
    this.periods = constraints.periods_per_day
    this.sessions = []

    this.preprocessData()
  }

  // Step 1: Parse course requirements and teacher availability
  private preprocessData() {
    // Parse course theory/practical requirements
    for (const course of this.courses) {
      const courseSessions = this.parseCourseRequirements(course)
      console.log(
        `Course ${course.code} (${course.name}): ${course.theory_practical} -> ${courseSessions.length} sessions`,
      )
      this.sessions.push(...courseSessions)
    }

    console.log(`Total sessions generated: ${this.sessions.length}`)
    console.log(`Total courses processed: ${this.courses.length}`)

    // Parse teacher availability
    for (const teacher of this.teachers) {
      teacher.available_slots = this.parseTeacherAvailability(teacher)
    }
  }

  private parseCourseRequirements(course: Course): CourseSession[] {
    const sessions: CourseSession[] = []
    const tpStr = course.theory_practical || "3L"

    // Parse format like "2L+1P", "3L", "1L+2P"
    const matches = tpStr.match(/(\d+)([LPT])/g) || []

    for (const match of matches) {
      const [, countStr, type] = match.match(/(\d+)([LPT])/) || []
      const count = Number.parseInt(countStr, 10)
      const sessionType = type as "L" | "P" | "T"

      for (let i = 0; i < count; i++) {
        sessions.push({
          course_id: course.id,
          session_type: sessionType,
          duration_periods: sessionType === "P" ? 2 : 1, // Lab sessions need 2 consecutive periods
          requires_lab: sessionType === "P",
          group_size: sessionType === "P" ? Math.ceil(course.max_students / 2) : course.max_students,
        })
      }
    }

    return sessions
  }

  private parseTeacherAvailability(teacher: TeacherAvailability): Set<string> {
    const slots = new Set<string>()

    if (!teacher.availability_raw) {
      // Default: available all working days, all periods (be very permissive)
      for (const day of this.constraints.working_days) {
        for (const period of this.periods) {
          // Only exclude mandatory lunch breaks, allow flexible lunch periods
          const isMandatoryLunch = this.constraints.lunch_zones.some(
            (zone) => zone.mandatory && zone.periods.includes(period),
          )

          if (!isMandatoryLunch) {
            slots.add(`${day}|${period}`)
          }
        }
      }
      console.log(`🧑‍🏫 Teacher ${teacher.id} has ${slots.size} available slots (default)`)
      return slots
    }

    // Parse availability string: "Mon 9-17, Tue 9-17, Wed 14-17"
    const dayPatterns = teacher.availability_raw.split(",")
    const dayMap: Record<string, number> = {
      Mon: 1,
      Tue: 2,
      Wed: 3,
      Thu: 4,
      Fri: 5,
      Sat: 6,
    }

    for (const pattern of dayPatterns) {
      const match = pattern.trim().match(/(\w+)\s+(\d+)-(\d+)/)
      if (match) {
        const [, dayName, startHour, endHour] = match
        const dayIndex = dayMap[dayName] as DayIndex

        if (dayIndex && this.constraints.working_days.includes(dayIndex)) {
          // Use period timings from constraints for accurate mapping
          for (const period of this.periods) {
            const periodTiming = this.constraints.period_timings[period]
            if (periodTiming) {
              const periodStartHour = Number.parseInt(periodTiming.start.split(":")[0])
              const periodEndHour = Number.parseInt(periodTiming.end.split(":")[0])

              // Check if period falls within teacher's available hours
              if (periodStartHour >= Number.parseInt(startHour) && periodEndHour <= Number.parseInt(endHour)) {
                // Skip lunch periods
                if (!this.isLunchPeriod(period, teacher.department)) {
                  slots.add(`${dayIndex}|${period}`)
                }
              }
            }
          }
        }
      }
    }

    return slots
  }

  // Step 2: Initial greedy assignment
  private generateInitialTimetable(): { assigned: TimetableEntry[]; unassigned: CourseSession[] } {
    const assigned: TimetableEntry[] = []
    const unassigned: CourseSession[] = []

    // Sort sessions by priority (practicals first, then by course credits)
    const sortedSessions = [...this.sessions].sort((a, b) => {
      if (a.session_type === "P" && b.session_type !== "P") return -1
      if (a.session_type !== "P" && b.session_type === "P") return 1

      const courseA = this.courses.find((c) => c.id === a.course_id)!
      const courseB = this.courses.find((c) => c.id === b.course_id)!
      return courseB.credits - courseA.credits
    })

    console.log(`Attempting to assign ${sortedSessions.length} sessions...`)

    for (const session of sortedSessions) {
      const course = this.courses.find((c) => c.id === session.course_id)
      const assignment = this.findBestSlot(session, assigned)
      if (assignment) {
        assigned.push(assignment)
        console.log(`✅ Assigned: ${course?.code} ${session.session_type} to ${assignment.day}|${assignment.period}`)
      } else {
        unassigned.push(session)
        console.log(`❌ Failed to assign: ${course?.code} ${session.session_type}`)
      }
    }

    return { assigned, unassigned }
  }

  private findBestSlot(session: CourseSession, existing: TimetableEntry[]): TimetableEntry | null {
    const course = this.courses.find((c) => c.id === session.course_id)!
    const teacher = this.teachers.find((t) => t.id === course.assigned_teacher_id)!

    if (!teacher) return null

    // Find suitable rooms
    const suitableRooms = this.rooms.filter((room) => {
      if (session.requires_lab && room.room_type !== "lab") return false
      if (room.capacity < (session.group_size || course.max_students)) return false
      return true
    })

    if (suitableRooms.length === 0) return null

    // For lab sessions requiring 2 consecutive periods
    if (session.duration_periods === 2) {
      return this.findConsecutiveSlots(session, course, teacher, suitableRooms, existing)
    }

    // Regular single-period sessions
    return this.findSingleSlot(session, course, teacher, suitableRooms, existing)
  }

  private findSingleSlot(
    session: CourseSession,
    course: Course,
    teacher: TeacherAvailability,
    suitableRooms: Room[],
    existing: TimetableEntry[],
  ): TimetableEntry | null {
    const allSlots = []
    for (const day of this.constraints.working_days) {
      for (const period of this.periods) {
        allSlots.push({ day, period })
      }
    }

    allSlots.sort((a, b) => {
      // Prefer morning for theory, afternoon for practicals
      const aIndex = this.periods.indexOf(a.period)
      const bIndex = this.periods.indexOf(b.period)

      if (session.session_type === "L") {
        return aIndex - bIndex // Morning preference for lectures
      } else if (session.session_type === "P") {
        return bIndex - aIndex // Afternoon preference for practicals
      }
      return 0
    })

    for (const { day, period } of allSlots) {
      if (
        this.isLunchPeriod(period, course?.department) &&
        this.constraints.lunch_zones.some((zone) => zone.mandatory && zone.periods.includes(period))
      ) {
        continue
      }

      const slotKey = `${day}|${period}`

      if (teacher.available_slots && teacher.available_slots.size > 0 && !teacher.available_slots.has(slotKey)) {
        continue
      }

      // Try each suitable room
      for (const room of suitableRooms) {
        const candidate: TimetableEntry = {
          course_id: session.course_id,
          teacher_id: teacher.id,
          room_id: room.id,
          day,
          period,
          session_type: session.session_type,
          semester: course.semester,
          year: course.year,
          is_active: true,
        }

        if (this.isValidAssignment(candidate, existing)) {
          console.log(
            `💡 Found slot for ${course.code} ${session.session_type}: Day ${day}, Period ${period}, Room ${room.room_number}`,
          )
          return candidate
        }
      }
    }

    console.log(`⚠️  No valid slot found for ${course.code} ${session.session_type} after checking all possibilities`)
    return null
  }

  // New: Get slots ordered for balanced distribution
  private getBalancedSlotOrder(
    course: Course,
    teacher: TeacherAvailability,
    existing: TimetableEntry[],
  ): Array<{ day: DayIndex; period: string }> {
    const slots: Array<{ day: DayIndex; period: string; score: number }> = []

    // Generate all possible slots with balance scores
    for (const day of this.constraints.working_days) {
      for (const period of this.periods) {
        if (this.isLunchPeriod(period, course?.department)) continue

        const slotKey = `${day}|${period}`
        if (!teacher.available_slots?.has(slotKey)) continue

        // Calculate balance score (lower is better for balanced distribution)
        const score = this.calculateSlotBalanceScore(day, period, course, existing)
        slots.push({ day, period, score })
      }
    }

    // Sort by score (best balanced slots first), then randomize within score groups
    slots.sort((a, b) => {
      if (a.score !== b.score) return a.score - b.score
      return Math.random() - 0.5 // Randomize equal scores
    })

    return slots.map(({ day, period }) => ({ day, period }))
  }

  // Calculate how balanced a slot assignment would be
  private calculateSlotBalanceScore(day: DayIndex, period: string, course: Course, existing: TimetableEntry[]): number {
    let score = 0

    // Filter existing entries for same semester/year (same student group)
    const groupEntries = existing.filter((e) => e.semester === course.semester && e.year === course.year)

    // Penalty for overloaded days (prefer spreading across days)
    const dayLoad = groupEntries.filter((e) => e.day === day).length
    score += dayLoad * 2 // Higher penalty for busy days

    // Penalty for overloaded time periods (prefer spreading across times)
    const periodLoad = groupEntries.filter((e) => e.period === period).length
    score += periodLoad * 3 // Higher penalty for busy periods

    // Bonus for middle periods (avoid too early/late classes)
    const periodIndex = this.periods.indexOf(period)
    const middleIndex = Math.floor(this.periods.length / 2)
    const distanceFromMiddle = Math.abs(periodIndex - middleIndex)
    score += distanceFromMiddle * 0.5 // Small penalty for extreme times

    // Penalty for clustering (avoid consecutive periods on same day)
    const consecutivePenalty = this.calculateConsecutivePenalty(day, period, groupEntries)
    score += consecutivePenalty

    // NEW: Penalty for flexible lunch window (ASC Timetable Creator approach)
    if (this.isFlexibleLunchWindow(period)) {
      score += 4 // Moderate penalty to discourage but not prohibit lunch period classes
    }

    // NEW: Ensure minimum daily spread penalty
    const currentDayCount = groupEntries.filter((e) => e.day === day).length
    if (currentDayCount < this.constraints.min_daily_periods_per_section) {
      score -= 5 // Bonus for filling sparse days
    } else if (currentDayCount >= this.constraints.max_daily_periods_per_section) {
      score += 10 // High penalty for overloading days
    }

    return score
  }

  // Calculate penalty for creating too many consecutive classes
  private calculateConsecutivePenalty(day: DayIndex, period: string, groupEntries: TimetableEntry[]): number {
    const periodIndex = this.periods.indexOf(period)
    const dayEntries = groupEntries.filter((e) => e.day === day)

    let consecutiveCount = 1 // This slot

    // Count consecutive slots before
    for (let i = periodIndex - 1; i >= 0; i--) {
      const prevPeriod = this.periods[i]
      if (dayEntries.some((e) => e.period === prevPeriod)) {
        consecutiveCount++
      } else {
        break
      }
    }

    // Count consecutive slots after
    for (let i = periodIndex + 1; i < this.periods.length; i++) {
      const nextPeriod = this.periods[i]
      if (dayEntries.some((e) => e.period === nextPeriod)) {
        consecutiveCount++
      } else {
        break
      }
    }

    // Penalty increases exponentially for long consecutive blocks
    return consecutiveCount > 2 ? Math.pow(consecutiveCount - 2, 2) : 0
  }

  private findConsecutiveSlots(
    session: CourseSession,
    course: Course,
    teacher: TeacherAvailability,
    suitableRooms: Room[],
    existing: TimetableEntry[],
  ): TimetableEntry | null {
    const allConsecutivePairs = []

    for (const day of this.constraints.working_days) {
      for (let i = 0; i < this.periods.length - 1; i++) {
        const period1 = this.periods[i]
        const period2 = this.periods[i + 1]
        allConsecutivePairs.push({ day, period1, period2 })
      }
    }

    allConsecutivePairs.sort((a, b) => {
      const aIndex = this.periods.indexOf(a.period1)
      const bIndex = this.periods.indexOf(b.period1)
      return aIndex - bIndex // Prefer earlier slots for labs
    })

    for (const { day, period1, period2 } of allConsecutivePairs) {
      // Skip if either period is mandatory lunch
      const isMandatoryLunch1 = this.constraints.lunch_zones.some(
        (zone) => zone.mandatory && zone.periods.includes(period1),
      )
      const isMandatoryLunch2 = this.constraints.lunch_zones.some(
        (zone) => zone.mandatory && zone.periods.includes(period2),
      )

      if (isMandatoryLunch1 || isMandatoryLunch2) continue

      const slot1Key = `${day}|${period1}`
      const slot2Key = `${day}|${period2}`

      if (teacher.available_slots && teacher.available_slots.size > 0) {
        if (!teacher.available_slots.has(slot1Key) || !teacher.available_slots.has(slot2Key)) {
          continue
        }
      }

      // Try each suitable room
      for (const room of suitableRooms) {
        const candidate1: TimetableEntry = {
          course_id: session.course_id,
          teacher_id: teacher.id,
          room_id: room.id,
          day,
          period: period1,
          session_type: session.session_type,
          semester: course.semester,
          year: course.year,
          is_active: true,
        }

        const candidate2: TimetableEntry = {
          course_id: session.course_id,
          teacher_id: teacher.id,
          room_id: room.id,
          day,
          period: period2,
          session_type: session.session_type,
          semester: course.semester,
          year: course.year,
          is_active: true,
        }

        // Check if both slots are valid
        if (
          this.isValidAssignment(candidate1, existing) &&
          this.isValidAssignment(candidate2, [...existing, candidate1])
        ) {
          console.log(`💡 Found consecutive slots for ${course.code}: ${period1}-${period2}`)
          return candidate1 // The caller should handle adding the second slot
        }
      }
    }

    return null
  }

  // Get consecutive slot pairs ordered for balanced distribution
  private getBalancedConsecutiveSlots(
    course: Course,
    teacher: TeacherAvailability,
    existing: TimetableEntry[],
  ): Array<{ day: DayIndex; period1: string; period2: string }> {
    const slotPairs: Array<{ day: DayIndex; period1: string; period2: string; score: number }> = []

    // Generate all possible consecutive slot pairs with balance scores
    for (const day of this.constraints.working_days) {
      for (let i = 0; i < this.periods.length - 1; i++) {
        const period1 = this.periods[i]
        const period2 = this.periods[i + 1]

        if (this.isLunchPeriod(period1, course?.department) || this.isLunchPeriod(period2, course?.department)) continue

        const slot1Key = `${day}|${period1}`
        const slot2Key = `${day}|${period2}`

        if (!teacher.available_slots?.has(slot1Key) || !teacher.available_slots?.has(slot2Key)) continue

        // Calculate balance score for this slot pair
        const score1 = this.calculateSlotBalanceScore(day, period1, course, existing)
        const score2 = this.calculateSlotBalanceScore(day, period2, course, existing)
        const totalScore = score1 + score2

        slotPairs.push({ day, period1, period2, score: totalScore })
      }
    }

    // Sort by score (best balanced first), then randomize within score groups
    slotPairs.sort((a, b) => {
      if (a.score !== b.score) return a.score - b.score
      return Math.random() - 0.5
    })

    return slotPairs.map(({ day, period1, period2 }) => ({ day, period1, period2 }))
  }

  private isValidAssignment(candidate: TimetableEntry, existing: TimetableEntry[]): boolean {
    const slotKey = `${candidate.day}|${candidate.period}`

    // Check for conflicts
    for (const entry of existing) {
      const existingSlotKey = `${entry.day}|${entry.period}`
      if (existingSlotKey === slotKey) {
        // Teacher conflict
        if (entry.teacher_id === candidate.teacher_id) return false
        // Room conflict
        if (entry.room_id === candidate.room_id) return false
        // Student group conflict (same semester/year)
        if (entry.semester === candidate.semester && entry.year === candidate.year) return false
      }
    }

    // Check teacher workload limits
    if (!this.checkTeacherWorkload(candidate.teacher_id, candidate.day, existing)) {
      return false
    }

    return true
  }

  // Enhanced: Check if period is lunch time for given department (ASC Timetable Creator style)
  private isLunchPeriod(period: string, department?: string): boolean {
    for (const lunchZone of this.constraints.lunch_zones) {
      if (lunchZone.periods.includes(period)) {
        // If lunch zone is department-specific, check department
        if (lunchZone.departments && lunchZone.departments.length > 0 && department) {
          return lunchZone.departments.includes(department)
        }
        // If mandatory lunch zone (like LUNCH_BREAK), apply to all
        if (lunchZone.mandatory) {
          return true
        }
        // Flexible lunch window (P4/P5) - allow some scheduling but prefer to avoid
        return false // Don't hard block, just deprioritize
      }
    }
    return false
  }

  // NEW: Check if period is in flexible lunch window (for scoring penalties)
  private isFlexibleLunchWindow(period: string): boolean {
    for (const lunchZone of this.constraints.lunch_zones) {
      if (lunchZone.periods.includes(period) && !lunchZone.mandatory) {
        return true
      }
    }
    return false
  }

  // New: Enhanced teacher workload checking
  private checkTeacherWorkload(teacherId: string, day: DayIndex, existing: TimetableEntry[]): boolean {
    const teacher = this.teachers.find((t) => t.id === teacherId)
    if (!teacher) return false

    const teacherEntries = existing.filter((e) => e.teacher_id === teacherId)

    // Check daily limit
    const dailyCount = teacherEntries.filter((e) => e.day === day).length
    if (dailyCount >= this.constraints.max_daily_periods_per_teacher) {
      return false
    }

    // Check weekly limit
    const weeklyCount = teacherEntries.length
    const weeklyLimit = this.constraints.max_weekly_periods_per_teacher || teacher.weekly_workload || 20
    if (weeklyCount >= weeklyLimit) {
      return false
    }

    return true
  }

  // Step 3: Conflict resolution with backtracking
  private resolveConflicts(
    assigned: TimetableEntry[],
    unassigned: CourseSession[],
    maxAttempts = 1000,
  ): { assigned: TimetableEntry[]; remainingUnassigned: CourseSession[] } {
    let attempts = 0
    const resolved = [...assigned]
    const remaining = [...unassigned]

    while (remaining.length > 0 && attempts < maxAttempts) {
      attempts++
      const session = remaining.shift()!

      // Try to find a slot by potentially moving existing assignments
      const assignment = this.findSlotWithBacktrack(session, resolved)
      if (assignment) {
        resolved.push(assignment)
      } else {
        // Keep as unassigned
        remaining.push(session)
      }
    }

    return { assigned: resolved, remainingUnassigned: remaining }
  }

  private findSlotWithBacktrack(session: CourseSession, existing: TimetableEntry[]): TimetableEntry | null {
    // Try simple assignment first
    const simple = this.findBestSlot(session, existing)
    if (simple) return simple

    // TODO: Implement backtracking logic if needed
    // For now, return null if simple assignment fails
    return null
  }

  // Step 4: Local search optimization
  private optimizeTimetable(timetable: TimetableEntry[], maxIterations = 1000): TimetableEntry[] {
    let current = [...timetable]
    let bestScore = this.evaluateTimetable(current)

    for (let i = 0; i < maxIterations; i++) {
      const neighbor = this.generateNeighbor(current)
      if (!neighbor) continue

      const score = this.evaluateTimetable(neighbor)
      if (score > bestScore) {
        current = neighbor
        bestScore = score
      }
    }

    return current
  }

  private evaluateTimetable(timetable: TimetableEntry[]): number {
    let score = 0

    // Reward: fewer teacher gaps
    const teacherSchedules = new Map<string, TimetableEntry[]>()
    for (const entry of timetable) {
      const schedule = teacherSchedules.get(entry.teacher_id) || []
      schedule.push(entry)
      teacherSchedules.set(entry.teacher_id, schedule)
    }

    teacherSchedules.forEach((schedule) => {
      // Group by day
      const byDay = new Map<DayIndex, TimetableEntry[]>()
      for (const entry of schedule) {
        const daySchedule = byDay.get(entry.day) || []
        daySchedule.push(entry)
        byDay.set(entry.day, daySchedule)
      }

      // Calculate gaps for each day
      byDay.forEach((daySchedule) => {
        if (daySchedule.length <= 1) return

        const periods = daySchedule.map((e) => this.periods.indexOf(e.period)).sort((a, b) => a - b)
        const gaps = periods.slice(1).reduce((sum, period, i) => {
          return sum + (period - periods[i] - 1)
        }, 0)

        score -= gaps * 10 // Penalty for gaps
      })
    })

    return score
  }

  private generateNeighbor(timetable: TimetableEntry[]): TimetableEntry[] | null {
    if (timetable.length < 2) return null

    const neighbor = [...timetable]
    const idx1 = Math.floor(Math.random() * neighbor.length)
    const idx2 = Math.floor(Math.random() * neighbor.length)

    if (idx1 === idx2) return null

    // Swap time slots
    const temp = { day: neighbor[idx1].day, period: neighbor[idx1].period }
    neighbor[idx1].day = neighbor[idx2].day
    neighbor[idx1].period = neighbor[idx2].period
    neighbor[idx2].day = temp.day
    neighbor[idx2].period = temp.period

    // Check if the swap is valid
    if (this.isValidTimetable(neighbor)) {
      return neighbor
    }

    return null
  }

  private isValidTimetable(timetable: TimetableEntry[]): boolean {
    const teacherSlots = new Map<string, Set<string>>()
    const roomSlots = new Map<string, Set<string>>()
    const groupSlots = new Map<string, Set<string>>()

    for (const entry of timetable) {
      const slotKey = `${entry.day}|${entry.period}`

      // Check teacher conflicts
      const teacherSet = teacherSlots.get(entry.teacher_id) || new Set()
      if (teacherSet.has(slotKey)) return false
      teacherSet.add(slotKey)
      teacherSlots.set(entry.teacher_id, teacherSet)

      // Check room conflicts
      const roomSet = roomSlots.get(entry.room_id) || new Set()
      if (roomSet.has(slotKey)) return false
      roomSet.add(slotKey)
      roomSlots.set(entry.room_id, roomSet)

      // Check group conflicts
      const groupKey = `${entry.semester}_${entry.year}`
      const groupSet = groupSlots.get(groupKey) || new Set()
      if (groupSet.has(slotKey)) return false
      groupSet.add(slotKey)
      groupSlots.set(groupKey, groupSet)
    }

    return true
  }

  // NEW: Ensure minimum daily classes per section following ASC Timetable Creator principles
  private ensureMinimumDailyClasses(assigned: TimetableEntry[], unassigned: CourseSession[]): TimetableEntry[] {
    console.log("🔄 Ensuring minimum daily classes...")
    const sectionDailyCount = new Map<string, Map<DayIndex, number>>()

    // Count current daily classes per section
    for (const entry of assigned) {
      const course = this.courses.find((c) => c.id === entry.course_id)
      if (!course) continue

      const sectionKey = `${course.department}_${course.semester}_${course.year}`
      if (!sectionDailyCount.has(sectionKey)) {
        sectionDailyCount.set(sectionKey, new Map())
      }

      const dayMap = sectionDailyCount.get(sectionKey)!
      const currentCount = dayMap.get(entry.day) || 0
      dayMap.set(entry.day, currentCount + 1)
    }

    // Log current section distributions
    for (const [sectionKey, dayMap] of sectionDailyCount) {
      const totalClasses = Array.from(dayMap.values()).reduce((a, b) => a + b, 0)
      console.log(
        `📊 Section ${sectionKey}: ${totalClasses} total classes, Daily: ${Array.from(dayMap.entries())
          .map(([day, count]) => `Day${day}:${count}`)
          .join(", ")}`,
      )
    }

    // Try to reassign unassigned sessions to fill sparse days
    const improvedAssigned = [...assigned]
    const remainingUnassigned: CourseSession[] = []

    for (const session of unassigned) {
      const course = this.courses.find((c) => c.id === session.course_id)
      if (!course) {
        remainingUnassigned.push(session)
        continue
      }

      const sectionKey = `${course.department}_${course.semester}_${course.year}`
      const dayMap = sectionDailyCount.get(sectionKey) || new Map()

      // Find days with less than minimum classes
      let bestDay: DayIndex | null = null
      let minCount = Number.POSITIVE_INFINITY

      for (const day of this.constraints.working_days) {
        const dayCount = dayMap.get(day) || 0
        if (dayCount < this.constraints.min_daily_periods_per_section && dayCount < minCount) {
          minCount = dayCount
          bestDay = day
        }
      }

      // Try to assign to the sparse day
      if (bestDay !== null) {
        const assignment = this.findBestSlotForDay(session, bestDay, improvedAssigned)
        if (assignment) {
          improvedAssigned.push(assignment)
          const newCount = (dayMap.get(bestDay) || 0) + 1
          dayMap.set(bestDay, newCount)
          sectionDailyCount.set(sectionKey, dayMap)
          continue
        }
      }

      remainingUnassigned.push(session)
    }

    return improvedAssigned
  }

  // Helper method to find best slot for a specific day
  private findBestSlotForDay(
    session: CourseSession,
    targetDay: DayIndex,
    existing: TimetableEntry[],
  ): TimetableEntry | null {
    const course = this.courses.find((c) => c.id === session.course_id)!
    const teacher = this.teachers.find((t) => t.id === course.assigned_teacher_id)!

    if (!teacher) return null

    const suitableRooms = this.rooms.filter((room) => {
      if (session.requires_lab && room.room_type !== "lab") return false
      if (room.capacity < (session.group_size || course.max_students)) return false
      return true
    })

    if (suitableRooms.length === 0) return null

    // Try all periods on the target day
    for (const period of this.periods) {
      if (this.isLunchPeriod(period, course.department)) continue

      const candidate: TimetableEntry = {
        course_id: session.course_id,
        teacher_id: teacher.id,
        room_id: suitableRooms[0].id,
        day: targetDay,
        period: period,
        session_type: session.session_type,
        semester: course.semester,
        year: course.year,
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }

      if (this.isValidAssignment(candidate, existing)) {
        return candidate
      }
    }

    return null
  }

  // NEW: Validate timetable quality (ASC Timetable Creator style reporting)
  private validateTimetableQuality(timetable: TimetableEntry[]): any {
    const sectionStats = new Map<
      string,
      {
        dailyDistribution: Map<DayIndex, number>
        totalClasses: number
        department: string
        semester: string
      }
    >()

    // Collect statistics per section
    for (const entry of timetable) {
      const course = this.courses.find((c) => c.id === entry.course_id)
      if (!course) continue

      const sectionKey = `${course.department}_${course.semester}_${course.year}`
      if (!sectionStats.has(sectionKey)) {
        sectionStats.set(sectionKey, {
          dailyDistribution: new Map(),
          totalClasses: 0,
          department: course.department,
          semester: course.semester,
        })
      }

      const stats = sectionStats.get(sectionKey)!
      stats.totalClasses++

      const currentDay = stats.dailyDistribution.get(entry.day) || 0
      stats.dailyDistribution.set(entry.day, currentDay + 1)
    }

    // Analyze quality
    const qualityReport = {
      totalSections: sectionStats.size,
      sectionsWithSparseSchedule: 0,
      sectionsWithOverloadedDays: 0,
      averageClassesPerSection: 0,
      dailyDistributionReport: [] as any[],
    }

    let totalClasses = 0

    for (const [sectionKey, stats] of sectionStats) {
      totalClasses += stats.totalClasses

      const sparseDays = Array.from(stats.dailyDistribution.values()).filter(
        (count) => count < this.constraints.min_daily_periods_per_section,
      ).length

      const overloadedDays = Array.from(stats.dailyDistribution.values()).filter(
        (count) => count > this.constraints.max_daily_periods_per_section,
      ).length

      if (sparseDays > 0) qualityReport.sectionsWithSparseSchedule++
      if (overloadedDays > 0) qualityReport.sectionsWithOverloadedDays++

      qualityReport.dailyDistributionReport.push({
        section: sectionKey,
        department: stats.department,
        semester: stats.semester,
        totalClasses: stats.totalClasses,
        dailyDistribution: Object.fromEntries(stats.dailyDistribution),
        sparseDays,
        overloadedDays,
      })
    }

    qualityReport.averageClassesPerSection = Math.round(totalClasses / sectionStats.size)

    return qualityReport
  }

  // Main generation function
  async generate(options?: { optimize?: boolean; maxResolveAttempts?: number }): Promise<GenerationResult> {
    console.log("\n🚀 =================================")
    console.log("🚀 ENHANCED TIMETABLE GENERATION")
    console.log("🚀 =================================")

    const { assigned, unassigned } = this.generateInitialTimetable()
    console.log(`📊 Initial assignment: ${assigned.length} assigned, ${unassigned.length} unassigned`)

    const resolved = this.resolveConflicts(assigned, unassigned, options?.maxResolveAttempts || 1000)
    console.log(
      `🔧 After conflict resolution: ${resolved.assigned.length} assigned, ${resolved.remainingUnassigned.length} unassigned`,
    )

    // NEW: Ensure minimum daily classes per section (ASC Timetable Creator approach)
    let final = this.ensureMinimumDailyClasses(resolved.assigned, resolved.remainingUnassigned)
    console.log(`✨ After daily minimum enforcement: ${final.length} total sessions`)

    if (options?.optimize !== false) {
      console.log("🔄 Optimizing timetable...")
      final = this.optimizeTimetable(final, 1000)
    }

    // NEW: Final validation to ensure quality standards
    const qualityReport = this.validateTimetableQuality(final)
    console.log("📈 Timetable quality report:", qualityReport)

    const statistics = this.calculateStatistics(final)

    console.log("\n🎯 =================================")
    console.log(`🎯 GENERATION COMPLETE: ${final.length} sessions assigned`)
    console.log(`🎯 Unassigned sessions: ${resolved.remainingUnassigned.length}`)
    console.log(
      `🎯 Success rate: ${Math.round((final.length / (final.length + resolved.remainingUnassigned.length)) * 100)}%`,
    )
    console.log("🎯 =================================\n")

    return {
      timetable: final,
      unassigned: resolved.remainingUnassigned,
      conflicts: [], // TODO: Implement conflict detection
      statistics,
    }
  }

  private calculateStatistics(timetable: TimetableEntry[]) {
    const teacherCounts = new Map<string, number>()
    const roomCounts = new Map<string, number>()

    for (const entry of timetable) {
      teacherCounts.set(entry.teacher_id, (teacherCounts.get(entry.teacher_id) || 0) + 1)
      roomCounts.set(entry.room_id, (roomCounts.get(entry.room_id) || 0) + 1)
    }

    const teacherUtilization: Record<string, number> = {}
    const roomUtilization: Record<string, number> = {}

    teacherCounts.forEach((count, teacherId) => {
      const teacher = this.teachers.find((t) => t.id === teacherId)
      teacherUtilization[teacherId] = teacher ? (count / teacher.weekly_workload) * 100 : 0
    })

    roomCounts.forEach((count, roomId) => {
      const maxSlots = this.constraints.working_days.length * this.periods.length
      roomUtilization[roomId] = (count / maxSlots) * 100
    })

    return {
      total_sessions: this.sessions.length,
      assigned_sessions: timetable.length,
      teacher_utilization: teacherUtilization,
      room_utilization: roomUtilization,
    }
  }

  // Export functions
  exportCSV(timetable: TimetableEntry[]): string {
    const header = ["Day", "Period", "Course", "Teacher", "Room", "Type", "Semester", "Year"]
    const rows = timetable.map((entry) => [
      entry.day.toString(),
      entry.period,
      this.courses.find((c) => c.id === entry.course_id)?.code || entry.course_id,
      this.teachers.find((t) => t.id === entry.teacher_id)?.first_name || entry.teacher_id,
      this.rooms.find((r) => r.id === entry.room_id)?.room_number || entry.room_id,
      entry.session_type,
      entry.semester,
      entry.year.toString(),
    ])

    return [header.join(","), ...rows.map((row) => row.join(","))].join("\n")
  }
}

// ------------------------- Multi-Class Timetable Generator -------------------------

import type { 
  MultiClassTimetableSlot, 
  MultiClassGenerationResult, 
  ConflictReport, 
  GenerationStatistics 
} from "../../shared/api"

export class MultiClassTimetableGenerator {
  private classes: any[]
  private teachers: any[]
  private courses: any[]
  private rooms: any[]
  private timeSlots: string[]
  private days: string[]

  // Advanced tracking structures
  private globalSchedule: Map<string, MultiClassTimetableSlot> // key: "day-time-resource"
  private teacherSchedule: Map<string, Set<string>> // teacherId -> Set of "day-time"
  private roomSchedule: Map<string, Set<string>> // roomId -> Set of "day-time"
  private classSchedule: Map<string, Set<string>> // classId -> Set of "day-time"

  constructor(data: any) {
    this.classes = data.classes || []
    this.teachers = data.teachers || []
    this.courses = data.courses || []
    this.rooms = data.rooms || []
    this.timeSlots = data.timeSlots || [
      "9:00-10:00",
      "10:00-11:00",
      "11:00-12:00",
      "12:00-1:00",
      "2:00-3:00",
      "3:00-4:00",
    ]
    this.days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"]

    // Initialize tracking structures
    this.globalSchedule = new Map()
    this.teacherSchedule = new Map()
    this.roomSchedule = new Map()
    this.classSchedule = new Map()

    this.initializeTrackingStructures()
  }

  private initializeTrackingStructures() {
    // Initialize teacher schedules
    this.teachers.forEach((teacher) => {
      this.teacherSchedule.set(teacher.id, new Set())
    })

    // Initialize room schedules
    this.rooms.forEach((room) => {
      this.roomSchedule.set(room.id, new Set())
    })

    // Initialize class schedules
    this.classes.forEach((classItem) => {
      this.classSchedule.set(classItem.id, new Set())
    })
  }

  async generateMultiClassTimetable(): Promise<MultiClassGenerationResult> {
    console.log("[v0] Starting multi-class timetable generation...")
    console.log(
      `[v0] Processing ${this.classes.length} classes, ${this.teachers.length} teachers, ${this.rooms.length} rooms`,
    )

    const timetable: MultiClassTimetableSlot[] = []
    const conflicts: ConflictReport[] = []
    let slotId = 1

    // Phase 1: Generate sessions for each class with priority-based scheduling
    const classPriorities = this.calculateClassPriorities()
    const sortedClasses = this.classes.sort((a, b) => classPriorities[b.id] - classPriorities[a.id])

    for (const classItem of sortedClasses) {
      console.log(`[v0] Processing class: ${classItem.name}`)

      const classSessions = this.generateClassSessions(classItem)
      console.log(`[v0] Generated ${classSessions.length} sessions for ${classItem.name}`)

      // Schedule sessions with intelligent slot allocation
      for (const session of classSessions) {
        const slot = this.findOptimalSlot(session, classItem, timetable)
        if (slot) {
          const timetableSlot: MultiClassTimetableSlot = {
            id: `slot-${slotId++}`,
            ...slot,
          }

          timetable.push(timetableSlot)
          this.updateTrackingStructures(timetableSlot)
          console.log(`[v0] ✅ Scheduled: ${session.courseCode} for ${classItem.name} on ${slot.day} ${slot.time}`)
        } else {
          console.log(`[v0] ❌ Failed to schedule: ${session.courseCode} for ${classItem.name}`)
          conflicts.push(this.createUnscheduledConflict(session, classItem))
        }
      }
    }

    // Phase 2: Optimize distribution and resolve conflicts
    const optimizedTimetable = this.optimizeMultiClassDistribution(timetable)
    const finalConflicts = this.detectAllConflicts(optimizedTimetable)

    // Phase 3: Generate statistics and class-wise schedules
    const statistics = this.calculateMultiClassStatistics(optimizedTimetable)
    const classWiseSchedules = this.generateClassWiseSchedules(optimizedTimetable)

    console.log(`[v0] Multi-class generation complete: ${optimizedTimetable.length} slots scheduled`)
    console.log(`[v0] Conflicts detected: ${finalConflicts.length}`)

    return {
      success: finalConflicts.filter((c) => c.severity === "critical").length === 0,
      timetable: optimizedTimetable,
      conflicts: [...conflicts, ...finalConflicts],
      statistics,
      classWiseSchedules,
    }
  }

  private calculateClassPriorities(): Record<string, number> {
    const priorities: Record<string, number> = {}

    this.classes.forEach((classItem) => {
      let priority = 0

      // Higher priority for classes with more courses
      priority += classItem.courses.length * 10

      // Higher priority for larger classes (resource constraints)
      priority += classItem.strength * 0.1

      // Higher priority for senior semesters
      const semesterNum = Number.parseInt(classItem.semester.replace(/\D/g, ""))
      priority += semesterNum * 5

      priorities[classItem.id] = priority
    })

    return priorities
  }

  private generateClassSessions(classItem: any) {
    const sessions: any[] = []

    classItem.courses.forEach((courseCode: string) => {
      const course = this.courses.find((c) => c.code === courseCode)
      if (!course) return

      const { theoryCount, practicalCount } = this.parseTheoryPractical(course.theoryPractical)

      // Generate theory sessions
      for (let i = 0; i < theoryCount; i++) {
        sessions.push({
          courseId: course.id,
          courseCode: course.code,
          courseName: course.name,
          sessionType: "L",
          credits: course.credits,
          teacherId: course.assignedTeacherId,
          requiresLab: false,
        })
      }

      // Generate practical sessions
      for (let i = 0; i < practicalCount; i++) {
        sessions.push({
          courseId: course.id,
          courseCode: course.code,
          courseName: course.name,
          sessionType: "P",
          credits: course.credits,
          teacherId: course.assignedTeacherId,
          requiresLab: true,
        })
      }
    })

    return sessions
  }

  private parseTheoryPractical(theoryPractical: string): { theoryCount: number; practicalCount: number } {
    const match = theoryPractical.match(/(\d+)L.*?(\d+)P|(\d+)L|(\d+)P/)
    if (!match) return { theoryCount: 3, practicalCount: 0 } // Default

    const theoryCount = Number.parseInt(match[1] || match[3] || "0")
    const practicalCount = Number.parseInt(match[2] || match[4] || "0")

    return { theoryCount, practicalCount }
  }

  private findOptimalSlot(session: any, classItem: any, existingTimetable: MultiClassTimetableSlot[]) {
    const teacher = this.teachers.find((t) => t.id === session.teacherId)
    if (!teacher) return null

    const suitableRooms = this.rooms.filter((room) => {
      if (session.requiresLab && room.roomType !== "lab") return false
      if (!session.requiresLab && room.roomType === "lab") return false
      return room.capacity >= classItem.strength
    })

    if (suitableRooms.length === 0) return null

    // Score all possible slots
    const slotScores: Array<{
      day: string
      time: string
      room: any
      score: number
    }> = []

    for (const day of this.days) {
      if (!teacher.availability.includes(day)) continue

      for (const time of this.timeSlots) {
        // Skip lunch time
        if (time === "12:00-1:00") continue

        const slotKey = `${day}-${time}`

        // Check if teacher is available
        if (this.teacherSchedule.get(teacher.id)?.has(slotKey)) continue

        // Check if class is available
        if (this.classSchedule.get(classItem.id)?.has(slotKey)) continue

        for (const room of suitableRooms) {
          // Check if room is available
          if (this.roomSchedule.get(room.id)?.has(slotKey)) continue

          let score = 100 // Base score

          // Prefer balanced distribution across days
          const classSlots = this.classSchedule.get(classItem.id) || new Set()
          const daySlots = Array.from(classSlots).filter((slot) => slot.startsWith(day))
          score -= daySlots.length * 15 // Penalty for same day

          // Prefer morning for theory, afternoon for practicals
          const timeIndex = this.timeSlots.indexOf(time)
          if (session.sessionType === "L" && timeIndex < 3) score += 25
          if (session.sessionType === "P" && timeIndex >= 3) score += 25

          // Prefer department-specific rooms
          if (room.building.includes(classItem.department)) score += 15

          // Avoid overloading teachers
          const teacherSlots = this.teacherSchedule.get(teacher.id) || new Set()
          const teacherDaySlots = Array.from(teacherSlots).filter((slot) => slot.startsWith(day))
          if (teacherDaySlots.length >= 6) score -= 50 // Heavy penalty for overload

          slotScores.push({ day, time, room, score })
        }
      }
    }

    // Sort by score and return best slot
    slotScores.sort((a, b) => b.score - a.score)

    if (slotScores.length === 0) return null

    const best = slotScores[0]
    return {
      day: best.day,
      time: best.time,
      classId: classItem.id,
      className: classItem.name,
      courseId: session.courseId,
      courseName: session.courseName,
      courseCode: session.courseCode,
      teacherId: teacher.id,
      teacherName: teacher.name,
      roomId: best.room.id,
      roomName: best.room.roomNumber,
      credits: session.credits,
      theoryPractical: session.sessionType,
      sessionType: session.sessionType,
    }
  }

  private updateTrackingStructures(slot: MultiClassTimetableSlot) {
    const slotKey = `${slot.day}-${slot.time}`

    // Update teacher schedule
    this.teacherSchedule.get(slot.teacherId)?.add(slotKey)

    // Update room schedule
    this.roomSchedule.get(slot.roomId)?.add(slotKey)

    // Update class schedule
    this.classSchedule.get(slot.classId)?.add(slotKey)

    // Update global schedule
    const globalKey = `${slot.day}-${slot.time}-${slot.teacherId}-${slot.roomId}`
    this.globalSchedule.set(globalKey, slot)
  }

  private optimizeMultiClassDistribution(timetable: MultiClassTimetableSlot[]): MultiClassTimetableSlot[] {
    console.log("[v0] Optimizing multi-class distribution...")

    // Group by class to analyze distribution
    const classTimetables = new Map<string, MultiClassTimetableSlot[]>()
    timetable.forEach((slot) => {
      if (!classTimetables.has(slot.classId)) {
        classTimetables.set(slot.classId, [])
      }
      classTimetables.get(slot.classId)!.push(slot)
    })

    // Check for uneven distribution and try to balance
    const optimized = [...timetable]

    classTimetables.forEach((classSlots, classId) => {
      const dailyDistribution = new Map<string, number>()

      classSlots.forEach((slot) => {
        dailyDistribution.set(slot.day, (dailyDistribution.get(slot.day) || 0) + 1)
      })

      // Find overloaded and underloaded days
      const maxDaily = Math.max(...Array.from(dailyDistribution.values()))
      const minDaily = Math.min(...Array.from(dailyDistribution.values()))

      if (maxDaily - minDaily > 2) {
        console.log(`[v0] Balancing distribution for class ${classId}: max=${maxDaily}, min=${minDaily}`)
        // Implementation for rebalancing would go here
      }
    })

    return optimized
  }

  private detectAllConflicts(timetable: MultiClassTimetableSlot[]): ConflictReport[] {
    const conflicts: ConflictReport[] = []

    // Teacher conflicts
    const teacherSlots = new Map<string, MultiClassTimetableSlot[]>()
    timetable.forEach((slot) => {
      const key = `${slot.teacherId}-${slot.day}-${slot.time}`
      if (!teacherSlots.has(key)) {
        teacherSlots.set(key, [])
      }
      teacherSlots.get(key)!.push(slot)
    })

    teacherSlots.forEach((slots, key) => {
      if (slots.length > 1) {
        conflicts.push({
          type: "teacher_clash",
          severity: "critical",
          description: `Teacher ${slots[0].teacherName} is scheduled for ${slots.length} classes simultaneously`,
          affectedClasses: slots.map((s) => s.className),
          affectedSlots: slots.map((s) => s.id),
          suggestions: ["Reschedule conflicting classes", "Assign different teachers", "Change time slots"],
          autoFixable: true,
        })
      }
    })

    // Room conflicts
    const roomSlots = new Map<string, MultiClassTimetableSlot[]>()
    timetable.forEach((slot) => {
      const key = `${slot.roomId}-${slot.day}-${slot.time}`
      if (!roomSlots.has(key)) {
        roomSlots.set(key, [])
      }
      roomSlots.get(key)!.push(slot)
    })

    roomSlots.forEach((slots, key) => {
      if (slots.length > 1) {
        conflicts.push({
          type: "room_clash",
          severity: "critical",
          description: `Room ${slots[0].roomName} is double-booked for ${slots.length} classes`,
          affectedClasses: slots.map((s) => s.className),
          affectedSlots: slots.map((s) => s.id),
          suggestions: ["Assign different rooms", "Change time slots", "Use alternative venues"],
          autoFixable: true,
        })
      }
    })

    return conflicts
  }

  private calculateMultiClassStatistics(timetable: MultiClassTimetableSlot[]): GenerationStatistics {
    const totalSlots = this.classes.length * this.days.length * this.timeSlots.length
    const filledSlots = timetable.length
    const efficiency = (filledSlots / totalSlots) * 100

    // Teacher utilization
    const teacherUtilization: Record<string, number> = {}
    this.teachers.forEach((teacher) => {
      const teacherSlots = timetable.filter((slot) => slot.teacherId === teacher.id).length
      const maxSlots = this.days.length * this.timeSlots.length
      teacherUtilization[teacher.name] = (teacherSlots / maxSlots) * 100
    })

    // Room utilization
    const roomUtilization: Record<string, number> = {}
    this.rooms.forEach((room) => {
      const roomSlots = timetable.filter((slot) => slot.roomId === room.id).length
      const maxSlots = this.days.length * this.timeSlots.length
      roomUtilization[room.roomNumber] = (roomSlots / maxSlots) * 100
    })

    // Class distribution
    const classDistribution: Record<string, { daily: Record<string, number>; total: number }> = {}
    this.classes.forEach((classItem) => {
      const classSlots = timetable.filter((slot) => slot.classId === classItem.id)
      const daily: Record<string, number> = {}

      this.days.forEach((day) => {
        daily[day] = classSlots.filter((slot) => slot.day === day).length
      })

      classDistribution[classItem.name] = {
        daily,
        total: classSlots.length,
      }
    })

    return {
      totalClasses: this.classes.length,
      totalSlots,
      filledSlots,
      efficiency: Math.round(efficiency),
      teacherUtilization,
      roomUtilization,
      classDistribution,
      conflictSummary: {},
    }
  }

  private generateClassWiseSchedules(timetable: MultiClassTimetableSlot[]): Record<string, MultiClassTimetableSlot[]> {
    const classWiseSchedules: Record<string, MultiClassTimetableSlot[]> = {}

    this.classes.forEach((classItem) => {
      classWiseSchedules[classItem.id] = timetable
        .filter((slot) => slot.classId === classItem.id)
        .sort((a, b) => {
          const dayOrder = this.days.indexOf(a.day) - this.days.indexOf(b.day)
          if (dayOrder !== 0) return dayOrder
          return this.timeSlots.indexOf(a.time) - this.timeSlots.indexOf(b.time)
        })
    })

    return classWiseSchedules
  }

  private createUnscheduledConflict(session: any, classItem: any): ConflictReport {
    return {
      type: "resource_shortage",
      severity: "high",
      description: `Unable to schedule ${session.courseCode} for ${classItem.name} - insufficient resources or conflicts`,
      affectedClasses: [classItem.name],
      affectedSlots: [],
      suggestions: [
        "Add more rooms or time slots",
        "Reduce class sizes",
        "Hire additional teachers",
        "Adjust course requirements",
      ],
      autoFixable: false,
    }
  }
}