import { useState, useEffect } from 'react';
import { DayPicker } from 'react-day-picker';
import 'react-day-picker/dist/style.css';

type DayOfWeek = 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday' | 'sunday';

interface Schedule {
  id?: string;
  day_of_week: DayOfWeek | null;
  specific_date: Date | string | null;
  start_time: string;
  end_time: string;
}

interface ScheduleSelectorProps {
  schedules: Schedule[];
  onChange: (schedules: Schedule[]) => void;
}

const DAYS_OF_WEEK: DayOfWeek[] = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];

export default function ScheduleSelector({ schedules, onChange }: ScheduleSelectorProps) {
  const [selectedDays, setSelectedDays] = useState<DayOfWeek[]>([]);
  const [selectedDates, setSelectedDates] = useState<Date[]>([]);

  // Sync selectedDays and selectedDates with schedules prop
  useEffect(() => {
    setSelectedDays(schedules.filter(s => s.day_of_week).map(s => s.day_of_week as DayOfWeek));
    setSelectedDates(
      schedules
        .filter(s => s.specific_date)
        .map(s => {
          if (s.specific_date instanceof Date) return s.specific_date;
          if (typeof s.specific_date === 'string') return new Date(s.specific_date);
          return null;
        })
        .filter(Boolean) as Date[]
    );
  }, [schedules]);

  // Add or remove a weekday schedule
  const handleDayToggle = (day: DayOfWeek) => {
    let newSelectedDays;
    if (selectedDays.includes(day)) {
      newSelectedDays = selectedDays.filter(d => d !== day);
    } else {
      newSelectedDays = [...selectedDays, day];
    }
    setSelectedDays(newSelectedDays);
    // Remove all previous weekday schedules for this day, then add if selected
    let newSchedules = schedules.filter(s => s.day_of_week !== day);
    if (!selectedDays.includes(day)) {
      newSchedules = [
        ...newSchedules,
        {
          day_of_week: day,
          specific_date: null,
          start_time: '09:00',
          end_time: '10:00',
        },
      ];
    }
    onChange(newSchedules);
  };

  // Add or remove a specific date schedule
  const handleDateSelect = (dates: Date[]) => {
    // Merge: keep all schedules for dates in the new selection, and add new ones
    const prevDates = schedules
      .filter(s => s.specific_date)
      .map(s => {
        if (s.specific_date instanceof Date) return s.specific_date;
        if (typeof s.specific_date === 'string') return new Date(s.specific_date);
        return null;
      })
      .filter(Boolean) as Date[];
    // Remove schedules for dates that are no longer selected
    let newSchedules = schedules.filter(s => {
      if (!s.specific_date) return true;
      return dates.some(d => d.toDateString() === new Date(s.specific_date as string).toDateString());
    });
    // Add new schedules for dates that are newly selected
    dates.forEach(date => {
      if (!prevDates.some(d => d.toDateString() === date.toDateString())) {
        newSchedules.push({
          day_of_week: null,
          specific_date: date,
          start_time: '09:00',
          end_time: '10:00',
        });
      }
    });
    setSelectedDates(dates);
    onChange(newSchedules);
  };

  // Change time for a schedule
  const handleTimeChange = (index: number, field: 'start_time' | 'end_time', value: string) => {
    const newSchedules = [...schedules];
    newSchedules[index] = { ...newSchedules[index], [field]: value };
    onChange(newSchedules);
  };

  // Remove a specific date schedule
  const handleRemoveDate = (date: Date) => {
    const newSchedules = schedules.filter(
      s => !(s.specific_date && new Date(s.specific_date as string).toDateString() === date.toDateString())
    );
    setSelectedDates(selectedDates.filter(d => d.toDateString() !== date.toDateString()));
    onChange(newSchedules);
  };

  // Remove a weekday schedule
  const handleRemoveDay = (day: DayOfWeek) => {
    const newSchedules = schedules.filter(s => s.day_of_week !== day);
    setSelectedDays(selectedDays.filter(d => d !== day));
    onChange(newSchedules);
  };

  return (
    <div className="space-y-4">
      <div>
        <div className="mb-2 font-semibold text-gray-800">Add Weekly Days</div>
        <div className="flex flex-wrap gap-2">
          {DAYS_OF_WEEK.map(day => (
            <button
              key={day}
              type="button"
              onClick={() => handleDayToggle(day)}
              className={`px-4 py-2 rounded-md ${
                selectedDays.includes(day)
                  ? 'bg-indigo-600 text-white'
                  : 'bg-gray-200 text-gray-800'
              } font-semibold`}
            >
              {day.charAt(0).toUpperCase() + day.slice(1)}
              {selectedDays.includes(day) && (
                <span
                  className="ml-2 text-xs text-red-300 cursor-pointer"
                  onClick={e => { e.stopPropagation(); handleRemoveDay(day); }}
                >
                  ×
                </span>
              )}
            </button>
          ))}
        </div>
        {selectedDays.length > 0 && (
          <div className="space-y-2 mt-2">
            <h3 className="text-lg font-semibold text-gray-800">Time Slots</h3>
            {selectedDays.map((day, index) => {
              const schedIndex = schedules.findIndex(s => s.day_of_week === day);
              return (
                <div key={day} className="flex items-center space-x-4">
                  <span className="w-32 text-gray-800 font-semibold">{day.charAt(0).toUpperCase() + day.slice(1)}</span>
                  <input
                    type="time"
                    value={schedules[schedIndex]?.start_time || '09:00'}
                    onChange={(e) => handleTimeChange(schedIndex, 'start_time', e.target.value)}
                    className="rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 text-gray-900"
                  />
                  <span className="text-gray-800">to</span>
                  <input
                    type="time"
                    value={schedules[schedIndex]?.end_time || '10:00'}
                    onChange={(e) => handleTimeChange(schedIndex, 'end_time', e.target.value)}
                    className="rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 text-gray-900"
                  />
                </div>
              );
            })}
          </div>
        )}
      </div>
      <div>
        <div className="mb-2 font-semibold text-gray-800">Add Specific Dates</div>
        <DayPicker
          mode="multiple"
          selected={selectedDates}
          onSelect={(dates) => handleDateSelect(dates as Date[])}
          className="custom-daypicker-calendar border rounded-lg p-4"
        />
        {selectedDates.length > 0 && (
          <div className="space-y-2 mt-2">
            <h3 className="text-lg font-semibold text-gray-800">Time Slots</h3>
            {selectedDates.map((date) => {
              const schedIndex = schedules.findIndex(s => s.specific_date && new Date(s.specific_date as string).toDateString() === date.toDateString());
              return (
                <div key={date.toISOString()} className="flex items-center space-x-4">
                  <span className="w-32 text-gray-800 font-semibold">{date.toLocaleDateString()}</span>
                  <input
                    type="time"
                    value={schedules[schedIndex]?.start_time || '09:00'}
                    onChange={(e) => handleTimeChange(schedIndex, 'start_time', e.target.value)}
                    className="rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 text-gray-900"
                  />
                  <span className="text-gray-800">to</span>
                  <input
                    type="time"
                    value={schedules[schedIndex]?.end_time || '10:00'}
                    onChange={(e) => handleTimeChange(schedIndex, 'end_time', e.target.value)}
                    className="rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 text-gray-900"
                  />
                  <button
                    type="button"
                    className="ml-2 text-xs text-red-500"
                    onClick={() => handleRemoveDate(date)}
                  >
                    Remove
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>
      <style jsx global>{`
        .custom-daypicker-calendar {
          background: #181a20;
          border-radius: 1rem;
          box-shadow: 0 2px 16px 0 #0004;
          padding: 1rem;
        }
        .custom-daypicker-calendar .rdp {
          --rdp-accent-color: #6366f1;
          --rdp-background-color: #23272f;
          --rdp-outline: 2px solid #6366f1;
          color: #fff;
          font-family: 'Noto Sans KR', 'Pretendard', 'Segoe UI', Arial, sans-serif;
        }
        .custom-daypicker-calendar .rdp-day {
          color: #e5e7eb;
          font-weight: 700;
          font-size: 1.1rem;
          border-radius: 0.5rem;
          background: none;
          transition: background 0.2s, color 0.2s;
        }
        .custom-daypicker-calendar .rdp-day_selected,
        .custom-daypicker-calendar .rdp-day_today {
          background: #6366f1 !important;
          color: #fff !important;
          font-weight: bold;
        }
        .custom-daypicker-calendar .rdp-day_outside {
          color: #6b7280 !important;
        }
        .custom-daypicker-calendar .rdp-caption_label {
          color: #fff;
          font-size: 1.1rem;
          font-weight: 700;
        }
        .custom-daypicker-calendar .rdp-head_cell {
          color: #a5b4fc;
          font-weight: 700;
          font-size: 1rem;
        }
        .custom-daypicker-calendar .rdp-nav_button {
          color: #fff;
        }
        .custom-daypicker-calendar .rdp-day:enabled:hover {
          background: #374151;
          color: #fff;
        }
      `}</style>
    </div>
  );
} 