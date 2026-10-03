export type UserRole = 'DELEGATE' | 'DEPUTY' | 'STUDENT';

export interface User {
  id: string;
  email: string;
  name: string;
  firstName: string;
  lastName: string;
  avatarUrl: string;
  avatar?: string;
  role: UserRole;
  classId: string | null;
  birthday?: string;
  showBirthdayToClass: boolean;
  themeColor: 'blue' | 'purple' | 'emerald' | 'amber' | 'rose' | 'cyan';
  hiddenCategories?: string[]; // Options or groups hidden by student
  hiddenCourseCategories?: string[];
  completedHomeworkIds?: string[]; // Personal "done" list for homework
  privateNotes?: string;
  privateNotesLastSaved?: string;
  createdAt?: string;
}

export interface ClassInfo {
  id: string;
  name: string;
  schoolName: string;
  academicYear: string;
  delegateIds: string[]; // max 2 titulaires
  deputyIds: string[];   // max 2 suppléants
  pronoteIcalUrl?: string;
  pronoteLastSynced?: string;
  pronoteSyncStatus?: 'idle' | 'syncing' | 'success' | 'error';
  pronoteSyncError?: string;
  homeworkList?: Homework[];
  lessonSessions?: LessonSession[];
  availableGroups?: string[];
  createdAt?: string;
}

export type CourseStatusType =
  | 'normal'
  | 'cancelled'
  | 'modified'
  | 'room_change'
  | 'replacement'
  | 'exceptional'
  | 'exam';

export interface Course {
  id: string;
  classId: string;
  subject: string;
  category?: string; // e.g. "Tronc commun", "Spé Maths", "Spé SVT", "Spé NSI", "Allemand LV2", "Groupe A"
  group?: string;    // e.g. "[2-ESP B3]"
  teacher: string;
  room: string;
  originalRoom?: string;
  dayOfWeek: number; // 1 = Lundi, 2 = Mardi, ..., 5 = Vendredi, 6 = Samedi
  startTime: string; // "08:00"
  endTime: string;   // "10:00"
  color: string;     // Hex or tailwind badge style
  isCancelled?: boolean;
  cancelReason?: string;
  isModified?: boolean;
  modifiedReason?: string;
  statusType?: CourseStatusType;
  statusLabel?: string; // "Cours annulé", "Cours modifié", "Changement de salle", "Remplacement", "Exceptionnel", "Examen"
  lessonContent?: string;
  documents?: string[];
  delegateNote?: {
    authorName: string;
    authorRole: string;
    text: string;
    updatedAt: string;
  };
  createdAt?: string;
}

export interface Homework {
  id: string;
  classId: string;
  subject: string;
  givenDate?: string;     // JJ/MM/AAAA
  dueDate: string;        // JJ/MM/AAAA or YYYY-MM-DD
  dueDateIso?: string;    // YYYY-MM-DD for sorting
  description: string;
  documents?: string[];   // attached document names (displayed as "document sur Pronote")
  group?: string;         // e.g. "[2-ESP B3]"
  delegateNote?: string;
  estimatedTime?: string; // e.g. "20 min"
  links?: { title: string; url: string }[];
  createdAt?: string;
}

export interface LessonSession {
  id: string;
  classId: string;
  subject: string;
  date: string;           // JJ/MM/AAAA or YYYY-MM-DD
  dateIso?: string;       // YYYY-MM-DD for sorting
  title?: string;
  content: string;
  documents?: string[];
  group?: string;
  teacher?: string;
}

export interface PersonalEvent {
  id: string;
  userId: string;
  title: string;
  date: string; // "YYYY-MM-DD"
  startTime: string; // "14:00"
  endTime: string;   // "15:00"
  color: string;
  reminder: string; // "none" | "15min" | "1h" | "1day"
  notes?: string;
  description?: string;
  category?: string;
  createdAt?: string;
}

export interface ClassInvitation {
  id: string;
  classId: string;
  email: string;
  roleTarget: UserRole;
  token: string;
  code?: string;
  invitedBy: string;
  createdAt: string;
  status: 'PENDING' | 'ACCEPTED' | 'REVOKED';
  acceptedAt?: string;
}

export interface AuditLogItem {
  id: string;
  classId: string;
  authorName: string;
  authorRole: string;
  action: string;
  details: string;
  timestamp: string;
}

export type ActiveTab = 'timetable' | 'homework' | 'exams' | 'catchup' | 'chat' | 'messages' | 'profile';
