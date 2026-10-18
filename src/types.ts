export type ExamTermId = '1-mid' | '1-final' | '2-mid' | '2-final';

export interface ExamTermInfo {
  id: ExamTermId;
  name: string;
  shortName: string;
  order: number;
}

export const EXAM_TERMS: ExamTermInfo[] = [
  { id: '1-mid', name: '1학기 중간고사', shortName: '1-중간', order: 1 },
  { id: '1-final', name: '1학기 기말고사', shortName: '1-기말', order: 2 },
  { id: '2-mid', name: '2학기 중간고사', shortName: '2-중간', order: 3 },
  { id: '2-final', name: '2학기 기말고사', shortName: '2-기말', order: 4 },
];

export interface Subject {
  id: string;
  name: string;
  category: '인문' | '수리' | '과학' | '사회' | '기타';
  color: string;
  badgeBg: string;
  borderColor: string;
}

export const DEFAULT_SUBJECTS: Subject[] = [
  { id: 'korean', name: '국어', category: '인문', color: '#3b82f6', badgeBg: 'bg-blue-50 text-blue-700', borderColor: 'border-blue-500' },
  { id: 'math', name: '수학', category: '수리', color: '#8b5cf6', badgeBg: 'bg-purple-50 text-purple-700', borderColor: 'border-purple-500' },
  { id: 'english', name: '영어', category: '인문', color: '#06b6d4', badgeBg: 'bg-cyan-50 text-cyan-700', borderColor: 'border-cyan-500' },
  { id: 'science', name: '과학', category: '과학', color: '#10b981', badgeBg: 'bg-emerald-50 text-emerald-700', borderColor: 'border-emerald-500' },
  { id: 'social', name: '사회·역사', category: '사회', color: '#f59e0b', badgeBg: 'bg-amber-50 text-amber-700', borderColor: 'border-amber-500' },
  { id: 'ethics', name: '도덕', category: '사회', color: '#ec4899', badgeBg: 'bg-pink-50 text-pink-700', borderColor: 'border-pink-500' },
  { id: 'tech_home', name: '기술·가정', category: '기타', color: '#64748b', badgeBg: 'bg-slate-100 text-slate-700', borderColor: 'border-slate-500' },
];

export interface ScoreRecord {
  termId: ExamTermId;
  scores: Record<string, number>; // subjectId -> score (0-100)
  date?: string;
  feedback?: string;
}

export interface Student {
  id: string;
  name: string;
  grade: number; // 1, 2, 3 (중학교 1~3학년)
  classroom: number; // 반
  number: number; // 번호
  targetGoal: string; // 학기 목표
  notes?: string;
  records: ScoreRecord[];
}

export type GradeLevel = 'A' | 'B' | 'C' | 'D' | 'E';

export function getGradeLevel(score: number): GradeLevel {
  if (score >= 90) return 'A';
  if (score >= 80) return 'B';
  if (score >= 70) return 'C';
  if (score >= 60) return 'D';
  return 'E';
}

export interface SubjectImprovement {
  subjectId: string;
  subjectName: string;
  color: string;
  fromTerm: string;
  toTerm: string;
  previousScore: number;
  currentScore: number;
  delta: number;
  deltaPercent: number;
  fromGrade: GradeLevel;
  toGrade: GradeLevel;
  trend: 'up' | 'down' | 'same';
}

export interface StudentAnalysis {
  student: Student;
  currentAverage: number;
  previousAverage: number;
  overallDelta: number;
  topImprovedSubject: SubjectImprovement | null;
  needsAttentionSubject: SubjectImprovement | null;
  subjectImprovements: SubjectImprovement[];
  aiCommentary: string;
}

export interface GoogleChatSpace {
  name: string; // e.g. "spaces/AAAAAAAAAAA"
  displayName: string;
  type?: string;
}
