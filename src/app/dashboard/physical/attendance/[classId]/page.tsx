'use client';

import { useState, useEffect } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { useParams } from 'next/navigation';
import AttendanceRecords from '@/components/AttendanceRecords';

interface Class {
  id: string;
  name: string;
  description: string;
  max_students: number;
  status: 'active' | 'inactive';
}

export default function ClassAttendancePage() {
  const [classData, setClassData] = useState<Class | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const params = useParams();
  const supabase = createClientComponentClient();

  useEffect(() => {
    fetchClassData();
  }, []);

  const fetchClassData = async () => {
    try {
      setLoading(true);
      setError(null);

      const { data, error } = await supabase
        .from('classes')
        .select('*')
        .eq('id', params.classId)
        .single();

      if (error) throw error;

      setClassData(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
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

  return (
    <div className="space-y-6">
      <div className="bg-white shadow rounded-lg p-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">{classData.name}</h1>
        <p className="text-gray-600">{classData.description}</p>
        <div className="mt-4 flex gap-4">
          <div className="text-sm text-gray-500">
            Max Students: {classData.max_students}
          </div>
          <div className="text-sm">
            <span
              className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                classData.status === 'active'
                  ? 'bg-green-100 text-green-800'
                  : 'bg-red-100 text-red-800'
              }`}
            >
              {classData.status.charAt(0).toUpperCase() + classData.status.slice(1)}
            </span>
          </div>
        </div>
      </div>

      <AttendanceRecords classId={classData.id} />
    </div>
  );
} 