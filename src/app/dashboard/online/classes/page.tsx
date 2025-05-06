'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import type { Class } from '@/lib/supabase';
import Modal from '@/components/Modal';
import ClassForm from '@/components/ClassForm';
import { format, parseISO } from 'date-fns';

function renderSchedule(schedules: any[]) {
  if (!schedules || schedules.length === 0) return <span>-</span>;
  // Group and sort
  const weekdayOrder = ['monday','tuesday','wednesday','thursday','friday','saturday','sunday'];
  const weekdays = schedules.filter(s => s.day_of_week).sort((a, b) => weekdayOrder.indexOf(a.day_of_week) - weekdayOrder.indexOf(b.day_of_week));
  const dates = schedules.filter(s => s.specific_date).sort((a, b) => new Date(a.specific_date).getTime() - new Date(b.specific_date).getTime());
  return (
    <div className="flex flex-wrap gap-2">
      {weekdays.map((sched, i) => (
        <span key={sched.day_of_week + i} className="inline-flex items-center px-2 py-1 rounded bg-blue-100 text-blue-800 text-xs font-semibold">
          {sched.day_of_week.charAt(0).toUpperCase() + sched.day_of_week.slice(1)} {sched.start_time}–{sched.end_time}
        </span>
      ))}
      {dates.map((sched, i) => (
        <span key={sched.specific_date + i} className="inline-flex items-center px-2 py-1 rounded bg-green-100 text-green-800 text-xs font-semibold">
          {format(parseISO(sched.specific_date), 'MMM d, yyyy')} {sched.start_time}–{sched.end_time}
        </span>
      ))}
    </div>
  );
}

export default function OnlineClassesPage() {
  const [classes, setClasses] = useState<any[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedClass, setSelectedClass] = useState<Class | undefined>();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editSchedules, setEditSchedules] = useState<any[]>([]);

  const fetchClasses = async () => {
    try {
      const { data: classData, error } = await supabase
        .from('classes')
        .select('*')
        .eq('class_type', 'online')
        .order('title');
      if (error) throw error;
      const classIds = (classData || []).map((c: any) => c.id);
      let schedulesByClass: Record<string, any[]> = {};
      if (classIds.length > 0) {
        const { data: schedules } = await supabase
          .from('class_schedules')
          .select('*')
          .in('class_id', classIds);
        schedulesByClass = (schedules || []).reduce((acc: any, sched: any) => {
          if (!acc[sched.class_id]) acc[sched.class_id] = [];
          acc[sched.class_id].push(sched);
          return acc;
        }, {});
      }
      const classesWithSchedules = (classData || []).map((c: any) => ({
        ...c,
        schedules: schedulesByClass[c.id] || [],
      }));
      setClasses(classesWithSchedules);
    } catch (error) {
      setError(error instanceof Error ? error.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClasses();
  }, []);

  const handleAddClass = () => {
    setSelectedClass(undefined);
    setIsModalOpen(true);
  };

  const handleEditClass = async (classData: Class) => {
    // Fetch schedules for this class
    const { data: schedules } = await supabase
      .from('class_schedules')
      .select('*')
      .eq('class_id', classData.id);
    setSelectedClass(classData);
    setEditSchedules(schedules || []);
    setIsModalOpen(true);
  };

  const handleModalClose = () => {
    setIsModalOpen(false);
    setSelectedClass(undefined);
  };

  const handleSuccess = () => {
    fetchClasses();
    handleModalClose();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg">Loading...</div>
      </div>
    );
  }

  return (
    <div>
      <div className="sm:flex sm:items-center">
        <div className="sm:flex-auto">
          <h1 className="text-2xl font-semibold text-gray-900">Online Classes</h1>
          <p className="mt-2 text-sm text-gray-700">
            A list of all online Korean language classes.
          </p>
        </div>
        <div className="mt-4 sm:ml-16 sm:mt-0 sm:flex-none">
          <button
            type="button"
            onClick={handleAddClass}
            className="block rounded-md bg-indigo-600 px-3 py-2 text-center text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
          >
            Add class
          </button>
        </div>
      </div>

      {error && (
        <div className="mt-4 rounded-md bg-red-50 p-4">
          <div className="text-sm text-red-700">{error}</div>
        </div>
      )}

      <div className="mt-8 flow-root pb-24 sm:pb-0">
        <div className="-mx-4 -my-2 overflow-x-auto sm:-mx-6 lg:-mx-8">
          <div className="inline-block min-w-full py-2 align-middle sm:px-6 lg:px-8">
            <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 sm:rounded-lg">
              <table className="min-w-full divide-y divide-gray-300">
                <thead className="bg-gray-50">
                  <tr>
                    <th
                      scope="col"
                      className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 sm:pl-6"
                    >
                      Title
                    </th>
                    <th
                      scope="col"
                      className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900"
                    >
                      Schedule
                    </th>
                    <th
                      scope="col"
                      className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900"
                    >
                      Meeting Link
                    </th>
                    <th
                      scope="col"
                      className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900"
                    >
                      Max Students
                    </th>
                    <th
                      scope="col"
                      className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900"
                    >
                      Status
                    </th>
                    <th
                      scope="col"
                      className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900"
                    >
                      Fee
                    </th>
                    <th
                      scope="col"
                      className="relative py-3.5 pl-3 pr-4 sm:pr-6"
                    >
                      <span className="sr-only">Actions</span>
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 bg-white">
                  {classes.map((classData) => (
                    <tr key={classData.id}>
                      <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900 sm:pl-6">
                        {classData.title}
                      </td>
                      <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                        {renderSchedule(classData.schedules)}
                      </td>
                      <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                        {classData.location_or_link}
                      </td>
                      <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                        {classData.max_students}
                      </td>
                      <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                        {classData.status}
                      </td>
                      <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                        {typeof classData.fee === 'number' ? `₨${classData.fee.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : '-'}
                      </td>
                      <td className="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-6">
                        <button
                          onClick={() => handleEditClass(classData)}
                          className="text-indigo-600 hover:text-indigo-900"
                        >
                          Edit
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      <Modal
        isOpen={isModalOpen}
        onClose={handleModalClose}
        title={selectedClass ? 'Edit Class' : 'Add New Class'}
      >
        <ClassForm
          classType="online"
          onSuccess={handleSuccess}
          onCancel={handleModalClose}
          classData={selectedClass}
          schedules={selectedClass ? editSchedules : []}
        />
      </Modal>
    </div>
  );
} 