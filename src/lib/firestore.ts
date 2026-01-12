import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  addDoc,
  Timestamp,
  DocumentData,
  limit,
} from "firebase/firestore";
import { initializeApp, getApps } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import type {
  User,
  Project,
  Team,
  Sprint,
  Task,
  ProgressLog,
  Meeting,
  Comment,
  ResearchPaper,
  CopyrightPatent,
  ProjectEvaluation,
  Notification,
  StudentGroup,
} from "./types";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
const db = getFirestore(app);

const convertTimestamp = (data: DocumentData) => {
  const result: Record<string, unknown> = { ...data };
  for (const key of Object.keys(result)) {
    if (result[key] instanceof Timestamp) {
      result[key] = (result[key] as Timestamp).toDate();
    }
  }
  return result;
};

export async function getUser(userId: string): Promise<User | null> {
  const docRef = doc(db, "users", userId);
  const docSnap = await getDoc(docRef);
  if (docSnap.exists()) {
    return { id: docSnap.id, ...convertTimestamp(docSnap.data()) } as User;
  }
  return null;
}

export async function createUser(user: Omit<User, "createdAt" | "updatedAt">): Promise<void> {
  const docRef = doc(db, "users", user.id);
  await setDoc(docRef, {
    ...user,
    createdAt: Timestamp.now(),
    updatedAt: Timestamp.now(),
  });
}

export async function updateUser(userId: string, data: Partial<User>): Promise<void> {
  const docRef = doc(db, "users", userId);
  await updateDoc(docRef, { ...data, updatedAt: Timestamp.now() });
}

export async function getProjects(teacherId?: string): Promise<Project[]> {
  let q;
  if (teacherId) {
    q = query(collection(db, "projects"), where("teacherId", "==", teacherId));
  } else {
    q = query(collection(db, "projects"), orderBy("createdAt", "desc"));
  }
  const snapshot = await getDocs(q);
  const projects = snapshot.docs.map((doc) => ({ id: doc.id, ...convertTimestamp(doc.data()) } as Project));
  
  if (teacherId) {
    return projects.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }
  return projects;
}

export async function getProjectsByTeam(teamId: string): Promise<Project[]> {
  const q = query(collection(db, "projects"), where("teamId", "==", teamId));
  const snapshot = await getDocs(q);
  return snapshot.docs
    .map((doc) => ({ id: doc.id, ...convertTimestamp(doc.data()) } as Project))
    .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
}

export async function getProject(projectId: string): Promise<Project | null> {
  const docRef = doc(db, "projects", projectId);
  const docSnap = await getDoc(docRef);
  if (docSnap.exists()) {
    return { id: docSnap.id, ...convertTimestamp(docSnap.data()) } as Project;
  }
  return null;
}

export async function createProject(project: Omit<Project, "id" | "createdAt" | "updatedAt">): Promise<string> {
  const docRef = await addDoc(collection(db, "projects"), {
    ...project,
    createdAt: Timestamp.now(),
    updatedAt: Timestamp.now(),
  });
  return docRef.id;
}

export async function updateProject(projectId: string, data: Partial<Project>): Promise<void> {
  const docRef = doc(db, "projects", projectId);
  await updateDoc(docRef, { ...data, updatedAt: Timestamp.now() });
}

export async function deleteProject(projectId: string): Promise<void> {
  await deleteDoc(doc(db, "projects", projectId));
}

export async function getTeam(teamId: string): Promise<Team | null> {
  const docRef = doc(db, "teams", teamId);
  const docSnap = await getDoc(docRef);
  if (docSnap.exists()) {
    return { id: docSnap.id, ...convertTimestamp(docSnap.data()) } as Team;
  }
  return null;
}

export async function createTeam(team: Omit<Team, "id" | "createdAt">): Promise<string> {
  const docRef = await addDoc(collection(db, "teams"), {
    ...team,
    createdAt: Timestamp.now(),
  });
  return docRef.id;
}

export async function createNotification(notification: Omit<Notification, "id" | "createdAt">): Promise<string> {
  const docRef = await addDoc(collection(db, "notifications"), {
    ...notification,
    createdAt: Timestamp.now(),
  });
  return docRef.id;
}

export async function getTeamNotifications(userId: string): Promise<Notification[]> {
  const q = query(
    collection(db, "notifications"),
    where("userId", "==", userId),
    orderBy("createdAt", "desc"),
    limit(20)
  );
  const snapshot = await getDocs(q);
  return snapshot.docs.map((doc) => ({ id: doc.id, ...convertTimestamp(doc.data()) } as Notification));
}

export async function sendTeamNotification(teamId: string, notification: Omit<Notification, "id" | "userId" | "createdAt">): Promise<void> {
  const team = await getTeam(teamId);
  if (!team) return;

  const notificationPromises = team.memberIds.map(userId => 
    createNotification({
      ...notification,
      userId,
    })
  );

  await Promise.all(notificationPromises);
}

export async function updateTeam(teamId: string, data: Partial<Team>): Promise<void> {
  const docRef = doc(db, "teams", teamId);
  await updateDoc(docRef, data);
}

export async function getSprints(projectId: string): Promise<Sprint[]> {
  const q = query(
    collection(db, "sprints"),
    where("projectId", "==", projectId)
  );
  const snapshot = await getDocs(q);
  return snapshot.docs
    .map((doc) => ({ id: doc.id, ...convertTimestamp(doc.data()) } as Sprint))
    .sort((a, b) => a.sprintNumber - b.sprintNumber);
}

export async function createSprint(sprint: Omit<Sprint, "id" | "createdAt">): Promise<string> {
  const docRef = await addDoc(collection(db, "sprints"), {
    ...sprint,
    createdAt: Timestamp.now(),
  });
  return docRef.id;
}

export async function updateSprint(sprintId: string, data: Partial<Sprint>): Promise<void> {
  const docRef = doc(db, "sprints", sprintId);
  await updateDoc(docRef, data);
}

export async function getTasks(sprintId: string): Promise<Task[]> {
  const q = query(
    collection(db, "tasks"),
    where("sprintId", "==", sprintId)
  );
  const snapshot = await getDocs(q);
  return snapshot.docs
    .map((doc) => ({ id: doc.id, ...convertTimestamp(doc.data()) } as Task))
    .sort((a, b) => a.taskNumber - b.taskNumber);
}

export async function getTasksByProject(projectId: string): Promise<Task[]> {
  const q = query(
    collection(db, "tasks"),
    where("projectId", "==", projectId)
  );
  const snapshot = await getDocs(q);
  return snapshot.docs
    .map((doc) => ({ id: doc.id, ...convertTimestamp(doc.data()) } as Task))
    .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
}

export async function createTask(task: Omit<Task, "id" | "createdAt" | "updatedAt">): Promise<string> {
  const docRef = await addDoc(collection(db, "tasks"), {
    ...task,
    createdAt: Timestamp.now(),
    updatedAt: Timestamp.now(),
  });
  return docRef.id;
}

export async function updateTask(taskId: string, data: Partial<Task>): Promise<void> {
  const docRef = doc(db, "tasks", taskId);
  await updateDoc(docRef, { ...data, updatedAt: Timestamp.now() });
}

export async function deleteTask(taskId: string): Promise<void> {
  await deleteDoc(doc(db, "tasks", taskId));
}

export async function getProgressLogs(projectId: string): Promise<ProgressLog[]> {
  const q = query(
    collection(db, "progressLogs"),
    where("projectId", "==", projectId)
  );
  const snapshot = await getDocs(q);
  return snapshot.docs
    .map((doc) => ({ id: doc.id, ...convertTimestamp(doc.data()) } as ProgressLog))
    .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
}

export async function createProgressLog(log: Omit<ProgressLog, "id" | "createdAt">): Promise<string> {
  const docRef = await addDoc(collection(db, "progressLogs"), {
    ...log,
    createdAt: Timestamp.now(),
  });
  return docRef.id;
}

export async function getMeetings(projectId: string): Promise<Meeting[]> {
  const q = query(
    collection(db, "meetings"),
    where("projectId", "==", projectId)
  );
  const snapshot = await getDocs(q);
  return snapshot.docs
    .map((doc) => ({ id: doc.id, ...convertTimestamp(doc.data()) } as Meeting))
    .sort((a, b) => b.date.getTime() - a.date.getTime());
}

export async function createMeeting(meeting: Omit<Meeting, "id" | "createdAt">): Promise<string> {
  const docRef = await addDoc(collection(db, "meetings"), {
    ...meeting,
    createdAt: Timestamp.now(),
  });
  return docRef.id;
}

export async function updateMeeting(meetingId: string, data: Partial<Meeting>): Promise<void> {
  const docRef = doc(db, "meetings", meetingId);
  await updateDoc(docRef, data);
}

export async function getComments(projectId: string): Promise<Comment[]> {
  const q = query(
    collection(db, "comments"),
    where("projectId", "==", projectId)
  );
  const snapshot = await getDocs(q);
  return snapshot.docs
    .map((doc) => ({ id: doc.id, ...convertTimestamp(doc.data()) } as Comment))
    .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
}

export async function createComment(comment: Omit<Comment, "id" | "createdAt">): Promise<string> {
  const docRef = await addDoc(collection(db, "comments"), {
    ...comment,
    createdAt: Timestamp.now(),
  });
  return docRef.id;
}

export async function getAllUsers(): Promise<User[]> {
  const snapshot = await getDocs(collection(db, "users"));
  return snapshot.docs.map((doc) => ({ id: doc.id, ...convertTimestamp(doc.data()) } as User));
}

export async function getTeamMembers(teamId: string): Promise<User[]> {
  const team = await getTeam(teamId);
  if (!team) return [];
  const users: User[] = [];
  for (const memberId of team.memberIds) {
    const user = await getUser(memberId);
    if (user) users.push(user);
  }
  return users;
}

export async function getResearchPapers(projectId: string): Promise<ResearchPaper[]> {
  const q = query(
    collection(db, "researchPapers"),
    where("projectId", "==", projectId)
  );
  const snapshot = await getDocs(q);
  return snapshot.docs
    .map((doc) => ({ id: doc.id, ...convertTimestamp(doc.data()) } as ResearchPaper))
    .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
}

export async function createResearchPaper(paper: Omit<ResearchPaper, "id" | "createdAt">): Promise<string> {
  const docRef = await addDoc(collection(db, "researchPapers"), {
    ...paper,
    createdAt: Timestamp.now(),
  });
  return docRef.id;
}

export async function getCopyrightPatents(projectId: string): Promise<CopyrightPatent[]> {
  const q = query(
    collection(db, "copyrightPatents"),
    where("projectId", "==", projectId)
  );
  const snapshot = await getDocs(q);
  return snapshot.docs
    .map((doc) => ({ id: doc.id, ...convertTimestamp(doc.data()) } as CopyrightPatent))
    .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
}

export async function createCopyrightPatent(cp: Omit<CopyrightPatent, "id" | "createdAt">): Promise<string> {
  const docRef = await addDoc(collection(db, "copyrightPatents"), {
    ...cp,
    createdAt: Timestamp.now(),
  });
  return docRef.id;
}

export async function updateProjectEvaluation(projectId: string, evaluation: ProjectEvaluation): Promise<void> {
  const docRef = doc(db, "projects", projectId);
  await updateDoc(docRef, { 
    evaluation: {
      ...evaluation,
      updatedAt: Timestamp.now()
    },
    updatedAt: Timestamp.now() 
  });
}

export async function createStudentGroup(group: Omit<StudentGroup, "id" | "createdAt">): Promise<string> {
  const docRef = await addDoc(collection(db, "studentGroups"), {
    ...group,
    createdAt: Timestamp.now(),
  });
  return docRef.id;
}

export async function getStudentGroups(): Promise<StudentGroup[]> {
  const snapshot = await getDocs(collection(db, "studentGroups"));
  return snapshot.docs.map((doc) => ({ id: doc.id, ...convertTimestamp(doc.data()) } as StudentGroup));
}

export async function updateStudentGroup(groupId: string, data: Partial<StudentGroup>): Promise<void> {
  const docRef = doc(db, "studentGroups", groupId);
  await updateDoc(docRef, data);
}

export async function deleteStudentGroup(groupId: string): Promise<void> {
  await deleteDoc(doc(db, "studentGroups", groupId));
}

export async function getTeachers(): Promise<User[]> {
  const q = query(collection(db, "users"), where("role", "==", "teacher"));
  const snapshot = await getDocs(q);
  return snapshot.docs.map((doc) => ({ id: doc.id, ...convertTimestamp(doc.data()) } as User));
}

export async function getStudents(): Promise<User[]> {
  const q = query(collection(db, "users"), where("role", "==", "student"));
  const snapshot = await getDocs(q);
  return snapshot.docs.map((doc) => ({ id: doc.id, ...convertTimestamp(doc.data()) } as User));
}
