export type UserRole = "student" | "teacher" | "admin";

export type TaskStatus = "not_started" | "in_progress" | "completed" | "blocked" | "review";

export type ProjectStatus = "planning" | "active" | "on_hold" | "completed";

export interface User {
  id: string;
  email: string;
  displayName: string;
  photoURL: string | null;
  role: UserRole;
  teamIds: string[];
  enrollmentNumber?: string;
  contactNumber?: string;
  personalEmail?: string;
  collegeEmail?: string;
  cabinNo?: string;
  groupNotificationsEnabled?: boolean;
  parentName?: string;
  parentContact?: string;
  technicalSkills?: string[];
  nonTechnicalSkills?: string[];
  projectRole?: string;
  department?: string;
  designation?: string;
  assignedTeacherIds?: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface StudentGroup {
  id: string;
  name: string;
  studentIds: string[];
  assignedTeacherId: string;
  createdAt: Date;
}

export interface Project {
  id: string;
  name: string;
  description: string;
  domain: string;
  sdg: string;
  percentComplete: number;
  status: ProjectStatus;
  cabinLocation: string;
  techTransferStatus: string;
  achievements: string;
  githubLink: string;
  teamId: string;
  teacherId: string;
  customFields?: CustomField[];
  evaluation?: ProjectEvaluation;
  createdAt: Date;
  updatedAt: Date;
}

export interface CustomField {
  id: string;
  name: string;
  value: string | number | boolean;
  type: "text" | "number" | "date" | "boolean";
}

export interface ProjectEvaluation {
  review1Marks: number;
  review2Marks: number;
  review3Marks: number;
  finalMarks: number;
  totalScore: number;
  feedback: string;
  updatedAt: Date;
}

export interface Team {
  id: string;
  name: string;
  projectId: string;
  memberIds: string[];
  leaderId: string;
  maxMembers?: number;
  createdAt: Date;
}

export interface Notification {
  id: string;
  userId: string;
  type: "team_added" | "team_removed" | "comment" | "task_update" | "meeting";
  message: string;
  link: string;
  read: boolean;
  createdAt: Date;
}

export interface Sprint {
  id: string;
  projectId: string;
  sprintNumber: number;
  name: string;
  startDate: Date;
  endDate: Date;
  status: TaskStatus;
  percentComplete: number;
  createdAt: Date;
}

export interface Task {
  id: string;
  sprintId: string;
  projectId: string;
  taskNumber: number;
  title: string;
  subTasks: string[];
  status: TaskStatus;
  assignedTo: string[];
  assignedDate: Date;
  deadline: Date;
  startDate: Date | null;
  completionDate: Date | null;
  percentComplete: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface ProgressLog {
  id: string;
  projectId: string;
  taskId: string;
  userId: string;
  description: string;
  percentComplete: number;
  nextSteps: string;
  fileUrls: string[];
  createdAt: Date;
}

export interface Meeting {
  id: string;
  projectId: string;
  date: Date;
  attendeeIds: string[];
  agendaPoints: string[];
  actionItems: ActionItem[];
  createdAt: Date;
}

export interface ActionItem {
  description: string;
  assignedTo: string;
  status: TaskStatus;
  dueDate: Date;
}

export interface Comment {
  id: string;
  projectId: string;
  taskId?: string;
  progressLogId?: string;
  userId: string;
  content: string;
  createdAt: Date;
}

export interface ResearchPaper {
  id: string;
  projectId: string;
  title: string;
  authors: string[];
  link: string;
  status: "submitted" | "accepted" | "published";
  details: string;
  doi?: string;
  createdAt: Date;
}

export interface CopyrightPatent {
  id: string;
  projectId: string;
  type: "copyright" | "patent";
  title: string;
  applicationNumber: string;
  status: "pending" | "approved" | "rejected";
  documentUrl?: string;
  createdAt: Date;
}

export const SDG_OPTIONS = [
  "1. No Poverty",
  "2. Zero Hunger",
  "3. Good Health and Well-being",
  "4. Quality Education",
  "5. Gender Equality",
  "6. Clean Water and Sanitation",
  "7. Affordable and Clean Energy",
  "8. Decent Work and Economic Growth",
  "9. Industry, Innovation and Infrastructure",
  "10. Reduced Inequalities",
  "11. Sustainable Cities and Communities",
  "12. Responsible Consumption and Production",
  "13. Climate Action",
  "14. Life Below Water",
  "15. Life on Land",
  "16. Peace, Justice and Strong Institutions",
  "17. Partnerships for the Goals",
];

export const STATUS_COLORS: Record<TaskStatus, string> = {
  not_started: "bg-gray-200 text-gray-800",
  in_progress: "bg-blue-200 text-blue-800",
  completed: "bg-green-200 text-green-800",
  blocked: "bg-red-200 text-red-800",
  review: "bg-yellow-200 text-yellow-800",
};

export const PROJECT_STATUS_COLORS: Record<ProjectStatus, string> = {
  planning: "bg-purple-200 text-purple-800",
  active: "bg-blue-200 text-blue-800",
  on_hold: "bg-yellow-200 text-yellow-800",
  completed: "bg-green-200 text-green-800",
};
