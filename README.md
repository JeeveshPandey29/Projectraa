## 🚀 Projectraa

A full-stack Project & Hackathon Management Platform

Projectraa is a modern, end-to-end project tracking and innovation management platform designed for universities, hackathons, and project-based learning (PBL) environments. It enables students, teachers, and administrators to collaborate, track progress, and evaluate real-world projects using industry-grade tools.

Unlike basic submission portals, Projectraa manages the entire lifecycle of a project — from idea, team formation, sprints, tasks, reviews, and final submission — all inside one secure web platform.

## 🌟 Features

### 👩‍🎓 Students

- Join or create project teams

- Track tasks, sprints, and deadlines

- Update progress in real time

- Submit projects, videos, and documentation

- Maintain personal profile and activity history

### 👨‍🏫 Teachers

- Create and manage projects

- Assign students to teams

- Monitor progress of all groups

- Review submissions

- Evaluate projects based on defined criteria

### 🛠 Administrators

- Manage teachers and students

- Create academic groups

- Monitor platform-wide analytics

- Control access and data integrity

### 🔐 Authentication

- Projectraa uses Google Firebase Authentication with:

- Google Sign-In

- Email & Password login

- Secure password reset (Forgot Password)

- Role-based onboarding (Student / Teacher / Admin)

- Each user must complete onboarding before accessing the platform.

## ☁️ Tech Stack

### Frontend

- Next.js 15 (App Router)

- React 19

- Tailwind CSS

- shadcn/ui

### Backend & Cloud

- Firebase Authentication

- Firebase Firestore (database)

- Firebase Storage (file uploads)

### Google OAuth

- Tooling

- Bun (package manager)

## 📂 Project Structure

```
src/
  app/              → Next.js routes and pages
  components/       → UI components
  contexts/         → Authentication logic
  lib/              → Firebase & Firestore helpers
  types/            → TypeScript models

``` 

### 🔑 Environment Setup

Create a .env.local file in the project root:

```
NEXT_PUBLIC_FIREBASE_API_KEY=xxxx
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=xxxx
NEXT_PUBLIC_FIREBASE_PROJECT_ID=xxxx
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=xxxx
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=xxxx
NEXT_PUBLIC_FIREBASE_APP_ID=xxxx
```

These values are provided by your Firebase project.

### 🧪 Running Locally

Install dependencies:
```
bun install
```

Start the development server:
```
bun run dev
```

Then open:
```
http://localhost:3000
```

### 🏗 Build for Production
```
bun run build
```

### 🎓 Use Cases

Projectraa is ideal for:

- Hackathons

- University innovation programs

- Capstone projects

- Startup bootcamps

- Research & product-development courses

It ensures students don’t just submit files — they build, track, and ship real products.