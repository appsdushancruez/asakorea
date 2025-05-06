import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import ScheduleSelector from './ScheduleSelector';
import type { Database } from '@/types/supabase';
import { format as formatDate } from 'date-fns';

type ClassFormData = {
  title: string;
  location_or_link: string;
  max_students: number;
  status: string;
  fee: string;
};

type Schedule = {
  day_of_week: 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday' | 'sunday' | null;
  specific_date: Date | null;
  start_time: string;
  end_time: string;
};

interface ClassFormProps {
  classData?: Database['public']['Tables']['classes']['Row'];
  classType: 'physical' | 'online';
  onSuccess?: () => void;
  onCancel?: () => void;
  schedules?: any[];
}

export default function ClassForm({ classData, classType, onSuccess, onCancel, schedules: propSchedules = [] }: ClassFormProps) {
  const router = useRouter();
  const supabase = createClientComponentClient<Database>();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [schedules, setSchedules] = useState<any[]>(propSchedules);
  const [locations, setLocations] = useState<{ id: string; name: string }[]>([]);

  const [formData, setFormData] = useState<ClassFormData>({
    title: classData?.title || '',
    location_or_link: classData?.location_or_link || '',
    max_students: classData?.max_students || 20,
    status: classData?.status || 'active',
    fee: classData?.fee ? String(classData.fee) : '',
  });

  useEffect(() => {
    if (classType === 'physical') {
      fetchLocations();
    }
  }, [classType]);

  useEffect(() => {
    setSchedules(propSchedules);
  }, [propSchedules]);

  const fetchLocations = async () => {
    const { data, error } = await supabase.from('locations').select('id, name').order('name');
    if (!error && data) setLocations(data);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      if (schedules.length === 0) {
        throw new Error('Please add at least one schedule');
      }

      let classId = classData?.id;
      if (classData) {
        // Update class
        const { error: updateError } = await supabase
          .from('classes')
          .update({
            title: formData.title,
            location_or_link: formData.location_or_link,
            max_students: formData.max_students,
            status: formData.status,
            class_type: classType,
            fee: formData.fee === '' ? null : parseFloat(formData.fee),
          })
          .eq('id', classData.id);
        if (updateError) throw updateError;
        // Remove all previous schedules for this class
        await supabase.from('class_schedules').delete().eq('class_id', classData.id);
      } else {
        // Insert new class
        const { data: classRecord, error: classError } = await supabase
          .from('classes')
          .insert({
            title: formData.title,
            location_or_link: formData.location_or_link,
            max_students: formData.max_students,
            status: formData.status,
            class_type: classType,
            fee: formData.fee === '' ? null : parseFloat(formData.fee),
          })
          .select()
          .single();
        if (classError) throw classError;
        classId = classRecord.id;
      }

      // Insert all schedules
      const schedulePromises = schedules.map(schedule => {
        let specific_date = null;
        if (schedule.specific_date instanceof Date) {
          specific_date = formatDate(schedule.specific_date, 'yyyy-MM-dd');
        } else if (typeof schedule.specific_date === 'string') {
          // If already a string, ensure it's in yyyy-MM-dd format (slice if needed)
          specific_date = schedule.specific_date.length > 10 ? schedule.specific_date.slice(0, 10) : schedule.specific_date;
        }
        return supabase.from('class_schedules').insert({
          class_id: classId,
          day_of_week: schedule.day_of_week,
          specific_date: specific_date,
          start_time: schedule.start_time,
          end_time: schedule.end_time,
        });
      });
      await Promise.all(schedulePromises);

      if (onSuccess) {
        onSuccess();
      } else {
        router.refresh();
        router.push(`/dashboard/${classType}/classes`);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}

      <div>
        <label htmlFor="title" className="block text-sm font-semibold text-gray-800">
          Class Title
        </label>
        <input
          type="text"
          id="title"
          required
          className="mt-1 block w-full rounded-md border-blue-700 bg-gray-800 text-white placeholder:text-blue-200 text-base shadow-sm focus:border-blue-400 focus:ring-2 focus:ring-blue-400 sm:text-base"
          value={formData.title}
          onChange={(e) => setFormData({ ...formData, title: e.target.value })}
        />
      </div>

      <div>
        <label htmlFor="location_or_link" className="block text-sm font-semibold text-gray-800">
          {classType === 'physical' ? 'Location' : 'Zoom Link'}
        </label>
        {classType === 'physical' ? (
          <select
            id="location_or_link"
            required
            className="mt-1 block w-full rounded-md border-blue-700 bg-gray-800 text-white text-base shadow-sm focus:border-blue-400 focus:ring-2 focus:ring-blue-400 sm:text-base"
            value={formData.location_or_link}
            onChange={(e) => setFormData({ ...formData, location_or_link: e.target.value })}
          >
            <option value="">Select a location</option>
            {locations.map((loc) => (
              <option key={loc.id} value={loc.name}>{loc.name}</option>
            ))}
          </select>
        ) : (
          <input
            type="text"
            id="location_or_link"
            required
            className="mt-1 block w-full rounded-md border-blue-700 bg-gray-800 text-white placeholder:text-blue-200 text-base shadow-sm focus:border-blue-400 focus:ring-2 focus:ring-blue-400 sm:text-base"
            value={formData.location_or_link}
            onChange={(e) => setFormData({ ...formData, location_or_link: e.target.value })}
          />
        )}
      </div>

      <div>
        <label htmlFor="max_students" className="block text-sm font-semibold text-gray-800">
          Maximum Students
        </label>
        <input
          type="number"
          id="max_students"
          required
          min="1"
          className="mt-1 block w-full rounded-md border-blue-700 bg-gray-800 text-white placeholder:text-blue-200 text-base shadow-sm focus:border-blue-400 focus:ring-2 focus:ring-blue-400 sm:text-base"
          value={formData.max_students}
          onChange={(e) => setFormData({ ...formData, max_students: parseInt(e.target.value) })}
        />
      </div>

      <div>
        <label htmlFor="fee" className="block text-sm font-semibold text-gray-800">
          Class Fee (LKR)
        </label>
        <input
          type="number"
          id="fee"
          min="0"
          step="0.01"
          className="mt-1 block w-full rounded-md border-blue-700 bg-gray-800 text-white placeholder:text-blue-200 text-base shadow-sm focus:border-blue-400 focus:ring-2 focus:ring-blue-400 sm:text-base"
          value={formData.fee}
          onChange={(e) => setFormData({ ...formData, fee: e.target.value })}
        />
      </div>

      <div>
        <label className="block text-sm font-semibold text-gray-800 mb-2">
          Schedule
        </label>
        <ScheduleSelector
          schedules={schedules}
          onChange={setSchedules}
        />
      </div>

      <div className="flex justify-end space-x-3">
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            Cancel
          </button>
        )}
        <button
          type="submit"
          disabled={isSubmitting}
          className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 border border-transparent rounded-md shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
        >
          {isSubmitting ? 'Saving...' : classData ? 'Update Class' : 'Create Class'}
        </button>
      </div>
    </form>
  );
} 