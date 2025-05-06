'use client';

import { useState, useEffect, useRef } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

interface Student {
  id: string;
  name: string;
  photo_url: string;
  student_number?: string;
}

interface Class {
  id: string;
  title: string;
}

interface PaymentFormProps {
  onSuccess: () => void;
  onCancel: () => void;
  initialStudentId?: string;
  initialClassId?: string;
  classType?: 'physical' | 'online';
}

export default function PaymentForm({
  onSuccess,
  onCancel,
  initialStudentId,
  initialClassId,
  classType = 'physical',
}: PaymentFormProps) {
  const [students, setStudents] = useState<Student[]>([]);
  const [classes, setClasses] = useState<Class[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [studentSearch, setStudentSearch] = useState('');
  const [showStudentDropdown, setShowStudentDropdown] = useState(false);
  const studentInputRef = useRef<HTMLInputElement>(null);
  const [enrollment, setEnrollment] = useState<{ adjusted_fee: number | null, fee_adjustment: string | null } | null>(null);
  const [feeAdjustmentInfo, setFeeAdjustmentInfo] = useState<{ message: string, adjustedFee: number | null } | null>(null);

  const [formData, setFormData] = useState({
    student_id: initialStudentId || '',
    class_id: initialClassId || '',
    amount: '',
    payment_date: new Date().toISOString().split('T')[0],
    payment_type: 'cash' as 'cash' | 'bank_transfer' | 'card',
    status: 'completed' as 'pending' | 'completed' | 'failed',
    notes: '',
    class_type: classType,
  });

  const supabase = createClientComponentClient();

  useEffect(() => {
    fetchStudents();
    fetchClasses();
  }, [classType]);

  useEffect(() => {
    if (formData.student_id && formData.class_id) {
      // Fetch enrollment for this student/class
      supabase
        .from('enrollments')
        .select('*')
        .eq('student_id', formData.student_id)
        .eq('class_id', formData.class_id)
        .maybeSingle()
        .then(({ data, error }) => {
          if (!error && data) {
            setEnrollment({ adjusted_fee: data.adjusted_fee, fee_adjustment: data.fee_adjustment });
            if (data.fee_adjustment) {
              setFeeAdjustmentInfo({
                message: `This student is eligible for ${data.fee_adjustment} for this class.`,
                adjustedFee: data.adjusted_fee
              });
            } else {
              // If no fee adjustment in enrollment, check exam_year_changes
              checkExamYearChanges(formData.student_id);
            }
          } else {
            setEnrollment(null);
            // If no enrollment found, check exam_year_changes
            checkExamYearChanges(formData.student_id);
          }
        });
    } else {
      setEnrollment(null);
      setFeeAdjustmentInfo(null);
    }
  }, [formData.student_id, formData.class_id]);

  const checkExamYearChanges = async (studentId: string) => {
    const { data: yearChanges, error } = await supabase
      .from('exam_year_changes')
      .select('*')
      .eq('student_id', studentId)
      .order('changed_at', { ascending: false })
      .limit(1);

    if (!error && yearChanges && yearChanges.length > 0) {
      const latestChange = yearChanges[0];
      let adjustedFee = null;
      if (latestChange.fee_adjustment === 'No Fee (Free)') {
        adjustedFee = 0;
      } else if (latestChange.fee_adjustment === 'Half Fee') {
        // Get the class fee and calculate half
        const { data: classData } = await supabase
          .from('classes')
          .select('fee')
          .eq('id', formData.class_id)
          .single();
        if (classData) {
          adjustedFee = classData.fee / 2;
        }
      }

      setFeeAdjustmentInfo({
        message: `This student is eligible for ${latestChange.fee_adjustment} for this class based on exam year change.`,
        adjustedFee
      });
    } else {
      setFeeAdjustmentInfo(null);
    }
  };

  const fetchStudents = async () => {
    try {
      const { data, error } = await supabase
        .from('students')
        .select('id, name, photo_url, student_number')
        .eq('class_type', classType)
        .order('name');

      if (error) throw error;
      setStudents(data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    }
  };

  const fetchClasses = async () => {
    try {
      const { data, error } = await supabase
        .from('classes')
        .select('id, title')
        .eq('class_type', classType)
        .eq('status', 'active')
        .order('title');

      if (error) throw error;
      setClasses(data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const { student_id, class_id, amount, payment_date, payment_type, status, notes } = formData;

      // Fetch the class type for the selected class
      const { data: classData, error: classError } = await supabase
        .from('classes')
        .select('class_type, fee')
        .eq('id', class_id)
        .single();
      if (classError) throw classError;

      // Fetch all year changes for this student and class type
      const { data: yearChanges, error: yearChangeError } = await supabase
        .from('exam_year_changes')
        .select('*')
        .eq('student_id', student_id)
        .eq('class_id', class_id)
        .order('changed_at', { ascending: true });
      if (yearChangeError) throw yearChangeError;

      // Determine fee adjustment based on number of year changes
      let feeAdjustment = null;
      let adjustedFee = classData.fee;
      if (yearChanges && yearChanges.length > 0) {
        if (yearChanges.length === 1) {
          feeAdjustment = 'No Fee (Free)';
          adjustedFee = 0;
        } else if (yearChanges.length === 2) {
          feeAdjustment = 'Half Fee';
          adjustedFee = classData.fee / 2;
        } else {
          feeAdjustment = 'Full Fee';
          adjustedFee = classData.fee;
        }
      }

      // First, check if student is already enrolled
      const { data: existingEnrollment, error: enrollmentCheckError } = await supabase
        .from('enrollments')
        .select('*')
        .eq('student_id', student_id)
        .eq('class_id', class_id)
        .maybeSingle();

      if (enrollmentCheckError && enrollmentCheckError.code !== 'PGRST116') { // PGRST116 means no rows returned
        throw enrollmentCheckError;
      }

      // If not enrolled, create enrollment
      if (!existingEnrollment) {
        const enrollmentData = {
          student_id,
          class_id,
          enrolled_at: payment_date,
          status: 'active',
          adjusted_fee: adjustedFee,
          fee_adjustment: feeAdjustment
        };

        const { error: enrollmentError } = await supabase
          .from('enrollments')
          .insert([enrollmentData]);

        if (enrollmentError) throw enrollmentError;
      }

      // Create payment record
      const { error: paymentError } = await supabase.from('payments').insert([
        {
          student_id,
          class_id,
          amount: parseFloat(amount),
          payment_date,
          payment_type,
          status,
          notes,
          class_type: classType,
        },
      ]);

      if (paymentError) throw paymentError;
      onSuccess();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleStudentSelect = (student: Student) => {
    setFormData((prev) => ({ ...prev, student_id: student.id }));
    setStudentSearch(student.name + (student.student_number ? ` (${student.student_number})` : ''));
    setShowStudentDropdown(false);
  };

  const filteredStudents = students.filter((student) =>
    student.name.toLowerCase().includes(studentSearch.toLowerCase()) ||
    (student.student_number && student.student_number.toLowerCase().includes(studentSearch.toLowerCase()))
  );

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="rounded-md bg-red-50 p-4">
          <div className="text-sm text-red-700">{error}</div>
        </div>
      )}

      {feeAdjustmentInfo && (
        <div className="rounded-md bg-blue-50 p-4">
          <div className="text-sm text-blue-700 flex items-center gap-2">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            {feeAdjustmentInfo.message}
            {feeAdjustmentInfo.adjustedFee !== null && (
              <span className="font-semibold">Adjusted Fee: ₨{feeAdjustmentInfo.adjustedFee}</span>
            )}
          </div>
        </div>
      )}

      <div className="relative">
        <label htmlFor="student_search" className="block text-sm font-medium text-gray-700">
          Student
        </label>
        <input
          id="student_search"
          type="text"
          placeholder="Search by name or student number"
          value={studentSearch}
          ref={studentInputRef}
          onFocus={() => setShowStudentDropdown(true)}
          onChange={(e) => {
            setStudentSearch(e.target.value);
            setShowStudentDropdown(true);
            setFormData((prev) => ({ ...prev, student_id: '' }));
          }}
          autoComplete="off"
          className="mt-1 mb-2 block w-full rounded-md border-blue-700 bg-gray-800 text-white placeholder:text-blue-200 text-base shadow-sm focus:border-blue-400 focus:ring-2 focus:ring-blue-400 sm:text-base"
        />
        {showStudentDropdown && filteredStudents.length > 0 && (
          <ul className="absolute z-10 w-full bg-white border border-gray-300 rounded-md shadow-lg max-h-48 overflow-auto">
            {filteredStudents.map((student) => (
              <li
                key={student.id}
                className="px-4 py-2 cursor-pointer hover:bg-indigo-100 text-gray-900"
                onClick={() => handleStudentSelect(student)}
              >
                {student.name}{student.student_number ? ` (${student.student_number})` : ''}
              </li>
            ))}
          </ul>
        )}
        {formData.student_id && (
          <div className="text-sm text-gray-700 mb-2">
            Selected: {studentSearch}
            <button
              type="button"
              className="ml-2 text-xs text-red-500 underline"
              onClick={() => {
                setFormData((prev) => ({ ...prev, student_id: '' }));
                setStudentSearch('');
                setShowStudentDropdown(false);
                studentInputRef.current?.focus();
              }}
            >
              Clear
            </button>
          </div>
        )}
      </div>

      <div>
        <label htmlFor="class_id" className="block text-sm font-medium text-gray-700">
          Class
        </label>
        <select
          id="class_id"
          name="class_id"
          value={formData.class_id}
          onChange={handleChange}
          required
          className="mt-1 block w-full rounded-md border-blue-700 bg-gray-800 text-white text-base shadow-sm focus:border-blue-400 focus:ring-2 focus:ring-blue-400 sm:text-base"
        >
          <option value="">Select a class</option>
          {classes.map((classItem) => (
            <option key={classItem.id} value={classItem.id}>
              {classItem.title}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label htmlFor="amount" className="block text-sm font-medium text-gray-700">
          Amount
        </label>
        <div className="mt-1 relative rounded-md shadow-sm">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <span className="text-gray-500 sm:text-sm">₨</span>
          </div>
          <input
            type="number"
            name="amount"
            id="amount"
            value={formData.amount}
            onChange={handleChange}
            required
            min="0"
            step="0.01"
            className="block w-full pl-7 pr-12 rounded-md border-blue-700 bg-gray-800 text-white placeholder:text-blue-200 text-base focus:border-blue-400 focus:ring-2 focus:ring-blue-400 sm:text-base"
            placeholder="0.00"
          />
        </div>
      </div>

      <div>
        <label htmlFor="payment_date" className="block text-sm font-medium text-gray-700">
          Payment Date
        </label>
        <input
          type="date"
          name="payment_date"
          id="payment_date"
          value={formData.payment_date}
          onChange={handleChange}
          required
          className="mt-1 block w-full rounded-md border-blue-700 bg-gray-800 text-white placeholder:text-blue-200 text-base shadow-sm focus:border-blue-400 focus:ring-2 focus:ring-blue-400 sm:text-base"
        />
      </div>

      <div>
        <label htmlFor="payment_type" className="block text-sm font-medium text-gray-700">
          Payment Method
        </label>
        <select
          id="payment_type"
          name="payment_type"
          value={formData.payment_type}
          onChange={handleChange}
          required
          className="mt-1 block w-full rounded-md border-blue-700 bg-gray-800 text-white text-base shadow-sm focus:border-blue-400 focus:ring-2 focus:ring-blue-400 sm:text-base"
        >
          <option value="cash">Cash</option>
          <option value="bank_transfer">Bank Transfer</option>
          <option value="card">Card</option>
        </select>
      </div>

      <div>
        <label htmlFor="status" className="block text-sm font-medium text-gray-700">
          Status
        </label>
        <select
          id="status"
          name="status"
          value={formData.status}
          onChange={handleChange}
          required
          className="mt-1 block w-full rounded-md border-blue-700 bg-gray-800 text-white text-base shadow-sm focus:border-blue-400 focus:ring-2 focus:ring-blue-400 sm:text-base"
        >
          <option value="pending">Pending</option>
          <option value="completed">Completed</option>
          <option value="failed">Failed</option>
        </select>
      </div>

      <div>
        <label htmlFor="notes" className="block text-sm font-medium text-gray-700">
          Notes
        </label>
        <textarea
          id="notes"
          name="notes"
          value={formData.notes}
          onChange={handleChange}
          rows={3}
          className="mt-1 block w-full rounded-md border-blue-700 bg-gray-800 text-white text-base shadow-sm focus:border-blue-400 focus:ring-2 focus:ring-blue-400 sm:text-base"
        />
      </div>

      <div className="flex justify-end space-x-3">
        <button
          type="button"
          onClick={onCancel}
          className="inline-flex justify-center py-2 px-4 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={loading}
          className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
        >
          {loading ? 'Saving...' : 'Save Payment'}
        </button>
      </div>
    </form>
  );
} 