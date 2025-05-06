import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { Database } from '@/types/supabase';

export const supabase = createClientComponentClient<Database>();

export type Tables = Database['public']['Tables'];
export type Enums = Database['public']['Enums'];

export type Student = Tables['students']['Row'];
export type Class = Tables['classes']['Row'];
export type Enrollment = Tables['enrollments']['Row'];
export type Attendance = Tables['attendance']['Row'];
export type Payment = Tables['payments']['Row'];

export type ClassType = Enums['class_type'];
export type AttendanceStatus = Enums['attendance_status']; 