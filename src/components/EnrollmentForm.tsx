'use client';

import { useState, useEffect } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

interface Student {
  id: string;
  name: string;
  email: string;
}

interface Class {
  id: string;
  name: string;
  max_students: number;
  current_enrollments: number;
  fee: number;
}

interface EnrollmentFormProps {
  classId: string;
  onSuccess: () => void;
  onCancel: () => void;
  initialStudentId?: string;
  feeAdjustment?: string;
}

export default function EnrollmentForm({ classId, onSuccess, onCancel, initialStudentId, feeAdjustment }: EnrollmentFormProps) {
  const [students, setStudents] = useState<Student[]>([]);
  const [selectedStudent, setSelectedStudent] = useState<string>(initialStudentId || '');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [classData, setClassData] = useState<Class | null>(null);
  const [adjustedFee, setAdjustedFee] = useState<number | null>(null);

  const supabase = createClientComponentClient();

  useEffect(() => {
    fetchData();
  }, [classId]);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch class data
      const { data: classData, error: classError } = await supabase
        .from('classes')
        .select('*, enrollments(count)')
        .eq('id', classId)
        .single();

      if (classError) throw classError;

      // Fetch available students (not enrolled in this class)
      const { data: enrolledStudents, error: enrolledError } = await supabase
        .from('enrollments')
        .select('student_id')
        .eq('class_id', classId);

      if (enrolledError) throw enrolledError;

      const enrolledStudentIds = enrolledStudents.map((e) => e.student_id);

      const { data: availableStudents, error: studentsError } = await supabase
        .from('students')
        .select('*')
        .not('id', 'in', `(${enrolledStudentIds.join(',')})`)
        .eq('class_type', classData.class_type);

      if (studentsError) throw studentsError;

      setClassData({
        ...classData,
        current_enrollments: classData.enrollments[0].count,
      });
      setStudents(availableStudents || []);
      // Calculate adjusted fee based on feeAdjustment
      if (classData.fee) {
        if (feeAdjustment === 'Full Fee') {
          setAdjustedFee(classData.fee);
        } else if (feeAdjustment === 'Half Fee') {
          setAdjustedFee(classData.fee / 2);
        } else if (feeAdjustment === 'Free') {
          setAdjustedFee(0);
        } else {
          setAdjustedFee(classData.fee);
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStudent || !classData) return;

    try {
      setSaving(true);
      setError(null);

      const { error } = await supabase.from('enrollments').insert([
        {
          student_id: selectedStudent,
          class_id: classId,
          status: 'active',
          fee_adjustment: feeAdjustment,
          adjusted_fee: adjustedFee,
        },
      ]);

      if (error) throw error;

      onSuccess();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-md bg-red-50 p-4">
        <div className="text-sm text-red-700">{error}</div>
      </div>
    );
  }

  if (!classData) {
    return (
      <div className="rounded-md bg-yellow-50 p-4">
        <div className="text-sm text-yellow-700">Class not found</div>
      </div>
    );
  }

  const isClassFull = classData.current_enrollments >= classData.max_students;

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="student" className="block text-sm font-medium text-gray-700">
          Select Student
        </label>
        <select
          id="student"
          value={selectedStudent}
          onChange={(e) => setSelectedStudent(e.target.value)}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
          disabled={isClassFull || students.length === 0 || !!initialStudentId}
        >
          <option value="">Select a student</option>
          {students.map((student) => (
            <option key={student.id} value={student.id}>
              {student.name} ({student.email})
            </option>
          ))}
        </select>
        {isClassFull && (
          <p className="mt-2 text-sm text-red-600">This class has reached its maximum capacity.</p>
        )}
        {!isClassFull && students.length === 0 && (
          <p className="mt-2 text-sm text-yellow-600">No available students to enroll.</p>
        )}
      </div>
      {feeAdjustment && (
        <div className="mb-2 text-sm font-semibold">Fee Adjustment: <span className="text-blue-700">{feeAdjustment}</span></div>
      )}
      {adjustedFee !== null && (
        <div className="text-sm font-medium text-gray-700">
          Adjusted Fee: ₨{adjustedFee.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        </div>
      )}
      <div className="flex justify-end space-x-3">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={!selectedStudent || isClassFull || saving}
          className="inline-flex justify-center px-4 py-2 text-sm font-medium text-white bg-indigo-600 border border-transparent rounded-md shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {saving ? 'Enrolling...' : 'Enroll Student'}
        </button>
      </div>
    </form>
  );
} 