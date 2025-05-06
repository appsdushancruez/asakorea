'use client';

import { useState, useEffect } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { format } from 'date-fns';
import { CSVLink } from 'react-csv';

interface Enrollment {
  id: string;
  student_id: string;
  class_id: string;
  enrolled_at: string;
  student: {
    name: string;
    email: string;
    student_number?: string;
  };
  class: {
    title: string;
  };
}

interface EnrollmentListProps {
  classId?: string;
  studentId?: string;
  enablePagination?: boolean;
  enableSearch?: boolean;
}

export default function EnrollmentList({ classId, studentId, enablePagination = false, enableSearch = false }: EnrollmentListProps) {
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'active' | 'past'>('all');
  const [search, setSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const enrollmentsPerPage = 10;

  const supabase = createClientComponentClient();

  useEffect(() => {
    fetchEnrollments();
  }, [classId, studentId, filter]);

  const fetchEnrollments = async () => {
    try {
      setLoading(true);
      setError(null);

      let query = supabase
        .from('enrollments')
        .select(`
          *,
          student:students(name, email, student_number),
          class:classes(title)
        `)
        .order('enrolled_at', { ascending: false });

      if (classId) {
        query = query.eq('class_id', classId);
      }

      if (studentId) {
        query = query.eq('student_id', studentId);
      }

      const { data, error } = await query;

      if (error) throw error;

      setEnrollments(data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleUnenroll = async (enrollmentId: string) => {
    if (!confirm('Are you sure you want to unenroll this student?')) return;

    try {
      setLoading(true);
      setError(null);

      const { error } = await supabase
        .from('enrollments')
        .delete()
        .eq('id', enrollmentId);

      if (error) throw error;

      fetchEnrollments();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const prepareCSVData = () => {
    return enrollments.map((enrollment) => ({
      'Enrollment Date': format(new Date(enrollment.enrolled_at), 'yyyy-MM-dd'),
      'Student Name': enrollment.student.name,
      'Student Email': enrollment.student.email,
      'Class Title': enrollment.class.title,
    }));
  };

  // Filter by search
  const filteredEnrollments = enrollments.filter((enrollment) => {
    const name = enrollment.student.name?.toLowerCase() || '';
    const studentNumber = enrollment.student.student_number?.toLowerCase() || '';
    return (
      name.includes(search.toLowerCase()) ||
      studentNumber.includes(search.toLowerCase())
    );
  });

  // Pagination logic
  const totalPages = Math.ceil(filteredEnrollments.length / enrollmentsPerPage);
  const paginatedEnrollments = enablePagination
    ? filteredEnrollments.slice((currentPage - 1) * enrollmentsPerPage, currentPage * enrollmentsPerPage)
    : filteredEnrollments;

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

  return (
    <div className="space-y-4">
      {/* Filters, Search, and Export */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2">
        <div className="flex space-x-4 items-center">
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value as 'all' | 'active' | 'past')}
            className="rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
          >
            <option value="all">All Enrollments</option>
            <option value="active">Active</option>
            <option value="past">Past</option>
          </select>
          {enableSearch && (
            <input
              type="text"
              placeholder="Search by name or student number"
              value={search}
              onChange={(e) => { setSearch(e.target.value); setCurrentPage(1); }}
              className="rounded-md border-blue-700 bg-gray-800 text-white placeholder:text-blue-200 text-base shadow-sm focus:border-blue-400 focus:ring-2 focus:ring-blue-400 sm:text-base"
            />
          )}
        </div>
        <CSVLink
          data={prepareCSVData()}
          filename={`enrollments-${format(new Date(), 'yyyy-MM-dd')}.csv`}
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
        >
          Export CSV
        </CSVLink>
      </div>

      {/* Enrollments Table */}
      <div className="bg-white shadow rounded-lg overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Enrollment Date
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Student
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Student No.
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Class
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {paginatedEnrollments.map((enrollment) => (
              <tr key={enrollment.id}>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {format(new Date(enrollment.enrolled_at), 'MMM d, yyyy')}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-medium text-gray-900">
                    {enrollment.student.name}
                  </div>
                  <div className="text-sm text-gray-500">{enrollment.student.email}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {enrollment.student.student_number || '-'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-medium text-gray-900">
                    {enrollment.class.title}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <button
                    onClick={() => handleUnenroll(enrollment.id)}
                    className="text-red-600 hover:text-red-900"
                  >
                    Unenroll
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {enablePagination && totalPages > 1 && (
        <div className="flex justify-center items-center gap-2 mt-4">
          <button
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            disabled={currentPage === 1}
            className="px-3 py-1 rounded bg-blue-100 text-blue-700 font-semibold disabled:opacity-50"
          >
            Prev
          </button>
          <span className="text-sm font-medium text-gray-700">
            Page {currentPage} of {totalPages}
          </span>
          <button
            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
            className="px-3 py-1 rounded bg-blue-100 text-blue-700 font-semibold disabled:opacity-50"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
} 