'use client';

import { useState, useEffect } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { format, subDays, startOfDay, endOfDay } from 'date-fns';
import { CSVLink } from 'react-csv';

interface AttendanceRecord {
  id: string;
  student_id: string;
  class_id: string;
  date: string;
  status: 'present' | 'absent' | 'late';
  notes: string | null;
  student: {
    name: string;
    email: string;
  };
}

interface AttendanceStats {
  total: number;
  present: number;
  absent: number;
  late: number;
  attendanceRate: number;
}

export default function AttendanceRecords({ classId }: { classId: string }) {
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [startDate, setStartDate] = useState(format(subDays(new Date(), 30), 'yyyy-MM-dd'));
  const [endDate, setEndDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [stats, setStats] = useState<AttendanceStats>({
    total: 0,
    present: 0,
    absent: 0,
    late: 0,
    attendanceRate: 0,
  });

  const supabase = createClientComponentClient();

  useEffect(() => {
    fetchRecords();
  }, [classId, startDate, endDate]);

  const fetchRecords = async () => {
    try {
      setLoading(true);
      setError(null);

      const { data, error } = await supabase
        .from('attendance')
        .select(`
          *,
          student:students(name, email)
        `)
        .eq('class_id', classId)
        .gte('date', startOfDay(new Date(startDate)).toISOString())
        .lte('date', endOfDay(new Date(endDate)).toISOString())
        .order('date', { ascending: false });

      if (error) throw error;

      setRecords(data || []);
      calculateStats(data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = (records: AttendanceRecord[]) => {
    const stats = records.reduce(
      (acc, record) => {
        acc.total++;
        if (record.status === 'present') acc.present++;
        if (record.status === 'absent') acc.absent++;
        if (record.status === 'late') acc.late++;
        return acc;
      },
      { total: 0, present: 0, absent: 0, late: 0 }
    );

    setStats({
      ...stats,
      attendanceRate: stats.total > 0 ? (stats.present / stats.total) * 100 : 0,
    });
  };

  const prepareCSVData = () => {
    return records.map((record) => ({
      Date: format(new Date(record.date), 'yyyy-MM-dd'),
      Student: record.student.name,
      Email: record.student.email,
      Status: record.status.charAt(0).toUpperCase() + record.status.slice(1),
      Notes: record.notes || '',
    }));
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

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="bg-white p-4 rounded-lg shadow">
        <div className="flex flex-wrap gap-4 items-end">
          <div>
            <label htmlFor="startDate" className="block text-sm font-medium text-gray-700">
              Start Date
            </label>
            <input
              type="date"
              id="startDate"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
            />
          </div>
          <div>
            <label htmlFor="endDate" className="block text-sm font-medium text-gray-700">
              End Date
            </label>
            <input
              type="date"
              id="endDate"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
            />
          </div>
          <div>
            <CSVLink
              data={prepareCSVData()}
              filename={`attendance-records-${format(new Date(), 'yyyy-MM-dd')}.csv`}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              Export CSV
            </CSVLink>
          </div>
        </div>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-lg shadow">
          <h3 className="text-lg font-medium text-gray-900">Total Records</h3>
          <p className="mt-2 text-3xl font-bold text-indigo-600">{stats.total}</p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <h3 className="text-lg font-medium text-gray-900">Present</h3>
          <p className="mt-2 text-3xl font-bold text-green-600">{stats.present}</p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <h3 className="text-lg font-medium text-gray-900">Absent</h3>
          <p className="mt-2 text-3xl font-bold text-red-600">{stats.absent}</p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <h3 className="text-lg font-medium text-gray-900">Attendance Rate</h3>
          <p className="mt-2 text-3xl font-bold text-blue-600">
            {stats.attendanceRate.toFixed(1)}%
          </p>
        </div>
      </div>

      {/* Records Table */}
      <div className="bg-white shadow rounded-lg overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Date
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Student
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Notes
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {records.map((record) => (
              <tr key={record.id}>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {format(new Date(record.date), 'MMM d, yyyy')}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-medium text-gray-900">{record.student.name}</div>
                  <div className="text-sm text-gray-500">{record.student.email}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span
                    className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      record.status === 'present'
                        ? 'bg-green-100 text-green-800'
                        : record.status === 'absent'
                        ? 'bg-red-100 text-red-800'
                        : 'bg-yellow-100 text-yellow-800'
                    }`}
                  >
                    {record.status.charAt(0).toUpperCase() + record.status.slice(1)}
                  </span>
                </td>
                <td className="px-6 py-4 text-sm text-gray-500">{record.notes || '-'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
} 