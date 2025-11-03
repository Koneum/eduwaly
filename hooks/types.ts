// ============================================
// TYPES POUR LES PARAMÈTRES DE ROUTES
// ============================================

export interface PageParams {
  schoolId: string;
}

export interface StudentPageParams extends PageParams {
  studentId?: string;
}

export interface TeacherPageParams extends PageParams {
  teacherId?: string;
}

export interface ParentPageParams extends PageParams {
  parentId?: string;
}

// ============================================
// TYPES POUR LES MODÈLES PRISMA
// ============================================

export interface Student {
  id: string;
  userId?: string | null;
  schoolId: string;
  studentNumber: string;
  enrollmentId: string;
  filiereId?: string | null;
  niveau: string;
  dateOfBirth?: Date | null;
  placeOfBirth?: string | null;
  address?: string | null;
  phone?: string | null;
  isEnrolled: boolean;
  createdAt: Date;
  updatedAt: Date;
  user?: {
    id: string;
    name: string;
    email: string;
    avatar?: string | null;
  } | null;
  filiere?: {
    id: string;
    nom: string;
  } | null;
}

export interface Teacher {
  id: string;
  nom: string;
  prenom: string;
  titre: string;
  telephone: string;
  email: string;
  schoolId: string;
  userId?: string | null;
  type: 'PERMANENT' | 'VACATAIRE' | 'ADMINISTRATEUR';
  grade: 'PROFESSEUR' | 'MAITRE_CONFERENCE' | 'MAITRE_ASSISTANT' | 'ASSISTANT';
  createdAt: Date;
  updatedAt: Date;
  user?: {
    id: string;
    name: string;
    email: string;
    avatar?: string | null;
  } | null;
}

export interface Parent {
  id: string;
  userId?: string | null;
  enrollmentId: string;
  phone?: string | null;
  address?: string | null;
  occupation?: string | null;
  isEnrolled: boolean;
  createdAt: Date;
  updatedAt: Date;
  user?: {
    id: string;
    name: string;
    email: string;
    avatar?: string | null;
  } | null;
  students?: Student[];
}

export interface School {
  id: string;
  name: string;
  subdomain: string;
  logo?: string | null;
  address?: string | null;
  phone?: string | null;
  email?: string | null;
  primaryColor: string;
  secondaryColor: string;
  maxStudents: number;
  maxTeachers: number;
  isActive: boolean;
  schoolType: 'UNIVERSITY' | 'HIGH_SCHOOL';
  createdAt: Date;
  updatedAt: Date;
}

export interface Module {
  id: string;
  nom: string;
  type: string;
  vh: number;
  semestre: string;
  isUeCommune: boolean;
  schoolId: string;
  filiereId?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface Filiere {
  id: string;
  nom: string;
  schoolId: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface EmploiDuTemps {
  id: string;
  titre: string;
  dateDebut: Date;
  dateFin: Date;
  heureDebut: string;
  heureFin: string;
  salle: string;
  niveau: string;
  semestre: string;
  vh: number;
  joursCours: string;
  evaluation: boolean;
  jourEvaluation?: string | null;
  ueCommune: boolean;
  schoolId: string;
  moduleId: string;
  enseignantId: string;
  filiereId?: string | null;
  anneeUnivId?: string | null;
  createdAt: Date;
  updatedAt: Date;
  module?: Module;
  enseignant?: Teacher;
  filiere?: Filiere | null;
}

export interface Evaluation {
  id: string;
  studentId: string;
  moduleId: string;
  note: number;
  coefficient: number;
  type: string;
  date: Date;
  validated: boolean;
  comment?: string | null;
  createdAt: Date;
  updatedAt: Date;
  module?: Module;
}

export interface Absence {
  id: string;
  studentId: string;
  date: Date;
  period?: string | null;
  justified: boolean;
  justification?: string | null;
  notifiedParent: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface Homework {
  id: string;
  moduleId: string;
  title: string;
  description: string;
  dueDate: Date;
  maxPoints?: number | null;
  createdAt: Date;
  updatedAt: Date;
  module?: Module;
}

export interface Submission {
  id: string;
  homeworkId: string;
  studentId: string;
  content?: string | null;
  fileUrl?: string | null;
  submittedAt: Date;
  grade?: number | null;
  feedback?: string | null;
  createdAt: Date;
  updatedAt: Date;
  homework?: Homework;
}

export interface FeeStructure {
  id: string;
  schoolId: string;
  name: string;
  amount: number;
  type: 'TUITION' | 'REGISTRATION' | 'EXAM' | 'LIBRARY' | 'SPORT' | 'TRANSPORT' | 'OTHER';
  niveau?: string | null;
  filiereId?: string | null;
  academicYear: string;
  dueDate?: Date | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface StudentPayment {
  id: string;
  studentId: string;
  feeStructureId: string;
  amountDue: number;
  amountPaid: number;
  discountAmount: number;
  status: 'PENDING' | 'PAID' | 'OVERDUE' | 'PARTIAL' | 'CANCELED';
  dueDate: Date;
  paidAt?: Date | null;
  paymentMethod?: string | null;
  transactionId?: string | null;
  paidBy?: string | null;
  receiptUrl?: string | null;
  notes?: string | null;
  createdAt: Date;
  updatedAt: Date;
  feeStructure?: FeeStructure;
}

export interface Scholarship {
  id: string;
  studentId: string;
  name: string;
  type: 'MERIT' | 'NEED_BASED' | 'DISCOUNT' | 'FULL' | 'PARTIAL';
  amount?: number | null;
  percentage?: number | null;
  reason: string;
  academicYear: string;
  isActive: boolean;
  approvedBy?: string | null;
  approvedAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

// ============================================
// TYPES POUR LES STATISTIQUES
// ============================================

export interface DashboardStats {
  totalStudents: number;
  totalTeachers: number;
  totalClasses: number;
  activeEnrollments: number;
  pendingPayments?: number;
  totalRevenue?: number;
}

export interface TeacherStats {
  totalCourses: number;
  totalStudents: number;
  upcomingClasses: number;
  pendingGrades: number;
}

export interface StudentStats {
  averageGrade: number;
  attendanceRate: number;
  completedHomework: number;
  totalHomework: number;
  pendingPayments: number;
}

export interface ParentStats {
  children: number;
  totalAbsences: number;
  averageGrade: number;
  pendingPayments: number;
}

// ============================================
// TYPES POUR LES FORMULAIRES
// ============================================

export interface StudentFormData {
  name: string;
  email: string;
  studentNumber: string;
  filiereId?: string;
  niveau: string;
  dateOfBirth?: Date;
  placeOfBirth?: string;
  address?: string;
  phone?: string;
}

export interface TeacherFormData {
  nom: string;
  prenom: string;
  titre: string;
  telephone: string;
  email: string;
  type: 'PERMANENT' | 'VACATAIRE' | 'ADMINISTRATEUR';
  grade: 'PROFESSEUR' | 'MAITRE_CONFERENCE' | 'MAITRE_ASSISTANT' | 'ASSISTANT';
}

export interface ModuleFormData {
  nom: string;
  type: string;
  vh: number;
  semestre: string;
  isUeCommune: boolean;
  filiereId?: string;
}

export interface EmploiFormData {
  titre: string;
  dateDebut: Date;
  dateFin: Date;
  heureDebut: string;
  heureFin: string;
  salle: string;
  niveau: string;
  semestre: string;
  vh: number;
  joursCours: string[];
  evaluation: boolean;
  jourEvaluation?: string;
  ueCommune: boolean;
  moduleId: string;
  enseignantId: string;
  filiereId?: string;
}
