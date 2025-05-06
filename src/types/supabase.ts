export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      students: {
        Row: {
          id: string
          created_at: string
          updated_at: string
          name: string
          email: string | null
          phone: string | null
          status: string
          class_type: 'physical' | 'online'
          photo_url: string | null
          student_number: string
          exam_facing_year: number
        }
        Insert: {
          id?: string
          created_at?: string
          updated_at?: string
          name: string
          email?: string | null
          phone?: string | null
          status: string
          class_type: 'physical' | 'online'
          photo_url?: string | null
          student_number: string
          exam_facing_year: number
        }
        Update: {
          id?: string
          created_at?: string
          updated_at?: string
          name?: string
          email?: string | null
          phone?: string | null
          status?: string
          class_type?: 'physical' | 'online'
          photo_url?: string | null
          student_number?: string
          exam_facing_year?: number
        }
      }
      classes: {
        Row: {
          id: string
          title: string
          location_or_link: string
          max_students: number
          status: string
          fee: number | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          title: string
          location_or_link: string
          max_students: number
          status: string
          fee?: number | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          title?: string
          location_or_link?: string
          max_students?: number
          status?: string
          fee?: number | null
          created_at?: string
          updated_at?: string
        }
      }
      locations: {
        Row: {
          id: string
          name: string
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          created_at?: string
        }
      }
      enrollments: {
        Row: {
          id: string
          created_at: string
          updated_at: string
          student_id: string
          class_id: string
          status: string
          start_date: string
          end_date: string | null
        }
        Insert: {
          id?: string
          created_at?: string
          updated_at?: string
          student_id: string
          class_id: string
          status: string
          start_date: string
          end_date?: string | null
        }
        Update: {
          id?: string
          created_at?: string
          updated_at?: string
          student_id?: string
          class_id?: string
          status?: string
          start_date?: string
          end_date?: string | null
        }
      }
      attendance: {
        Row: {
          id: string
          created_at: string
          updated_at: string
          student_id: string
          class_id: string
          date: string
          status: 'present' | 'absent' | 'late' | 'excused'
          notes: string | null
        }
        Insert: {
          id?: string
          created_at?: string
          updated_at?: string
          student_id: string
          class_id: string
          date: string
          status: 'present' | 'absent' | 'late' | 'excused'
          notes?: string | null
        }
        Update: {
          id?: string
          created_at?: string
          updated_at?: string
          student_id?: string
          class_id?: string
          date?: string
          status?: 'present' | 'absent' | 'late' | 'excused'
          notes?: string | null
        }
      }
      payments: {
        Row: {
          id: string
          created_at: string
          updated_at: string
          student_id: string
          amount: number
          payment_date: string
          payment_method: string
          status: string
          notes: string | null
        }
        Insert: {
          id?: string
          created_at?: string
          updated_at?: string
          student_id: string
          amount: number
          payment_date: string
          payment_method: string
          status: string
          notes?: string | null
        }
        Update: {
          id?: string
          created_at?: string
          updated_at?: string
          student_id?: string
          amount?: number
          payment_date?: string
          payment_method?: string
          status?: string
          notes?: string | null
        }
      }
      class_schedules: {
        Row: {
          id: string
          class_id: string
          day_of_week: 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday' | 'sunday' | null
          specific_date: string | null
          start_time: string
          end_time: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          class_id: string
          day_of_week?: 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday' | 'sunday' | null
          specific_date?: string | null
          start_time: string
          end_time: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          class_id?: string
          day_of_week?: 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday' | 'sunday' | null
          specific_date?: string | null
          start_time?: string
          end_time?: string
          created_at?: string
          updated_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      class_type: 'physical' | 'online'
      attendance_status: 'present' | 'absent' | 'late' | 'excused'
      day_of_week: 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday' | 'sunday'
    }
  }
} 