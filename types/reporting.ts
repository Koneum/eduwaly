// Types pour le système de reporting
export interface ReportCard {
  studentId: string;
  studentName: string;
  enrollmentId: string;
  filiere: string;
  niveau: string;
  semester: string;
  academicYear: string;
  grades: GradeDetail[];
  absences: AbsenceDetail;
  average: number;
  rank?: number;
  totalStudents?: number;
  comments?: string;
  generatedAt: Date;
}

export interface GradeDetail {
  moduleId: string;
  moduleName: string;
  moduleCode: string;
  coefficient: number;
  evaluations: {
    type: string;
    note: number;
    maxNote: number;
    coefficient: number;
    date: Date;
  }[];
  moduleAverage: number;
  weightedAverage: number;
}

export interface AbsenceDetail {
  total: number;
  justified: number;
  unjustified: number;
  percentage: number;
}

export interface Certificate {
  studentId: string;
  studentName: string;
  enrollmentId: string;
  birthDate?: Date;
  birthPlace?: string;
  filiere: string;
  niveau: string;
  academicYear: string;
  certificateNumber: string;
  purpose: string;
  issuedAt: Date;
  schoolName: string;
  schoolAddress?: string;
  schoolPhone?: string;
}

export interface AdvancedReport {
  reportType: 'academic' | 'financial' | 'attendance' | 'performance';
  title: string;
  period: { start: Date; end: Date };
  filters: { filiere?: string; niveau?: string; semester?: string };
  data: any;
  charts: ChartData[];
  summary: ReportSummary;
  generatedAt: Date;
}

export interface ChartData {
  type: 'bar' | 'line' | 'pie' | 'area';
  title: string;
  data: any[];
  labels: string[];
}

export interface ReportSummary {
  totalRecords: number;
  averageValue?: number;
  trends: { label: string; value: number; change: number }[];
  insights: string[];
}

export type ReportFormat = 'pdf' | 'excel' | 'csv';
export type CertificateType = 'scolarite' | 'inscription' | 'assiduity' | 'custom';
