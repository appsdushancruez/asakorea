'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import type { Class, Attendance } from '@/lib/supabase';
import Modal from '@/components/Modal';
import AttendanceForm from '@/components/AttendanceForm';
import dynamic from 'next/dynamic';
import { format, isSameDay, parseISO } from 'date-fns';
const Calendar = dynamic(() => import('react-calendar'), { ssr: false });
import 'react-calendar/dist/Calendar.css';

export default function OnlineAttendancePage() {
  const [classes, setClasses] = useState<Class[]>([]);
  const [selectedClass, setSelectedClass] = useState<Class | null>(null);
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [calendarDate, setCalendarDate] = useState<Date>(new Date());
  const [scheduledClasses, setScheduledClasses] = useState<any[]>([]);
  const [classSchedules, setClassSchedules] = useState<any[]>([]);

  const fetchClasses = async () => {
    try {
      const { data, error } = await supabase
        .from('classes')
        .select('*')
        .eq('class_type', 'online')
        .eq('status', 'active')
        .order('title');

      if (error) throw error;
      setClasses(data || []);
    } catch (error) {
      setError(error instanceof Error ? error.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const fetchClassSchedules = async () => {
    const { data, error } = await supabase
      .from('class_schedules')
      .select('*');
    if (!error && data) setClassSchedules(data);
  };

  useEffect(() => {
    fetchClasses();
    fetchClassSchedules();
  }, []);

  // Find classes scheduled for the selected date
  useEffect(() => {
    const dayOfWeek = format(calendarDate, 'EEEE').toLowerCase();
    const dateStr = format(calendarDate, 'yyyy-MM-dd');
    const scheduled = classes.filter(cls =>
      classSchedules.some(sch =>
        sch.class_id === cls.id && (
          (sch.day_of_week && sch.day_of_week === dayOfWeek) ||
          (sch.specific_date && isSameDay(parseISO(sch.specific_date), calendarDate))
        )
      )
    );
    setScheduledClasses(scheduled);
  }, [calendarDate, classes, classSchedules]);

  // Highlight days with scheduled classes
  const tileClassName = ({ date, view }: any) => {
    if (view === 'month') {
      const dayOfWeek = format(date, 'EEEE').toLowerCase();
      const dateStr = format(date, 'yyyy-MM-dd');
      const hasClass = classes.some(cls =>
        classSchedules.some(sch =>
          sch.class_id === cls.id && (
            (sch.day_of_week && sch.day_of_week === dayOfWeek) ||
            (sch.specific_date && isSameDay(parseISO(sch.specific_date), date))
          )
        )
      );
      return hasClass ? 'bg-indigo-200 text-indigo-900 font-bold' : '';
    }
    return '';
  };

  const handleTakeAttendance = (classData: Class) => {
    setSelectedClass(classData);
    setIsModalOpen(true);
  };

  const handleModalClose = () => {
    setIsModalOpen(false);
    setSelectedClass(null);
  };

  const handleSuccess = () => {
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
          <h1 className="text-2xl font-semibold text-gray-900">Online Classes Attendance</h1>
          <p className="mt-2 text-sm text-gray-700">
            Take attendance for online Korean language classes.
          </p>
        </div>
      </div>

      {error && (
        <div className="mt-4 rounded-md bg-red-50 p-4">
          <div className="text-sm text-red-700">{error}</div>
        </div>
      )}

      {/* Quick Class List */}
      <div className="mb-8">
        <h2 className="text-lg font-bold text-gray-800 mb-2">Quick Class List</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {classes.map((classItem) => (
            <div
              key={classItem.id}
              className={`rounded-lg border border-gray-300 bg-white px-6 py-5 shadow-sm hover:border-indigo-500 cursor-pointer ${selectedClass?.id === classItem.id ? 'ring-2 ring-indigo-500' : ''}`}
              onClick={() => { setSelectedClass(classItem); setIsModalOpen(true); setSelectedDate(format(calendarDate, 'yyyy-MM-dd')); }}
            >
              <h3 className="text-lg font-medium text-gray-900">{classItem.title}</h3>
              <div className="text-xs text-gray-500">Max Students: {classItem.max_students}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="pb-24 sm:pb-0">
        <div className="flex flex-col md:flex-row gap-8">
          <div>
            <Calendar
              onChange={(value) => {
                if (value instanceof Date) {
                  setCalendarDate(value);
                } else if (Array.isArray(value) && value[0] instanceof Date) {
                  setCalendarDate(value[0]);
                }
              }}
              value={calendarDate}
              tileClassName={tileClassName}
              className="custom-calendar"
            />
          </div>
          <div className="flex-1">
            <h2 className="text-lg font-bold text-gray-800 mb-2">Select a Class for {format(calendarDate, 'PPP')}</h2>
            {scheduledClasses.length === 0 ? (
              <div className="text-gray-500">No classes scheduled for this date.</div>
            ) : (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {scheduledClasses.map((classItem) => (
                  <div
                    key={classItem.id}
                    className={`rounded-lg border border-gray-300 bg-white px-6 py-5 shadow-sm hover:border-indigo-500 cursor-pointer ${selectedClass?.id === classItem.id ? 'ring-2 ring-indigo-500' : ''}`}
                    onClick={() => { setSelectedClass(classItem); setIsModalOpen(true); setSelectedDate(format(calendarDate, 'yyyy-MM-dd')); }}
                  >
                    <h3 className="text-lg font-medium text-gray-900">{classItem.title}</h3>
                    <div className="text-xs text-gray-500">Max Students: {classItem.max_students}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      <Modal
        isOpen={isModalOpen}
        onClose={handleModalClose}
        title={`Take Attendance - ${selectedClass?.title || ''}`}
      >
        {selectedClass && (
          <div className="space-y-4">
            <div>
              <label htmlFor="date" className="block text-sm font-medium text-gray-700">
                Date
              </label>
              <input
                type="date"
                id="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              />
            </div>
            <AttendanceForm
              classId={selectedClass.id}
              date={selectedDate}
              onSuccess={handleSuccess}
              onCancel={handleModalClose}
            />
          </div>
        )}
      </Modal>

      <style jsx global>{`
        .custom-calendar {
          background: #181f2a;
          border-radius: 1rem;
          padding: 1rem;
          color: #fff;
          font-weight: 600;
        }
        .custom-calendar .react-calendar__tile {
          color: #fff;
          font-weight: 600;
          font-size: 1.1rem;
          border-radius: 0.5rem;
        }
        .custom-calendar .react-calendar__tile--active,
        .custom-calendar .react-calendar__tile--now {
          background: #2563eb !important;
          color: #fff !important;
          font-weight: bold;
        }
        .custom-calendar .react-calendar__month-view__days__day--weekend {
          color: #f87171 !important;
        }
        .custom-calendar .react-calendar__month-view__weekdays__weekday {
          color: #e5e7eb;
          font-weight: 700;
          font-size: 1rem;
        }
      `}</style>
    </div>
  );
} 