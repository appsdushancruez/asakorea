'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import type { Class } from '@/lib/supabase';
import Modal from '@/components/Modal';
import ClassForm from '@/components/ClassForm';
import { format, parseISO } from 'date-fns';

export default function PhysicalClassesPage() {
  const [classes, setClasses] = useState<any[]>([]);
  const [locations, setLocations] = useState<{ id: string; name: string }[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLocationModalOpen, setIsLocationModalOpen] = useState(false);
  const [selectedClass, setSelectedClass] = useState<Class | undefined>();
  const [newLocation, setNewLocation] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [editSchedules, setEditSchedules] = useState<any[]>([]);

  const fetchClasses = async () => {
    try {
      const { data: classData, error } = await supabase
        .from('classes')
        .select('*')
        .eq('class_type', 'physical')
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

  const fetchLocations = async () => {
    const { data, error } = await supabase.from('locations').select('id, name').order('name');
    if (!error && data) setLocations(data);
  };

  useEffect(() => {
    fetchClasses();
    fetchLocations();
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

  // Location management
  const handleAddLocation = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocationError(null);
    if (!newLocation.trim()) return;
    const { error } = await supabase.from('locations').insert({ name: newLocation.trim() });
    if (error) {
      setLocationError(error.message);
    } else {
      setNewLocation('');
      fetchLocations();
    }
  };

  const handleDeleteLocation = async (id: string) => {
    await supabase.from('locations').delete().eq('id', id);
    fetchLocations();
  };

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
          <h1 className="text-2xl font-semibold text-gray-900">Physical Classes</h1>
          <p className="mt-2 text-sm text-gray-700">
            A list of all physical Korean language classes.
          </p>
        </div>
        <div className="mt-4 sm:ml-16 sm:mt-0 sm:flex-none flex gap-2">
          <button
            type="button"
            onClick={() => setIsLocationModalOpen(true)}
            className="block rounded-md bg-green-600 px-3 py-2 text-center text-sm font-semibold text-white shadow-sm hover:bg-green-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-green-600"
          >
            Manage Locations
          </button>
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

      {/* Locations Management Modal */}
      <Modal
        isOpen={isLocationModalOpen}
        onClose={() => setIsLocationModalOpen(false)}
        title="Manage Locations"
      >
        <div className="bg-gradient-to-br from-blue-50 via-pink-50 to-yellow-50 rounded-xl p-4">
          <form onSubmit={handleAddLocation} className="mb-4 flex gap-2">
            <input
              type="text"
              value={newLocation}
              onChange={e => setNewLocation(e.target.value)}
              placeholder="New location name"
              className="input w-full text-gray-900 placeholder-gray-500 bg-white border-gray-300"
            />
            <button type="submit" className="btn-primary">Add</button>
          </form>
          {locationError && <div className="text-red-600 text-sm mb-2">{locationError}</div>}
          <ul className="divide-y divide-gray-200">
            {locations.map(loc => (
              <li key={loc.id} className="flex items-center justify-between py-2">
                <span className="text-gray-900">{loc.name}</span>
                <button
                  onClick={() => handleDeleteLocation(loc.id)}
                  className="text-red-600 hover:underline text-xs"
                >
                  Delete
                </button>
              </li>
            ))}
          </ul>
        </div>
      </Modal>

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
                      Location
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
                      className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900"
                    >
                      Enrollments
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
                        <div>
                          <h3 className="text-lg font-medium text-gray-900">{classData.title}</h3>
                          <div className="text-xs text-gray-500">
                            Fee: {typeof classData.fee === 'number' ? `₨${classData.fee.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : '-'}
                          </div>
                        </div>
                      </td>
                      <td className="px-3 py-4 text-sm text-gray-500">
                        {renderSchedule(classData.schedules)}
                      </td>
                      <td className="px-3 py-4 text-sm text-gray-500">
                        {classData.location_or_link}
                      </td>
                      <td className="px-3 py-4 text-sm text-gray-500">
                        {classData.max_students}
                      </td>
                      <td className="px-3 py-4 text-sm text-gray-500">
                        <span className={`inline-block px-2 py-1 text-xs font-semibold rounded ${classData.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-200 text-gray-800'}`}>
                          {classData.status}
                        </span>
                      </td>
                      <td className="px-3 py-4 text-sm text-gray-500">
                        {typeof classData.fee === 'number' ? `₨${classData.fee.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : '-'}
                      </td>
                      <td className="px-3 py-4 text-sm text-gray-500">
                        {classData.enrollments?.[0]?.count || 0} enrolled
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
          classType="physical"
          onSuccess={handleSuccess}
          onCancel={handleModalClose}
          classData={selectedClass}
          schedules={selectedClass ? editSchedules : []}
        />
      </Modal>
    </div>
  );
}