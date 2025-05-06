import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import type { Student, Class, Attendance, AttendanceStatus } from '@/lib/supabase';

interface AttendanceFormProps {
  classId: string;
  onSuccess: () => void;
  onCancel: () => void;
  date: string;
}

export default function AttendanceForm({ classId, onSuccess, onCancel, date }: AttendanceFormProps) {
  const [students, setStudents] = useState<Student[]>([]);
  const [attendance, setAttendance] = useState<Record<string, AttendanceStatus>>({});
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch enrolled students
        const { data: enrollments, error: enrollmentsError } = await supabase
          .from('enrollments')
          .select('student_id')
          .eq('class_id', classId)
          .eq('status', 'active');

        if (enrollmentsError) throw enrollmentsError;

        const studentIds = enrollments.map(e => e.student_id);

        // Fetch student details
        const { data: studentsData, error: studentsError } = await supabase
          .from('students')
          .select('*')
          .in('id', studentIds)
          .order('name');

        if (studentsError) throw studentsError;
        setStudents(studentsData || []);

        // Fetch existing attendance records
        const { data: attendanceData, error: attendanceError } = await supabase
          .from('attendance')
          .select('*')
          .eq('class_id', classId)
          .eq('date', date);

        if (attendanceError) throw attendanceError;

        // Initialize attendance state
        const initialAttendance: Record<string, AttendanceStatus> = {};
        const initialNotes: Record<string, string> = {};

        studentsData?.forEach(student => {
          const record = attendanceData?.find(a => a.student_id === student.id);
          initialAttendance[student.id] = record?.status || 'present';
          initialNotes[student.id] = record?.notes || '';
        });

        setAttendance(initialAttendance);
        setNotes(initialNotes);
      } catch (error) {
        setError(error instanceof Error ? error.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [classId, date]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);

    try {
      const attendanceRecords = students.map(student => ({
        student_id: student.id,
        class_id: classId,
        date,
        status: attendance[student.id],
        notes: notes[student.id] || null,
      }));

      // Delete existing records for this date
      const { error: deleteError } = await supabase
        .from('attendance')
        .delete()
        .eq('class_id', classId)
        .eq('date', date);

      if (deleteError) throw deleteError;

      // Insert new records
      const { error: insertError } = await supabase
        .from('attendance')
        .insert(attendanceRecords);

      if (insertError) throw insertError;

      onSuccess();
    } catch (error) {
      setError(error instanceof Error ? error.message : 'An error occurred');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-4">
        <div className="text-lg">Loading...</div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 bg-gradient-to-br from-blue-900 via-pink-900 to-yellow-700 p-4 rounded-xl">
      {error && (
        <div className="rounded-md bg-red-50 p-4">
          <div className="text-sm text-red-700">{error}</div>
        </div>
      )}

      <div className="space-y-4">
        {students.map((student) => (
          <div key={student.id} className="border-b border-gray-200 pb-4">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <h3 className="text-sm font-bold text-white">{student.student_number} - {student.name}</h3>
              </div>
              <div className="ml-4">
                <select
                  value={attendance[student.id]}
                  onChange={(e) => setAttendance({
                    ...attendance,
                    [student.id]: e.target.value as AttendanceStatus,
                  })}
                  className="rounded-md border-pink-500 bg-gray-800 text-yellow-200 shadow-sm focus:border-yellow-400 focus:ring-2 focus:ring-yellow-400 sm:text-sm font-bold"
                >
                  <option value="present" className="text-green-600">Present</option>
                  <option value="absent" className="text-red-600">Absent</option>
                  <option value="late" className="text-yellow-600">Late</option>
                  <option value="excused" className="text-blue-600">Excused</option>
                </select>
              </div>
            </div>
            <div className="mt-2">
              <input
                type="text"
                placeholder="Notes (optional)"
                value={notes[student.id] || ''}
                onChange={(e) => setNotes({
                  ...notes,
                  [student.id]: e.target.value,
                })}
                className="block w-full rounded-md border-blue-700 bg-gray-800 text-white placeholder:text-blue-200 shadow-sm focus:border-pink-400 focus:ring-2 focus:ring-pink-400 sm:text-sm"
              />
            </div>
          </div>
        ))}
      </div>

      <div className="mt-5 sm:mt-6 sm:grid sm:grid-flow-row-dense sm:grid-cols-2 sm:gap-3">
        <label htmlFor="date" className="block text-sm font-bold text-white">Date</label>
        <input
          type="date"
          id="date"
          value={date}
          onChange={() => {}}
          className="mt-1 block w-full rounded-md border-blue-700 bg-gray-800 text-black placeholder:text-blue-200 shadow-sm focus:border-yellow-400 focus:ring-2 focus:ring-yellow-400 sm:text-sm font-bold"
          disabled
        />
        <button
          type="submit"
          disabled={saving}
          className="inline-flex w-full justify-center rounded-md bg-gradient-to-r from-pink-600 via-yellow-400 to-blue-600 px-3 py-2 text-sm font-bold text-white shadow-sm hover:from-pink-700 hover:to-blue-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-yellow-400 sm:col-start-2"
        >
          {saving ? 'Saving...' : 'Save Attendance'}
        </button>
        <button
          type="button"
          className="mt-3 inline-flex w-full justify-center rounded-md bg-gray-700 px-3 py-2 text-sm font-bold text-white shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-600 sm:col-start-1 sm:mt-0"
          onClick={onCancel}
        >
          Cancel
        </button>
      </div>
    </form>
  );
} 