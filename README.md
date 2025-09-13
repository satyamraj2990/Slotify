# 🎓 Slotify - University Timetable Management System

[![React](https://img.shields.io/badge/React-18.3.1-blue.svg)](https://reactjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9.2-blue.svg)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/Vite-7.1.2-purple.svg)](https://vitejs.dev/)
[![Supabase](https://img.shields.io/badge/Supabase-2.57.2-green.svg)](https://supabase.com/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3.4.17-teal.svg)](https://tailwindcss.com/)
[![Node.js](https://img.shields.io/badge/Node.js-20+-green.svg)](https://nodejs.org/)

> **Slotify** is a comprehensive university management system that streamlines timetable generation, resource allocation, and academic operations with an intuitive interface and powerful automation features.

## 🌟 Features

### 🎯 **Core Functionality**
- **Intelligent Timetable Generation** - AI-powered automatic scheduling with conflict resolution
- **Resource Management** - Classrooms, laboratories, and equipment allocation
- **User Role Management** - Admin, Teacher, and Student dashboards with tailored permissions
- **Real-time Data Synchronization** - Live updates across all users

### 👨‍💼 **Admin Features**
- **Teacher Registration** - Complete teacher onboarding with specializations and availability
- **Course Management** - Comprehensive course creation with theory/practical allocation
- **Leave Request Management** - Automated substitute teacher suggestions and approval workflows
- **Analytics Dashboard** - Resource utilization, attendance tracking, and performance metrics
- **System Operations** - Energy optimization, emergency reallocation, and constraint management

### 👨‍🏫 **Teacher Features**
- **Personal Timetable** - Individual schedule view with real-time updates
- **Office Hours Management** - Bookable consultation slots with student interaction
- **Faculty Directory** - Contact management and expertise showcase
- **Leave Applications** - Digital leave requests with substitute teacher recommendations

### 👨‍🎓 **Student Features**
- **Timetable Viewing** - Personal and department-wide schedule access
- **Library Seat Booking** - Real-time seat availability and reservation system (300+ seats)
- **Office Hours Booking** - Easy faculty consultation scheduling
- **Academic Progress** - Course progress tracking and performance analytics

### 🏢 **Facility Management**
- **Library Management** - 50 lanes × 6 seats with real-time occupancy tracking
- **Room Utilization** - Heatmaps and vacancy analysis
- **Equipment Tracking** - Projectors, AC, microphones, and lab equipment
- **Emergency Protocols** - Automated emergency reallocation and notifications

## 🏗️ System Architecture

### **Frontend Stack**
- **React 18.3.1** - Modern component-based UI framework
- **TypeScript** - Type-safe development with enhanced IDE support
- **Vite** - Lightning-fast build tool and development server
- **Tailwind CSS** - Utility-first CSS framework for rapid styling
- **Framer Motion** - Smooth animations and micro-interactions
- **Radix UI** - Accessible, customizable component primitives
- **React Query** - Server state management and caching
- **React Router** - Client-side routing and navigation

### **Backend & Database**
- **Supabase** - Backend-as-a-Service with PostgreSQL database
- **Row Level Security (RLS)** - Fine-grained access control
- **Real-time Subscriptions** - Live data updates via WebSockets
- **Express.js** - RESTful API endpoints for complex operations
- **Serverless Functions** - Netlify Functions for additional processing

### **Database Schema**
```sql
-- Core Tables
profiles       -- User management (Admin, Teacher, Student)
courses        -- Course catalog with metadata
rooms          -- Classroom and lab resources
timetables     -- Schedule management
office_hours   -- Faculty consultation slots
library_seats  -- Library seating management
leave_requests -- Leave application workflow
```

### **Key Design Patterns**
- **Component Composition** - Reusable UI components with props drilling prevention
- **Custom Hooks** - Business logic abstraction (`use-supabase-data`, `use-toast`)
- **Context Providers** - Global state management for auth and scheduling
- **Type-Safe APIs** - Complete TypeScript coverage with interface definitions
- **Responsive Design** - Mobile-first approach with adaptive layouts

## 🚀 Quick Start

### **Prerequisites**
- **Node.js** 20+ ([Download here](https://nodejs.org/))
- **pnpm** package manager ([Install guide](https://pnpm.io/installation))
- **Supabase** account ([Sign up here](https://supabase.com/))

### **1. Clone & Install**
\`\`\`bash
git clone https://github.com/yourusername/slotify.git
cd slotify
pnpm install
\`\`\`

### **2. Environment Setup**
Create \`.env.local\` in the root directory:
\`\`\`env
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
\`\`\`

### **3. Database Setup**
Run these SQL scripts in your Supabase SQL Editor:

\`\`\`sql
-- 1. Create core schema
-- Copy and run: database-schema.sql

-- 2. Add teacher fields
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS phone text,
ADD COLUMN IF NOT EXISTS subjects text[],
ADD COLUMN IF NOT EXISTS weekly_workload integer,
ADD COLUMN IF NOT EXISTS availability text;

-- 3. Add course fields  
ALTER TABLE public.courses 
ADD COLUMN IF NOT EXISTS theory_practical text,
ADD COLUMN IF NOT EXISTS weekly_lectures integer,
ADD COLUMN IF NOT EXISTS assigned_teacher_id uuid REFERENCES public.profiles(id);

-- 4. Populate sample data
-- Copy and run: complete-timetable-data.sql
\`\`\`

### **4. Launch Development Server**
\`\`\`bash
pnpm dev
\`\`\`

Visit [http://localhost:5173](http://localhost:5173) to see the application running.

### **5. Production Build**
\`\`\`bash
pnpm build
pnpm start
\`\`\`

## 📁 Project Structure

```
slotify/
├── client/                          # Frontend React application
│   ├── components/                  # React components organized by feature
│   │   ├── admin/                  # Admin dashboard components
│   │   │   ├── AdminPanels.tsx     # Data upload, leave requests panels
│   │   │   ├── NEPAdmin.tsx        # NEP compliance admin tools
│   │   │   ├── Operations.tsx      # Energy optimization, emergency reallocation
│   │   │   └── Registry.tsx        # Teacher & course registration forms
│   │   ├── analytics/              # Data visualization components
│   │   │   └── Charts.tsx          # Analytics charts and graphs
│   │   ├── background/             # Visual effects components
│   │   │   ├── NeonBackground.tsx  # Animated background effects
│   │   │   └── Particles.tsx       # Particle system animations
│   │   ├── common/                 # Shared components across roles
│   │   │   ├── ChatAssistant.tsx   # AI chat interface
│   │   │   └── Extras.tsx          # Notifications, room heatmaps
│   │   ├── shared/                 # Cross-platform shared components
│   │   │   └── NEPShared.tsx       # NEP compliance shared utilities
│   │   ├── student/                # Student-specific features
│   │   │   ├── LibrarySeatGrid.tsx # Library seat booking interface
│   │   │   └── ProgressPlanner.tsx # Academic progress tracking
│   │   ├── teacher/                # Teacher-specific features
│   │   │   ├── FacultyDirectory.tsx # Faculty contact directory
│   │   │   └── OfficeHours.tsx     # Office hours management
│   │   ├── timetable/              # Timetable management
│   │   │   └── TimetableGrid.tsx   # Interactive timetable grid
│   │   └── ui/                     # Reusable UI components (shadcn/ui)
│   │       ├── button.tsx          # Button component variants
│   │       ├── card.tsx            # Card layout components
│   │       ├── input.tsx           # Form input components
│   │       ├── dialog.tsx          # Modal dialog components
│   │       └── ...                 # 40+ UI components
│   ├── context/                     # React context providers
│   │   ├── auth.tsx                # Authentication context
│   │   └── scheduler.tsx           # Timetable scheduling context
│   ├── hooks/                      # Custom React hooks
│   │   ├── use-mobile.tsx          # Mobile detection hook
│   │   ├── use-supabase-data.ts    # Supabase data fetching hooks
│   │   └── use-toast.ts            # Toast notification hook
│   ├── lib/                        # Utilities and API clients
│   │   ├── api.ts                  # Complete API layer for all operations
│   │   ├── exporters.ts            # Data export utilities
│   │   ├── supabase.ts             # Supabase client and type definitions
│   │   └── utils.ts                # Utility functions and helpers
│   ├── pages/                      # Route components
│   │   ├── Index.tsx               # Main dashboard page
│   │   ├── Landing.tsx             # Landing page
│   │   ├── Login.tsx               # Authentication page
│   │   └── NotFound.tsx            # 404 error page
│   ├── App.tsx                     # Root application component
│   ├── global.css                  # Global styles and Tailwind imports
│   └── vite-env.d.ts               # Vite TypeScript definitions
├── server/                         # Express.js backend server
│   ├── routes/                     # API route handlers
│   │   └── demo.ts                 # Demo API endpoints
│   ├── index.ts                    # Server entry point
│   └── node-build.ts               # Node.js build configuration
├── shared/                         # Shared TypeScript types and utilities
│   └── api.ts                      # Shared API type definitions
├── netlify/                        # Netlify serverless functions
│   └── functions/
│       └── api.ts                  # Netlify function handlers
├── public/                         # Static assets
│   ├── favicon.ico                 # Site favicon
│   ├── logo-slotify.svg            # Application logo
│   ├── placeholder.svg             # Placeholder images
│   ├── robots.txt                  # SEO robots configuration
│   └── test-gemini.html            # AI integration test page
├── Database Scripts/               # SQL migration and setup scripts
│   ├── database-schema.sql         # Complete database schema
│   ├── add-teacher-fields.sql      # Teacher registration fields
│   ├── add-course-fields.sql       # Course registration fields
│   ├── complete-timetable-data.sql # Sample timetable data
│   ├── rls-safe-sample-data.sql    # RLS-compliant sample data
│   └── database-sample-data.sql    # Initial sample data
├── Configuration Files/            # Project configuration
│   ├── components.json             # shadcn/ui component configuration
│   ├── tailwind.config.ts          # Tailwind CSS configuration
│   ├── tsconfig.json               # TypeScript configuration
│   ├── vite.config.ts              # Vite client build configuration
│   ├── vite.config.server.ts       # Vite server build configuration
│   ├── postcss.config.js           # PostCSS configuration
│   ├── package.json                # Dependencies and scripts
│   ├── pnpm-lock.yaml              # Package manager lock file
│   └── netlify.toml                # Netlify deployment configuration
├── Documentation/                  # Project documentation
│   ├── README.md                   # This comprehensive guide
│   ├── AGENTS.md                   # AI agent integration documentation
│   └── SUPABASE_SETUP.md           # Database setup instructions
└── Environment Files/              # Environment configuration
    ├── .env.example                # Environment variables template
    ├── .gitignore                  # Git ignore patterns
    ├── .prettierrc                 # Code formatting configuration
    └── index.html                  # HTML entry point
```

## 🔧 Configuration Files

### **Tailwind CSS** (\`tailwind.config.ts\`)
- Custom color scheme with CSS variables
- Typography and animation plugins
- Responsive breakpoints and spacing scale

### **TypeScript** (\`tsconfig.json\`)
- Modern ES2020 target with DOM libraries
- Path mapping for clean imports (\`@/*\` → \`./client/*\`)
- Strict type checking with selective relaxation

### **Vite** (\`vite.config.ts\`)
- React SWC for fast compilation
- Path resolution and alias configuration
- Development server with HMR

## 🎨 UI/UX Features

### **Design System**
- **Dark Theme** - Modern dark interface with gradient accents
- **Glass Morphism** - Subtle backdrop blur effects and transparency
- **Neon Accents** - Strategic use of bright colors for CTAs and highlights
- **Smooth Animations** - Framer Motion for page transitions and micro-interactions

### **Responsive Design**
- **Mobile-First** - Optimized for mobile devices with progressive enhancement
- **Adaptive Grids** - Dynamic grid systems that adjust to content and screen size
- **Touch-Friendly** - Large tap targets and gesture-based interactions

### **Accessibility**
- **ARIA Labels** - Complete screen reader support
- **Keyboard Navigation** - Full keyboard accessibility
- **Color Contrast** - WCAG 2.1 AA compliant color schemes
- **Focus Management** - Proper focus indicators and tab ordering

## 🔐 Authentication & Security

### **Supabase Auth**
- Email/password authentication with secure password policies
- JWT token-based sessions with automatic refresh
- Row Level Security (RLS) for data protection
- Role-based access control (Admin, Teacher, Student)

### **Security Features**
- **SQL Injection Prevention** - Parameterized queries and prepared statements
- **XSS Protection** - Content Security Policy and input sanitization
- **CSRF Protection** - SameSite cookies and token validation
- **Rate Limiting** - API endpoint protection against abuse

## 📊 Database Design

### **Entity Relationships**
```
Users (profiles) ←→ Courses (many-to-many via assignments)
Teachers ←→ Office Hours (one-to-many)
Courses ←→ Timetables ←→ Rooms (scheduling relationships)
Students ←→ Library Seats (reservation system)
Teachers ←→ Leave Requests (approval workflow)
```

### **Key Tables**

#### **Profiles** - User Management
```sql
id uuid PRIMARY KEY
email text UNIQUE NOT NULL
role text CHECK (role IN ('admin', 'teacher', 'student'))
first_name, last_name text
phone text
subjects text[]              -- Teacher specializations
weekly_workload integer      -- Teacher hours per week
availability text            -- Teacher schedule preferences
```

#### **Courses** - Academic Catalog
```sql
id uuid PRIMARY KEY
code text UNIQUE NOT NULL    -- Course code (CS101, MAT202)
name text NOT NULL
credits integer DEFAULT 3
department text
theory_practical text        -- "2L+2P" format
weekly_lectures integer      -- Lectures per week
assigned_teacher_id uuid     -- Primary instructor
```

#### **Timetables** - Schedule Management
```sql
id uuid PRIMARY KEY
course_id uuid REFERENCES courses(id)
teacher_id uuid REFERENCES profiles(id)
room_id uuid REFERENCES rooms(id)
day_of_week integer         -- 0=Sunday, 6=Saturday
start_time, end_time text   -- "09:00", "10:30"
semester text, year integer
is_active boolean DEFAULT true
```

## 🚀 Deployment

### **Netlify Deployment**
```bash
# Automated deployment via Git
git push origin main
```
# Manual deployment
```
pnpm build
netlify deploy --prod --dir=dist/spa
```

### **Environment Variables**
```
env
# Supabase Configuration
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```
# Optional: Analytics
```
VITE_GA_TRACKING_ID=G-XXXXXXXXXX
```

### **Build Configuration**
- **Client Build**: \`vite build\` → \`dist/spa/\`
- **Server Build**: \`vite build --config vite.config.server.ts\` → \`dist/server/\`
- **Functions**: Netlify Functions in \`netlify/functions/\`

## 🧪 Testing

### **Test Stack**
- **Vitest** - Unit and integration testing
- **React Testing Library** - Component testing utilities
- **MSW** - API mocking for tests

### **Running Tests**
```
bash
# Run all tests
pnpm test
```

# Watch mode
```
pnpm test --watch
```
# Coverage report
```
pnpm test --coverage
```

## 📈 Performance Optimizations

### **Frontend Optimizations**
- **Code Splitting** - Route-based chunk splitting with React.lazy()
- **Tree Shaking** - Elimination of unused code via ES modules
- **Asset Optimization** - Image compression and WebP conversion
- **CDN Integration** - Static asset delivery via Netlify Edge

### **Backend Optimizations**
- **Database Indexing** - Strategic indexes on frequently queried columns
- **Query Optimization** - Efficient JOINs and selective column fetching
- **Caching Strategy** - React Query for client-side caching
- **Connection Pooling** - Supabase built-in connection management

### **Bundle Analysis**
\`\`\`bash
# Analyze bundle size
pnpm build --analyze

# Generate bundle report
npx vite-bundle-analyzer dist/spa
\`\`\`

## 🤝 Contributing

### **Development Workflow**
1. **Fork** the repository
2. **Create** a feature branch (\`git checkout -b feature/amazing-feature\`)
3. **Commit** your changes (\`git commit -m 'Add amazing feature'\`)
4. **Push** to the branch (\`git push origin feature/amazing-feature\`)
5. **Open** a Pull Request

### **Code Standards**
- **ESLint** - Code linting with React and TypeScript rules
- **Prettier** - Consistent code formatting
- **Conventional Commits** - Structured commit messages
- **Type Safety** - 100% TypeScript coverage

### **Pull Request Guidelines**
- Include comprehensive test coverage
- Update documentation for new features
- Follow existing code patterns and conventions
- Provide clear PR descriptions with screenshots

## 📚 API Documentation

### **Core APIs**

#### **Authentication**
\`\`\`typescript
// Login
const { user, session } = await supabase.auth.signInWithPassword({
  email: 'user@example.com',
  password: 'password'
});

// Get current user
const { data: { user } } = await supabase.auth.getUser();
\`\`\`

#### **Timetable Management**
\`\`\`typescript
// Get all timetables
const timetables = await timetablesApi.getAll();

// Get teacher's timetable
const teacherTimetables = await timetablesApi.getByTeacher(teacherId);

// Create timetable entry
const newEntry = await timetablesApi.create({
  course_id: 'course-uuid',
  teacher_id: 'teacher-uuid',
  room_id: 'room-uuid',
  day_of_week: 1, // Monday
  start_time: '09:00',
  end_time: '10:30'
});
\`\`\`

#### **Resource Management**
\`\`\`typescript
// Library seat management
const seats = await librarySeatsApi.getAll();
await librarySeatsApi.reserve(laneNumber, seatNumber, userId);
await librarySeatsApi.occupy(laneNumber, seatNumber, userId);

// Office hours booking
const officeHours = await officeHoursApi.getAll();
await officeHoursApi.book(hourId, studentId, reason);
\`\`\`

## 🔍 Troubleshooting

### **Common Issues**

#### **Build Errors**
\`\`\`bash
# Clear cache and reinstall
rm -rf node_modules pnpm-lock.yaml
pnpm install

# TypeScript errors
pnpm typecheck
\`\`\`

#### **Database Connection**
- Verify Supabase URL and API keys in \`.env.local\`
- Check RLS policies are properly configured
- Ensure database schema is up to date

#### **Authentication Issues**
- Confirm Supabase Auth settings
- Check email confirmation requirements
- Verify redirect URLs in Supabase dashboard

### **Debug Mode**
\`\`\`bash
# Enable debug logging
DEBUG=slotify:* pnpm dev

# Database query logging
VITE_DEBUG_QUERIES=true pnpm dev
\`\`\`

## 📄 License

This project is licensed under the **MIT License** - see the [LICENSE](LICENSE) file for details.

## 👥 Team

- **Project Lead**: Your Name (@yourusername)
- **Backend Developer**: Team Member (@teammember)
- **UI/UX Designer**: Designer Name (@designer)

## 🙏 Acknowledgments

- **Supabase** - For the excellent backend-as-a-service platform
- **Radix UI** - For accessible component primitives
- **Tailwind CSS** - For the utility-first CSS framework
- **React Community** - For the amazing ecosystem and tools

## 📞 Support

- **Documentation**: [Wiki](https://github.com/yourusername/slotify/wiki)
- **Issues**: [GitHub Issues](https://github.com/yourusername/slotify/issues)
- **Discussions**: [GitHub Discussions](https://github.com/yourusername/slotify/discussions)
- **Email**: support@slotify.dev

---

<div align="center">
  <strong>Made with ❤️ for the education community</strong><br>
  <sub>Star ⭐ this repo if you find it useful!</sub>
</div>
