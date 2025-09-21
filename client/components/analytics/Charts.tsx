import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  ResponsiveContainer, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  PieChart, 
  Pie, 
  Cell,
  LineChart,
  Line,
  Area,
  AreaChart,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  Legend,
  ComposedChart
} from "recharts";

// Lab & Room Utilization Chart - Enhanced with multiple metrics
export function LabRoomUtilization() {
  const data = [
    { name: "Computer Lab 1", utilization: 85, capacity: 40, currentOccupancy: 34, type: "Computer" },
    { name: "Computer Lab 2", utilization: 72, capacity: 35, currentOccupancy: 25, type: "Computer" },
    { name: "Physics Lab", utilization: 60, capacity: 30, currentOccupancy: 18, type: "Science" },
    { name: "Chemistry Lab", utilization: 78, capacity: 25, currentOccupancy: 20, type: "Science" },
    { name: "Lecture Hall A", utilization: 90, capacity: 150, currentOccupancy: 135, type: "Lecture" },
    { name: "Lecture Hall B", utilization: 65, capacity: 120, currentOccupancy: 78, type: "Lecture" },
    { name: "Seminar Room 1", utilization: 45, capacity: 50, currentOccupancy: 23, type: "Seminar" },
    { name: "Library Study Room", utilization: 95, capacity: 80, currentOccupancy: 76, type: "Study" }
  ];

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-background border border-border rounded-lg p-3 shadow-lg">
          <p className="font-semibold">{label}</p>
          <p className="text-sm text-muted-foreground">Type: {data.type}</p>
          <p className="text-sm">Utilization: <span className="font-medium text-primary">{data.utilization}%</span></p>
          <p className="text-sm">Occupied: <span className="font-medium">{data.currentOccupancy}/{data.capacity}</span></p>
        </div>
      );
    }
    return null;
  };

  // Calculate statistics
  const avgUtilization = Math.round(data.reduce((sum, item) => sum + item.utilization, 0) / data.length);
  const totalCapacity = data.reduce((sum, item) => sum + item.capacity, 0);
  const totalOccupied = data.reduce((sum, item) => sum + item.currentOccupancy, 0);
  const highUtilizationRooms = data.filter(room => room.utilization > 80).length;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Lab & Room Utilization</CardTitle>
        <CardDescription>Real-time space usage across campus facilities</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Statistics Grid */}
        <div className="grid grid-cols-4 gap-4 p-4 bg-muted/50 rounded-lg">
          <div className="text-center">
            <div className="text-2xl font-bold text-primary">{avgUtilization}%</div>
            <div className="text-xs text-muted-foreground">Avg Utilization</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">{totalOccupied}</div>
            <div className="text-xs text-muted-foreground">Students Present</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">{totalCapacity}</div>
            <div className="text-xs text-muted-foreground">Total Capacity</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-orange-600">{highUtilizationRooms}</div>
            <div className="text-xs text-muted-foreground">High Usage</div>
          </div>
        </div>

        {/* Chart */}
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
              <XAxis 
                dataKey="name" 
                stroke="hsl(var(--muted-foreground))" 
                tickLine={false} 
                axisLine={false}
                angle={-45}
                textAnchor="end"
                height={60}
                fontSize={11}
              />
              <YAxis stroke="hsl(var(--muted-foreground))" tickLine={false} axisLine={false} />
              <Tooltip content={<CustomTooltip />} />
              <Bar 
                dataKey="utilization" 
                fill="hsl(var(--primary))" 
                radius={[4, 4, 0, 0]}
                name="Utilization %"
              />
              <Line 
                type="monotone" 
                dataKey="capacity" 
                stroke="hsl(var(--destructive))" 
                strokeWidth={2}
                dot={{ fill: "hsl(var(--destructive))", strokeWidth: 2, r: 3 }}
                name="Capacity"
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>

        {/* Quick Actions */}
        <div className="flex gap-2 pt-2">
          <button className="px-3 py-1 text-xs bg-primary/10 text-primary rounded-full hover:bg-primary/20 transition-colors">
            View Details
          </button>
          <button className="px-3 py-1 text-xs bg-green-500/10 text-green-600 rounded-full hover:bg-green-500/20 transition-colors">
            Book Room
          </button>
          <button className="px-3 py-1 text-xs bg-blue-500/10 text-blue-600 rounded-full hover:bg-blue-500/20 transition-colors">
            Export Report
          </button>
        </div>
      </CardContent>
    </Card>
  );
}

// Faculty Expertise Mapping Chart - Radar chart showing expertise distribution
export function FacultyExpertiseMapping() {
  const expertiseData = [
    { subject: "Computer Science", faculty: 15, expertise: 85, demand: 90 },
    { subject: "Mathematics", faculty: 12, expertise: 78, demand: 75 },
    { subject: "Physics", faculty: 8, expertise: 82, demand: 65 },
    { subject: "Chemistry", faculty: 6, expertise: 75, demand: 60 },
    { subject: "Biology", faculty: 10, expertise: 80, demand: 70 },
    { subject: "English", faculty: 14, expertise: 72, demand: 80 },
    { subject: "Economics", faculty: 7, expertise: 68, demand: 55 },
    { subject: "Management", faculty: 9, expertise: 70, demand: 85 }
  ];

  const departmentData = [
    { department: "CS", beginner: 5, intermediate: 8, expert: 12, total: 25 },
    { department: "Math", beginner: 3, intermediate: 6, expert: 8, total: 17 },
    { department: "Science", beginner: 4, intermediate: 7, expert: 6, total: 17 },
    { department: "Arts", beginner: 6, intermediate: 5, expert: 4, total: 15 },
    { department: "Commerce", beginner: 2, intermediate: 4, expert: 6, total: 12 }
  ];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      <Card>
        <CardHeader>
          <CardTitle>Faculty Expertise by Subject</CardTitle>
        </CardHeader>
        <CardContent className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <RadarChart data={expertiseData}>
              <PolarGrid stroke="hsl(var(--border))" />
              <PolarAngleAxis 
                dataKey="subject" 
                tick={{ fontSize: 12, fill: "hsl(var(--foreground))" }}
              />
              <PolarRadiusAxis 
                angle={90} 
                domain={[0, 100]} 
                tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
              />
              <Radar
                name="Expertise Level"
                dataKey="expertise"
                stroke="hsl(var(--primary))"
                fill="hsl(var(--primary))"
                fillOpacity={0.3}
                strokeWidth={2}
              />
              <Radar
                name="Market Demand"
                dataKey="demand"
                stroke="hsl(var(--destructive))"
                fill="hsl(var(--destructive))"
                fillOpacity={0.1}
                strokeWidth={2}
              />
              <Legend />
              <Tooltip 
                contentStyle={{
                  backgroundColor: "hsl(var(--background))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: "8px"
                }}
              />
            </RadarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Faculty Skill Distribution</CardTitle>
        </CardHeader>
        <CardContent className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={departmentData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
              <XAxis 
                dataKey="department" 
                stroke="hsl(var(--muted-foreground))" 
                tickLine={false} 
                axisLine={false}
              />
              <YAxis stroke="hsl(var(--muted-foreground))" tickLine={false} axisLine={false} />
              <Tooltip 
                contentStyle={{
                  backgroundColor: "hsl(var(--background))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: "8px"
                }}
              />
              <Legend />
              <Bar dataKey="expert" stackId="a" fill="hsl(var(--primary))" name="Expert" radius={[0, 0, 0, 0]} />
              <Bar dataKey="intermediate" stackId="a" fill="hsl(var(--secondary))" name="Intermediate" radius={[0, 0, 0, 0]} />
              <Bar dataKey="beginner" stackId="a" fill="hsl(var(--muted))" name="Beginner" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
}

// Workload Balancer Chart - Shows faculty workload distribution and balance
export function WorkloadBalancer() {
  const workloadData = [
    { 
      faculty: "Dr. Smith", 
      department: "CS", 
      teaching: 18, 
      research: 12, 
      administrative: 8, 
      total: 38,
      efficiency: 92 
    },
    { 
      faculty: "Prof. Johnson", 
      department: "Math", 
      teaching: 20, 
      research: 10, 
      administrative: 5, 
      total: 35,
      efficiency: 88 
    },
    { 
      faculty: "Dr. Williams", 
      department: "Physics", 
      teaching: 16, 
      research: 15, 
      administrative: 6, 
      total: 37,
      efficiency: 95 
    },
    { 
      faculty: "Prof. Brown", 
      department: "Chemistry", 
      teaching: 22, 
      research: 8, 
      administrative: 10, 
      total: 40,
      efficiency: 85 
    },
    { 
      faculty: "Dr. Davis", 
      department: "Biology", 
      teaching: 14, 
      research: 18, 
      administrative: 4, 
      total: 36,
      efficiency: 98 
    },
    { 
      faculty: "Prof. Wilson", 
      department: "English", 
      teaching: 24, 
      research: 6, 
      administrative: 8, 
      total: 38,
      efficiency: 82 
    }
  ];

  const departmentWorkload = [
    { month: "Jan", CS: 32, Math: 28, Physics: 30, Chemistry: 35, Biology: 29 },
    { month: "Feb", CS: 35, Math: 30, Physics: 32, Chemistry: 37, Biology: 31 },
    { month: "Mar", CS: 38, Math: 33, Physics: 35, Chemistry: 40, Biology: 34 },
    { month: "Apr", CS: 40, Math: 35, Physics: 37, Chemistry: 42, Biology: 36 },
    { month: "May", CS: 36, Math: 31, Physics: 33, Chemistry: 38, Biology: 32 },
    { month: "Jun", CS: 30, Math: 26, Physics: 28, Chemistry: 32, Biology: 27 }
  ];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      <Card>
        <CardHeader>
          <CardTitle>Faculty Workload Distribution</CardTitle>
        </CardHeader>
        <CardContent className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={workloadData} margin={{ top: 20, right: 30, left: 20, bottom: 60 }}>
              <XAxis 
                dataKey="faculty" 
                stroke="hsl(var(--muted-foreground))" 
                tickLine={false} 
                axisLine={false}
                angle={-45}
                textAnchor="end"
                height={80}
                fontSize={11}
              />
              <YAxis stroke="hsl(var(--muted-foreground))" tickLine={false} axisLine={false} />
              <Tooltip 
                contentStyle={{
                  backgroundColor: "hsl(var(--background))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: "8px"
                }}
              />
              <Legend />
              <Bar dataKey="teaching" stackId="a" fill="hsl(var(--primary))" name="Teaching Hours" />
              <Bar dataKey="research" stackId="a" fill="hsl(var(--secondary))" name="Research Hours" />
              <Bar dataKey="administrative" stackId="a" fill="hsl(var(--muted))" name="Admin Hours" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Department Workload Trends</CardTitle>
        </CardHeader>
        <CardContent className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={departmentWorkload} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
              <XAxis 
                dataKey="month" 
                stroke="hsl(var(--muted-foreground))" 
                tickLine={false} 
                axisLine={false}
              />
              <YAxis stroke="hsl(var(--muted-foreground))" tickLine={false} axisLine={false} />
              <Tooltip 
                contentStyle={{
                  backgroundColor: "hsl(var(--background))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: "8px"
                }}
              />
              <Legend />
              <Line 
                type="monotone" 
                dataKey="CS" 
                stroke="hsl(var(--primary))" 
                strokeWidth={2}
                dot={{ fill: "hsl(var(--primary))", strokeWidth: 2, r: 4 }}
                name="Computer Science"
              />
              <Line 
                type="monotone" 
                dataKey="Math" 
                stroke="hsl(var(--secondary))" 
                strokeWidth={2}
                dot={{ fill: "hsl(var(--secondary))", strokeWidth: 2, r: 4 }}
                name="Mathematics"
              />
              <Line 
                type="monotone" 
                dataKey="Physics" 
                stroke="hsl(var(--destructive))" 
                strokeWidth={2}
                dot={{ fill: "hsl(var(--destructive))", strokeWidth: 2, r: 4 }}
                name="Physics"
              />
              <Line 
                type="monotone" 
                dataKey="Chemistry" 
                stroke="#22c55e" 
                strokeWidth={2}
                dot={{ fill: "#22c55e", strokeWidth: 2, r: 4 }}
                name="Chemistry"
              />
              <Line 
                type="monotone" 
                dataKey="Biology" 
                stroke="#f59e0b" 
                strokeWidth={2}
                dot={{ fill: "#f59e0b", strokeWidth: 2, r: 4 }}
                name="Biology"
              />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
}

// Infrastructure Utilization Chart - Shows comprehensive campus facility usage
export function InfrastructureUtilization() {
  const facilityData = [
    { 
      facility: "Library", 
      capacity: 500, 
      current: 425, 
      peak: 475, 
      utilization: 85,
      type: "Academic" 
    },
    { 
      facility: "Cafeteria", 
      capacity: 300, 
      current: 180, 
      peak: 285, 
      utilization: 60,
      type: "Dining" 
    },
    { 
      facility: "Gym", 
      capacity: 150, 
      current: 95, 
      peak: 140, 
      utilization: 63,
      type: "Recreation" 
    },
    { 
      facility: "Auditorium", 
      capacity: 800, 
      current: 320, 
      peak: 750, 
      utilization: 40,
      type: "Events" 
    },
    { 
      facility: "Computer Center", 
      capacity: 200, 
      current: 175, 
      peak: 195, 
      utilization: 88,
      type: "Academic" 
    },
    { 
      facility: "Parking", 
      capacity: 1000, 
      current: 780, 
      peak: 950, 
      utilization: 78,
      type: "Transport" 
    }
  ];

  const hourlyUsage = [
    { time: "06:00", Library: 20, Cafeteria: 15, Gym: 45, ComputerCenter: 10, Parking: 30 },
    { time: "08:00", Library: 60, Cafeteria: 80, Gym: 70, ComputerCenter: 85, Parking: 90 },
    { time: "10:00", Library: 85, Cafeteria: 40, Gym: 30, ComputerCenter: 95, Parking: 85 },
    { time: "12:00", Library: 75, Cafeteria: 95, Gym: 25, ComputerCenter: 90, Parking: 80 },
    { time: "14:00", Library: 90, Cafeteria: 85, Gym: 40, ComputerCenter: 88, Parking: 75 },
    { time: "16:00", Library: 95, Cafeteria: 70, Gym: 80, ComputerCenter: 85, Parking: 70 },
    { time: "18:00", Library: 80, Cafeteria: 60, Gym: 90, ComputerCenter: 60, Parking: 60 },
    { time: "20:00", Library: 65, Cafeteria: 30, Gym: 75, ComputerCenter: 40, Parking: 45 },
    { time: "22:00", Library: 35, Cafeteria: 10, Gym: 20, ComputerCenter: 15, Parking: 25 }
  ];

  const utilizationByType = [
    { type: "Academic", count: 2, avgUtilization: 86.5, totalCapacity: 700 },
    { type: "Dining", count: 1, avgUtilization: 60, totalCapacity: 300 },
    { type: "Recreation", count: 1, avgUtilization: 63, totalCapacity: 150 },
    { type: "Events", count: 1, avgUtilization: 40, totalCapacity: 800 },
    { type: "Transport", count: 1, avgUtilization: 78, totalCapacity: 1000 }
  ];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
      <Card className="lg:col-span-2">
        <CardHeader>
          <CardTitle>Real-time Facility Utilization</CardTitle>
        </CardHeader>
        <CardContent className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={facilityData} margin={{ top: 20, right: 30, left: 20, bottom: 60 }}>
              <XAxis 
                dataKey="facility" 
                stroke="hsl(var(--muted-foreground))" 
                tickLine={false} 
                axisLine={false}
                angle={-45}
                textAnchor="end"
                height={80}
                fontSize={11}
              />
              <YAxis stroke="hsl(var(--muted-foreground))" tickLine={false} axisLine={false} />
              <Tooltip 
                contentStyle={{
                  backgroundColor: "hsl(var(--background))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: "8px"
                }}
                formatter={(value, name) => {
                  if (name === "utilization") return [`${value}%`, "Utilization"];
                  return [value, name];
                }}
              />
              <Legend />
              <Bar 
                dataKey="current" 
                fill="hsl(var(--primary))" 
                name="Current Occupancy"
                radius={[4, 4, 0, 0]}
              />
              <Bar 
                dataKey="capacity" 
                fill="hsl(var(--muted))" 
                name="Total Capacity"
                radius={[4, 4, 0, 0]}
                opacity={0.3}
              />
              <Line 
                type="monotone" 
                dataKey="utilization" 
                stroke="hsl(var(--destructive))" 
                strokeWidth={3}
                dot={{ fill: "hsl(var(--destructive))", strokeWidth: 2, r: 5 }}
                name="Utilization %"
              />
            </ComposedChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Utilization by Type</CardTitle>
        </CardHeader>
        <CardContent className="h-80 overflow-hidden">
          <div className="h-full flex flex-col space-y-3">
            {/* Visual Progress Bars - Compact Version */}
            <div className="flex-1 space-y-2 overflow-y-auto">
              {utilizationByType.map((item, index) => (
                <div key={index} className="space-y-1">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center space-x-2">
                      <div 
                        className="w-2 h-2 rounded-full flex-shrink-0"
                        style={{ backgroundColor: COLORS[index % COLORS.length] }}
                      ></div>
                      <span className="font-medium text-xs">{item.type}</span>
                    </div>
                    <span className="text-xs font-semibold">{item.avgUtilization}%</span>
                  </div>
                  
                  <div className="w-full bg-muted rounded-full h-2">
                    <div 
                      className="h-2 rounded-full transition-all duration-500 ease-out"
                      style={{ 
                        width: `${item.avgUtilization}%`,
                        backgroundColor: COLORS[index % COLORS.length]
                      }}
                    ></div>
                  </div>
                  
                  <div className="text-xs text-muted-foreground">
                    {item.totalCapacity} capacity • {item.count} facilities
                  </div>
                </div>
              ))}
            </div>

            {/* Summary Statistics - Compact */}
            <div className="mt-auto p-3 bg-muted/20 rounded-lg flex-shrink-0">
              <div className="grid grid-cols-2 gap-3 text-center">
                <div>
                  <div className="text-sm font-semibold text-primary">
                    {Math.round(utilizationByType.reduce((acc, item) => acc + item.avgUtilization, 0) / utilizationByType.length)}%
                  </div>
                  <div className="text-xs text-muted-foreground">Overall Avg</div>
                </div>
                <div>
                  <div className="text-sm font-semibold">
                    {(utilizationByType.reduce((acc, item) => acc + item.totalCapacity, 0) / 1000).toFixed(1)}K
                  </div>
                  <div className="text-xs text-muted-foreground">Total Capacity</div>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="lg:col-span-2 xl:col-span-3">
        <CardHeader>
          <CardTitle>Hourly Usage Patterns</CardTitle>
        </CardHeader>
        <CardContent className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={hourlyUsage} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
              <XAxis 
                dataKey="time" 
                stroke="hsl(var(--muted-foreground))" 
                tickLine={false} 
                axisLine={false}
              />
              <YAxis stroke="hsl(var(--muted-foreground))" tickLine={false} axisLine={false} />
              <Tooltip 
                contentStyle={{
                  backgroundColor: "hsl(var(--background))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: "8px"
                }}
                formatter={(value) => [`${value}%`, "Utilization"]}
              />
              <Legend />
              <Area
                type="monotone"
                dataKey="Library"
                stackId="1"
                stroke="hsl(var(--primary))"
                fill="hsl(var(--primary))"
                fillOpacity={0.8}
                name="Library"
              />
              <Area
                type="monotone"
                dataKey="Cafeteria"
                stackId="1"
                stroke="hsl(var(--secondary))"
                fill="hsl(var(--secondary))"
                fillOpacity={0.8}
                name="Cafeteria"
              />
              <Area
                type="monotone"
                dataKey="Gym"
                stackId="1"
                stroke="hsl(var(--destructive))"
                fill="hsl(var(--destructive))"
                fillOpacity={0.8}
                name="Gym"
              />
              <Area
                type="monotone"
                dataKey="ComputerCenter"
                stackId="1"
                stroke="#22c55e"
                fill="#22c55e"
                fillOpacity={0.8}
                name="Computer Center"
              />
              <Area
                type="monotone"
                dataKey="Parking"
                stackId="1"
                stroke="#f59e0b"
                fill="#f59e0b"
                fillOpacity={0.8}
                name="Parking"
              />
            </AreaChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
}

const COLORS = ["hsl(var(--primary))", "hsl(var(--accent))", "#22c55e", "#ef4444", "#f59e0b", "#8b5cf6"];

// Clean and Simple Library Occupancy Chart
export function LibraryDonut({ occupied = 310, total = 500 }: { occupied?: number; total?: number }) {
  const percent = Math.min(100, Math.round((occupied / total) * 100));
  
  const occupancyData = [
    { name: "Occupied", value: occupied, percentage: percent },
    { name: "Available", value: total - occupied, percentage: 100 - percent },
  ];

  const floorData = [
    { floor: "Ground", occupied: 75, capacity: 120 },
    { floor: "First", occupied: 95, capacity: 150 },
    { floor: "Second", occupied: 85, capacity: 130 },
    { floor: "Third", occupied: 55, capacity: 100 },
  ];

  return (
    <div className="space-y-4">
      {/* Main Occupancy - Clean and Simple */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">Library Occupancy</CardTitle>
        </CardHeader>
        <CardContent className="relative p-4">
          <div className="flex items-center justify-between">
            {/* Left side - Chart */}
            <div className="w-40 h-40 relative">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie 
                    data={occupancyData} 
                    cx="50%" 
                    cy="50%" 
                    innerRadius={50} 
                    outerRadius={70} 
                    paddingAngle={3} 
                    dataKey="value"
                    stroke="none"
                  >
                    <Cell fill="hsl(var(--primary))" />
                    <Cell fill="hsl(var(--muted))" />
                  </Pie>
                  <Tooltip 
                    formatter={(value: any, name: string) => [
                      `${value} seats`, 
                      name
                    ]}
                    contentStyle={{
                      backgroundColor: "hsl(var(--background))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "8px",
                      fontSize: "14px"
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center">
                  <div className="text-2xl font-bold text-primary">{percent}%</div>
                  <div className="text-xs text-muted-foreground">occupied</div>
                </div>
              </div>
            </div>

            {/* Right side - Statistics */}
            <div className="flex-1 ml-6 space-y-3">
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center p-3 bg-muted/30 rounded-lg">
                  <div className="text-xl font-semibold text-primary">{occupied}</div>
                  <div className="text-sm text-muted-foreground">Occupied</div>
                </div>
                <div className="text-center p-3 bg-muted/30 rounded-lg">
                  <div className="text-xl font-semibold">{total - occupied}</div>
                  <div className="text-sm text-muted-foreground">Available</div>
                </div>
              </div>
              
              <div className="text-center p-3 bg-primary/5 rounded-lg border border-primary/20">
                <div className="text-lg font-semibold">{total}</div>
                <div className="text-sm text-muted-foreground">Total Capacity</div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Floor Distribution - Simplified */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">Floor-wise Occupancy</CardTitle>
        </CardHeader>
        <CardContent className="p-4">
          <div className="space-y-3">
            {floorData.map((floor, index) => {
              const utilization = Math.round((floor.occupied / floor.capacity) * 100);
              return (
                <div key={index} className="flex items-center justify-between p-3 bg-muted/20 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className="w-3 h-3 rounded-full bg-primary"></div>
                    <span className="font-medium">{floor.floor} Floor</span>
                  </div>
                  
                  <div className="flex items-center space-x-4">
                    <div className="text-sm text-muted-foreground">
                      {floor.occupied}/{floor.capacity}
                    </div>
                    
                    <div className="w-20 bg-muted rounded-full h-2">
                      <div 
                        className="bg-primary h-2 rounded-full transition-all duration-300"
                        style={{ width: `${utilization}%` }}
                      ></div>
                    </div>
                    
                    <div className="text-sm font-medium w-12 text-right">
                      {utilization}%
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export function CafeOccupancy({ data }: { data: { name: string; value: number }[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Cafeteria Live Occupancy</CardTitle>
      </CardHeader>
      <CardContent className="h-60">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data}>
            <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" tickLine={false} axisLine={false} />
            <YAxis hide domain={[0, 100]} />
            <Tooltip cursor={{ fill: "hsl(var(--muted)/0.4)" }} />
            <Bar dataKey="value" radius={[6,6,0,0]} fill="hsl(var(--primary))" />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}

// Trending Elective Subjects Chart
export function TrendingElectives() {
  const trendingData = [
    { subject: "AI & Machine Learning", enrollments: 245, trend: 85, category: "Technical" },
    { subject: "Digital Marketing", enrollments: 198, trend: 72, category: "Business" },
    { subject: "Data Science", enrollments: 187, trend: 68, category: "Technical" },
    { subject: "Cybersecurity", enrollments: 165, trend: 65, category: "Technical" },
    { subject: "UX/UI Design", enrollments: 142, trend: 58, category: "Creative" },
    { subject: "Blockchain Technology", enrollments: 128, trend: 52, category: "Technical" },
    { subject: "Social Media Analytics", enrollments: 115, trend: 48, category: "Business" },
    { subject: "Mobile App Development", enrollments: 98, trend: 42, category: "Technical" }
  ];

  const categoryData = [
    { category: "Technical", count: 5, avgEnrollment: 152 },
    { category: "Business", count: 2, avgEnrollment: 156 },
    { category: "Creative", count: 1, avgEnrollment: 142 }
  ];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
      {/* Main Trending Chart */}
      <Card className="lg:col-span-2">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">Trending Elective Subjects</CardTitle>
          <CardDescription>Most popular electives by enrollment numbers</CardDescription>
        </CardHeader>
        <CardContent className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={trendingData.slice(0, 6)} margin={{ top: 20, right: 30, left: 20, bottom: 60 }}>
              <XAxis 
                dataKey="subject" 
                stroke="hsl(var(--muted-foreground))" 
                tickLine={false} 
                axisLine={false}
                angle={-45}
                textAnchor="end"
                height={80}
                fontSize={10}
              />
              <YAxis stroke="hsl(var(--muted-foreground))" tickLine={false} axisLine={false} fontSize={11} />
              <Tooltip 
                contentStyle={{
                  backgroundColor: "hsl(var(--background))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: "8px",
                  fontSize: "12px"
                }}
                formatter={(value, name) => [
                  name === "enrollments" ? `${value} students` : `${value}% growth`,
                  name === "enrollments" ? "Enrollments" : "Trend"
                ]}
              />
              <Bar 
                dataKey="enrollments" 
                fill="hsl(var(--primary))" 
                radius={[4, 4, 0, 0]}
                name="enrollments"
              />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Category Breakdown */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">By Category</CardTitle>
        </CardHeader>
        <CardContent className="h-64">
          <div className="space-y-4">
            {categoryData.map((item, index) => (
              <div key={index} className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="font-medium text-sm">{item.category}</span>
                  <span className="text-xs text-muted-foreground">{item.count} courses</span>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="flex-1 bg-muted rounded-full h-2">
                    <div 
                      className="h-2 rounded-full bg-primary transition-all duration-500"
                      style={{ width: `${(item.avgEnrollment / 200) * 100}%` }}
                    ></div>
                  </div>
                  <span className="text-sm font-semibold w-12 text-right">{item.avgEnrollment}</span>
                </div>
              </div>
            ))}
            
            {/* Quick Stats */}
            <div className="mt-6 p-3 bg-primary/5 rounded-lg border border-primary/20">
              <div className="text-center">
                <div className="text-lg font-semibold text-primary">
                  {trendingData.reduce((acc, item) => acc + item.enrollments, 0)}
                </div>
                <div className="text-xs text-muted-foreground">Total Enrollments</div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
