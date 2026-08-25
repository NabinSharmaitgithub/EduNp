export interface ClassRow { id: string; name: string; section: string | null; created_at: string }
export interface StudentRow {
  id: string; name: string; roll_number: string; class_id: string; parent_id: string | null
  date_of_birth: string | null; gender: string | null
  father_name: string | null; father_occupation: string | null
  mother_name: string | null; mother_occupation: string | null
  guardian_contact_number: string | null; emergency_contact_number: string | null
  student_address: string | null; iems_number: string | null
  admission_date: string | null; blood_group: string | null; photo_url: string | null
}
export interface SubjectRow { id: string; name: string }
export interface MarkRow { id: string; student_id: string; subject_id: string; exam_term: string; marks_obtained: number; max_marks: number }
export interface StaffRow {
  id: string; name: string; email: string
  role: 'teacher' | 'admin' | 'principal' | 'helping_staff'
  status: 'active' | 'removed'; user_id: string | null; created_at: string
  date_of_birth: string | null; gender: string | null
  contact_number: string | null; emergency_contact_number: string | null
  address: string | null; qualification: string | null; designation: string | null
  subject_specialization: string | null; date_of_joining: string | null
  photo_url: string | null; must_change_password: boolean | null
}
export const STAFF_ROLES = ['teacher', 'admin', 'principal', 'helping_staff'] as const
export type StaffRole = typeof STAFF_ROLES[number]
export interface ParentRow { id: string; name: string; email: string; phone: string | null; user_id: string | null }
export interface TeacherClassAssignment { id: string; teacher_id: string; class_id: string }
export interface TeacherSubjectAssignment { id: string; teacher_id: string; subject_id: string; class_id: string }
export interface AttendanceRow { id: string; student_id: string; class_id: string; date: string; status: 'present' | 'absent' | 'late' }
export interface TimetableRow { id: string; class_id: string; subject_id: string; teacher_id: string; day_of_week: string; period_number: number; start_time: string; end_time: string }
export interface FeeRow { id: string; student_id: string; amount_due: number; amount_paid: number; due_date: string; status: 'paid' | 'due' | 'overdue'; receipt_number: string | null; created_at: string }
export interface AnnouncementRow { id: string; title: string; body: string; target: 'school' | 'class'; class_id: string | null; created_by: string; created_at: string }
export interface ExamRow { id: string; name: string; class_id: string; start_date: string; end_date: string }
export interface ExamDutyRow { id: string; exam_id: string; teacher_id: string; class_id: string; role: 'invigilator' | 'coordinator' }
export interface LeaveRequestRow { id: string; staff_id: string; start_date: string; end_date: string; reason: string; status: 'pending' | 'approved' | 'rejected'; created_at: string }
export interface AuditLogRow { id: string; actor_id: string | null; action: string; target_table: string; target_id: string | null; timestamp: string; details: Record<string, unknown> | null }

export type UserRole = 'principal' | 'admin' | 'teacher' | 'parent'
export interface UserProfile { role: UserRole; staffId?: string; parentId?: string; name: string; email: string }

export const EXAM_TERMS = ['Midterm', 'Final', 'Quiz 1', 'Quiz 2', 'Assignment 1', 'Assignment 2'] as const
export const DAYS_OF_WEEK = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'] as const
export const ATTENDANCE_STATUSES = ['present', 'absent', 'late'] as const
export const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'] as const

export function gradeOf(pct: number | null): { label: string; cls: string } {
  if (pct === null) return { label: '—', cls: 'bg-surface-container-high text-on-surface-variant' }
  if (pct >= 90) return { label: 'A+', cls: 'bg-emerald-100 text-emerald-700' }
  if (pct >= 80) return { label: 'A', cls: 'bg-emerald-100 text-emerald-700' }
  if (pct >= 70) return { label: 'B+', cls: 'bg-blue-100 text-blue-700' }
  if (pct >= 60) return { label: 'B', cls: 'bg-blue-100 text-blue-700' }
  if (pct >= 50) return { label: 'C+', cls: 'bg-amber-100 text-amber-700' }
  if (pct >= 40) return { label: 'C', cls: 'bg-amber-100 text-amber-700' }
  if (pct >= 30) return { label: 'D', cls: 'bg-orange-100 text-orange-700' }
  return { label: 'F', cls: 'bg-red-100 text-red-700' }
}

export function barColor(pct: number): string {
  if (pct >= 80) return 'bg-emerald-500'
  if (pct >= 60) return 'bg-blue-500'
  if (pct >= 40) return 'bg-amber-500'
  return 'bg-red-500'
}

export function initials(name: string): string {
  return name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)
}

export interface StudentStat {
  student: StudentRow
  bySubject: Record<string, { obtained: number; max: number }>
  total: number
  totalMax: number
  pct: number | null
}
