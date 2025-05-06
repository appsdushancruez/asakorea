'use client';

import { useState, useEffect } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { format } from 'date-fns';

interface Payment {
  id: string;
  student_id: string;
  class_id: string;
  amount: number;
  payment_date: string;
  payment_type: 'cash' | 'bank_transfer' | 'card';
  status: 'pending' | 'completed' | 'failed';
  notes?: string;
  students?: {
    name: string;
    photo_url?: string;
    student_number?: string;
  };
  classes?: {
    title: string;
    fee?: number;
  };
  enrollments?: {
    adjusted_fee: number;
    fee_adjustment: string;
  }[];
}

interface PaymentListProps {
  payments: Payment[];
  onUpdate: () => void;
  onReenrollRequest?: (studentId: string, feeAdjustment: string) => void;
}

type PaymentRowProps = {
  payment: Payment;
  classFee: number;
  getPaymentProgress: (studentId: string, classId: string, classFee: number, paymentDate: string) => Promise<{ percent: number; sumPayments: number; adjustedFee: number; feeAdjustment: string | null }>;
  getPaymentMethodLabel: (method: Payment['payment_type']) => string;
  getStatusColor: (status: Payment['status']) => string;
  handleStatusChange: (id: string, status: Payment['status']) => void;
  loading: boolean;
};

export default function PaymentList({ payments, onUpdate, onReenrollRequest }: PaymentListProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [yearChangeModal, setYearChangeModal] = useState<{
    studentId: string;
    classId: string;
    studentName: string;
    classTitle: string;
  } | null>(null);
  const [timelineModal, setTimelineModal] = useState<null | { studentId: string; classId: string; studentName: string; classTitle: string }>(null);
  const [yearChangeHistory, setYearChangeHistory] = useState<any[]>([]);
  const [yearChangeLoading, setYearChangeLoading] = useState(false);
  const [selectedExamYear, setSelectedExamYear] = useState<string>('');
  const [feeAdjustment, setFeeAdjustment] = useState<string>('');
  const [confirming, setConfirming] = useState(false);
  const [studentExamYear, setStudentExamYear] = useState<number | null>(null);
  const [classSelectionModal, setClassSelectionModal] = useState<{
    studentId: string;
    studentName: string;
    classType: 'physical' | 'online';
  } | null>(null);
  const [availableClasses, setAvailableClasses] = useState<{ id: string; title: string }[]>([]);
  const [selectedNewClassId, setSelectedNewClassId] = useState<string>('');
  const [oldClassId, setOldClassId] = useState<string | null>(null);
  const [duplicateYearChangeWarning, setDuplicateYearChangeWarning] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const paymentsPerPage = 10;
  const supabase = createClientComponentClient();

  // Find eligible students/classes for year change (100% payment)
  const eligibleForYearChange: { studentName: string; classTitle: string; studentId: string; classId: string }[] = [];
  const seen = new Set<string>();
  payments.forEach((payment) => {
    const key = `${payment.student_id}-${payment.class_id}`;
    if (seen.has(key)) return;
    const totalPaid = payments
      .filter(p => p.student_id === payment.student_id && p.class_id === payment.class_id)
      .reduce((sum, p) => sum + (typeof p.amount === 'number' ? p.amount : 0), 0);
    const classFee = payment.classes?.fee || 0;
    const percent = classFee > 0 ? Math.min(100, Math.round((totalPaid / classFee) * 100)) : 0;
    if (percent >= 100) {
      eligibleForYearChange.push({
        studentName: payment.students?.name || 'Unknown',
        classTitle: payment.classes?.title || 'Unknown',
        studentId: payment.student_id,
        classId: payment.class_id,
      });
      seen.add(key);
    }
  });

  // Filter payments by search
  const filteredPayments = payments.filter(payment => {
    const studentName = payment.students?.name?.toLowerCase() || '';
    const studentNumber = payment.students?.student_number?.toLowerCase() || '';
    const classTitle = payment.classes?.title?.toLowerCase() || '';
    const amount = payment.amount?.toString() || '';
    const searchTerm = search.toLowerCase();
    return (
      studentName.includes(searchTerm) ||
      studentNumber.includes(searchTerm) ||
      classTitle.includes(searchTerm) ||
      amount.includes(searchTerm)
    );
  });

  const totalPages = Math.ceil(filteredPayments.length / paymentsPerPage);
  const paginatedPayments = filteredPayments.slice((currentPage - 1) * paymentsPerPage, currentPage * paymentsPerPage);

  // Handler for admin to initiate year change
  const handleYearChange = async (studentId: string, classId: string, studentName: string, classTitle: string) => {
    setYearChangeModal({ studentId, classId, studentName, classTitle });
    setSelectedExamYear('');
    setFeeAdjustment('');
    // Fetch student's original exam facing year (do NOT update this anywhere else)
    const { data: student, error: studentError } = await supabase
      .from('students')
      .select('exam_facing_year')
      .eq('id', studentId)
      .single();
    if (studentError) {
      console.error('Error fetching student:', studentError);
      setError(studentError.message);
      return;
    }
    setStudentExamYear(student.exam_facing_year);
    setSelectedExamYear(student.exam_facing_year.toString());
  };

  // Handler to fetch and show timeline
  const handleShowTimeline = async (studentId: string, classId: string, studentName: string, classTitle: string) => {
    setTimelineModal({ studentId, classId, studentName, classTitle });
    setYearChangeLoading(true);
    // Fetch year change history from DB
    const { data, error } = await supabase
      .from('exam_year_changes')
      .select('*')
      .eq('student_id', studentId)
      .eq('class_id', classId)
      .order('changed_at', { ascending: true });
    setYearChangeHistory(data || []);
    setYearChangeLoading(false);
  };

  // Handler for year selection in modal
  const handleExamYearSelect = async (year: string, currentYear: string) => {
    setSelectedExamYear(year);
    if (!yearChangeModal) return;
    // Always use the original exam_facing_year as the reference
    const originalYear = parseInt(currentYear);
    const newYear = parseInt(year);
    const yearDiff = newYear - originalYear;
    let feeAdjustment = 'Full Fee';
    if (yearDiff === 1) {
      feeAdjustment = 'No Fee (Free)';
    } else if (yearDiff === 2) {
      feeAdjustment = 'Half Fee';
    }
    setFeeAdjustment(feeAdjustment);
  };

  // Handler to confirm year change
  const handleConfirmYearChange = async () => {
    if (!yearChangeModal) return;
    const { studentId, classId, studentName } = yearChangeModal;
    // Check for existing year change record
    const { data: existingChange, error: existingError } = await supabase
      .from('exam_year_changes')
      .select('id')
      .eq('student_id', studentId)
      .eq('class_id', classId)
      .eq('new_exam_year', selectedExamYear)
      .maybeSingle();
    if (existingChange) {
      setDuplicateYearChangeWarning(
        `This student has already changed to exam year ${selectedExamYear} for this class.`
      );
      return;
    }
    // Insert as before
    const { error: yearChangeError } = await supabase
      .from('exam_year_changes')
      .insert([
        {
          student_id: studentId,
          class_id: classId,
          new_exam_year: selectedExamYear,
          fee_adjustment: feeAdjustment,
          changed_at: new Date().toISOString(),
        },
      ]);
    if (yearChangeError) {
      console.error('Error recording year change:', yearChangeError);
      setError(yearChangeError.message);
      return;
    }
    // Fetch the class type for the current class
    const { data: currentClass, error: classError } = await supabase
      .from('classes')
      .select('class_type')
      .eq('id', classId)
      .single();
    if (classError) {
      console.error('Error fetching class:', classError);
      setError(classError.message);
      return;
    }
    // Open the class selection modal
    setClassSelectionModal({
      studentId,
      studentName,
      classType: currentClass.class_type,
    });
    setOldClassId(classId);
    // Fetch available classes of the same type
    const { data: classes, error: classesError } = await supabase
      .from('classes')
      .select('id, title')
      .eq('class_type', currentClass.class_type)
      .eq('status', 'active');
    if (classesError) {
      console.error('Error fetching classes:', classesError);
      setError(classesError.message);
      return;
    }
    setAvailableClasses(classes || []);
    setYearChangeModal(null);
  };

  const handleConfirmClassSelection = async () => {
    if (!classSelectionModal || !selectedNewClassId) return;
    setLoading(true);
    setError(null);
    try {
      const { studentId, classType } = classSelectionModal;
      // Get the class fee
      const { data: classData, error: classError } = await supabase
        .from('classes')
        .select('fee')
        .eq('id', selectedNewClassId)
        .single();
      if (classError) throw classError;

      // Fetch all year changes for this student and class type
      const { data: yearChanges, error: yearChangeError } = await supabase
        .from('exam_year_changes')
        .select('id')
        .eq('student_id', studentId)
        .order('changed_at', { ascending: true });
      if (yearChangeError) throw yearChangeError;

      // Determine fee adjustment based on number of year changes
      let feeAdjustment = 'Full Fee';
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

      // Update all previous enrollments for this student and class type
      const { data: allClasses, error: allClassesError } = await supabase
        .from('classes')
        .select('id, fee')
        .eq('class_type', classType)
        .eq('status', 'active');
      if (allClassesError) throw allClassesError;
      const classIds = allClasses.map((c: any) => c.id);
      for (const cid of classIds) {
        let updateFee = adjustedFee;
        if (feeAdjustment === 'Half Fee') {
          const fee = allClasses.find((c: any) => c.id === cid)?.fee || classData.fee;
          updateFee = fee / 2;
        } else if (feeAdjustment === 'Full Fee') {
          updateFee = allClasses.find((c: any) => c.id === cid)?.fee || classData.fee;
        } else if (feeAdjustment === 'No Fee (Free)') {
          updateFee = 0;
        }
        await supabase
          .from('enrollments')
          .update({ fee_adjustment: feeAdjustment, adjusted_fee: updateFee })
          .eq('student_id', studentId)
          .eq('class_id', cid);
      }

      // Remove the old enrollment using oldClassId
      if (oldClassId) {
        const { error: unenrollError } = await supabase
          .from('enrollments')
          .delete()
          .eq('student_id', studentId)
          .eq('class_id', oldClassId);
        if (unenrollError) throw unenrollError;
      }
      // Check if enrollment already exists for the new class
      const { data: existingEnrollment, error: existingEnrollmentError } = await supabase
        .from('enrollments')
        .select('id')
        .eq('student_id', studentId)
        .eq('class_id', selectedNewClassId)
        .maybeSingle();
      if (!existingEnrollment) {
        // Create a new enrollment with the correct fee adjustment
        const { error: enrollError } = await supabase
          .from('enrollments')
          .insert([
            {
              student_id: studentId,
              class_id: selectedNewClassId,
              enrolled_at: new Date().toISOString(),
              status: 'active',
              fee_adjustment: feeAdjustment,
              adjusted_fee: adjustedFee,
            },
          ]);
        if (enrollError) throw enrollError;
      }
      setClassSelectionModal(null);
      setSelectedNewClassId('');
      setOldClassId(null);
      // Refresh the data
      onUpdate();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (paymentId: string, newStatus: Payment['status']) => {
    try {
      setLoading(true);
      setError(null);

      const { error } = await supabase
        .from('payments')
        .update({ status: newStatus })
        .eq('id', paymentId);

      if (error) throw error;
      onUpdate();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: Payment['status']) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'failed':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getPaymentMethodLabel = (method: Payment['payment_type']) => {
    switch (method) {
      case 'cash':
        return 'Cash';
      case 'bank_transfer':
        return 'Bank Transfer';
      case 'card':
        return 'Card';
      default:
        return method;
    }
  };

  // Helper to get all year changes for a student/class
  const getYearChanges = async (studentId: string, classId: string) => {
    const { data, error } = await supabase
      .from('exam_year_changes')
      .select('*')
      .eq('student_id', studentId)
      .eq('class_id', classId)
      .order('changed_at', { ascending: true });
    return data || [];
  };

  // Updated getPaymentProgress to consider year change timing
  const getPaymentProgress = async (
    studentId: string,
    classId: string,
    classFee: number,
    paymentDate: string
  ): Promise<{ percent: number; sumPayments: number; adjustedFee: number; feeAdjustment: string | null }> => {
    // Get all year changes for this student/class
    const yearChanges = await getYearChanges(studentId, classId);
    // Find the latest year change before or on the payment date
    let latestChange = null;
    for (const yc of yearChanges) {
      if (new Date(yc.changed_at) <= new Date(paymentDate)) {
        latestChange = yc;
      }
    }
    let adjustedFee = classFee;
    let feeAdjustment = null;
    let sumPayments = 0;
    if (latestChange) {
      if (latestChange.fee_adjustment === 'Half Fee') {
        adjustedFee = classFee / 2;
        feeAdjustment = 'Half Fee';
      } else if (latestChange.fee_adjustment === 'No Fee (Free)') {
        adjustedFee = 0;
        feeAdjustment = 'No Fee (Free)';
      }
      // Only sum payments after the year change
      sumPayments = payments
        .filter(p => p.student_id === studentId && p.class_id === classId && new Date(p.payment_date) >= new Date(latestChange.changed_at))
        .reduce((sum, p) => sum + (typeof p.amount === 'number' ? p.amount : 0), 0);
    } else {
      // No year change, sum all payments
      sumPayments = payments
        .filter(p => p.student_id === studentId && p.class_id === classId)
        .reduce((sum, p) => sum + (typeof p.amount === 'number' ? p.amount : 0), 0);
    }
    const percent = adjustedFee > 0 ? Math.min(100, Math.round((sumPayments / adjustedFee) * 100)) : sumPayments > 0 ? 100 : 0;
    return { percent, sumPayments, adjustedFee, feeAdjustment };
  };

  // Add PaymentRow child component
  function PaymentRow(props: PaymentRowProps) {
    const { payment, classFee, getPaymentProgress, getPaymentMethodLabel, getStatusColor, handleStatusChange, loading } = props;
    const [progress, setProgress] = useState<{ percent: number; sumPayments: number; adjustedFee: number; feeAdjustment: string | null }>({ percent: 0, sumPayments: 0, adjustedFee: classFee, feeAdjustment: null });
    useEffect(() => {
      getPaymentProgress(payment.student_id, payment.class_id, classFee, payment.payment_date).then(setProgress);
      // eslint-disable-next-line
    }, [payment.student_id, payment.class_id, classFee, payment.payment_date]);
    const { percent, adjustedFee, feeAdjustment } = progress;
    const isCompleted = percent >= 100;
    return (
      <tr className="hover:bg-blue-100 transition-colors">
        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
          <div className="flex items-center">
            {payment.students?.photo_url && (
              <div className="flex-shrink-0 h-10 w-10">
                <img className="h-10 w-10 rounded-full" src={payment.students.photo_url} alt="" />
              </div>
            )}
            <div className="ml-4">
              <div className="text-sm font-bold text-gray-700">{payment.students?.name}</div>
            </div>
          </div>
        </td>
        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
          <div>{payment.classes?.title}</div>
        </td>
        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
          ₨{payment.amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        </td>
        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
          {format(new Date(payment.payment_date), 'MMM d, yyyy')}
        </td>
        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
          {getPaymentMethodLabel(payment.payment_type)}
        </td>
        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
          <select
            value={payment.status}
            onChange={(e) => handleStatusChange(payment.id, e.target.value as Payment['status'])}
            disabled={loading}
            className={`text-sm rounded-full px-2 py-1 font-medium ${getStatusColor(payment.status)}`}
          >
            <option value="pending">Pending</option>
            <option value="completed">Completed</option>
            <option value="failed">Failed</option>
          </select>
        </td>
        <td className="px-6 py-4 whitespace-nowrap w-56">
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-2">
              <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                <div className={`h-3 rounded-full transition-all duration-300 ${isCompleted ? 'bg-green-500' : percent > 70 ? 'bg-yellow-400' : 'bg-red-500'}`} style={{ width: `${percent}%` }}></div>
              </div>
              <span className={`ml-2 text-xs font-bold ${isCompleted ? 'text-green-600' : 'text-gray-700'}`}>{percent}%</span>
              {feeAdjustment && (
                <span className="ml-1 relative group cursor-pointer">
                  <svg className="w-4 h-4 text-gray-500 inline-block" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M12 20a8 8 0 100-16 8 8 0 000 16z" />
                  </svg>
                  <span className="absolute left-1/2 -translate-x-1/2 bottom-full mb-2 hidden group-hover:block bg-gray-800 text-white text-xs rounded px-2 py-1 whitespace-nowrap z-10">
                    {feeAdjustment === 'Half Fee' && 'This student is eligible for half fee due to exam year change.'}
                    {feeAdjustment === 'No Fee (Free)' && 'This student is eligible for free enrollment due to exam year change.'}
                  </span>
                </span>
              )}
            </div>
            {isCompleted && <span className="text-green-600 text-xs font-bold">Completed</span>}
            {adjustedFee !== payment.classes?.fee && (
              <div className="text-xs text-gray-700">Adjusted Fee: ₨{adjustedFee.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
            )}
          </div>
        </td>
        <td className="px-6 py-4 text-sm text-gray-700">
          <div className="max-w-xs truncate">{payment.notes}</div>
        </td>
        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
          <button
            onClick={() => {
              // TODO: Implement edit functionality
            }}
            className="text-indigo-600 hover:text-indigo-900 font-bold"
          >
            Edit
          </button>
        </td>
      </tr>
    );
  }

  if (error) {
    return (
      <div className="rounded-md bg-red-50 p-4">
        <div className="text-sm text-red-700">{error}</div>
      </div>
    );
  }

  if (payments.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">No payments recorded yet.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Search Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-2">
        <input
          type="text"
          placeholder="Search by student, student number, class, or amount"
          value={search}
          onChange={e => { setSearch(e.target.value); setCurrentPage(1); }}
          className="rounded-md border-blue-700 bg-gray-800 text-white placeholder:text-blue-200 text-base shadow-sm focus:border-blue-400 focus:ring-2 focus:ring-blue-400 sm:text-base w-full sm:w-96"
        />
      </div>
      {/* Year Change Eligibility Notification */}
      {eligibleForYearChange.length > 0 && (
        <div className="mb-4 rounded-md bg-blue-50 p-4 border border-blue-200">
          <div className="font-semibold text-blue-800 mb-2 flex items-center gap-2">
            <svg className="w-5 h-5 text-blue-500" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M12 20a8 8 0 100-16 8 8 0 000 16z" /></svg>
            Students eligible for Exam Year Change
          </div>
          <ul className="list-disc pl-6 text-blue-900 text-sm">
            {eligibleForYearChange.map((item, idx) => (
              <li key={item.studentId + item.classId + idx} className="mb-1 flex items-center gap-2">
                <span className="font-medium">{item.studentName}</span> in <span className="font-medium">{item.classTitle}</span>
                <button
                  className="ml-2 px-2 py-1 text-xs rounded bg-blue-600 text-white hover:bg-blue-700 transition"
                  onClick={() => handleYearChange(item.studentId, item.classId, item.studentName, item.classTitle)}
                >
                  Initiate Year Change
                </button>
                <button
                  className="ml-2 px-2 py-1 text-xs rounded bg-gray-600 text-white hover:bg-gray-700 transition"
                  onClick={() => handleShowTimeline(item.studentId, item.classId, item.studentName, item.classTitle)}
                >
                  View Timeline
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
      {/* Year Change Modal */}
      {yearChangeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
          <div className="bg-gradient-to-br from-blue-50 via-pink-50 to-yellow-50 rounded-lg shadow-lg p-6 w-full max-w-md border-2 border-pink-200">
            <h2 className="text-lg font-extrabold mb-2 text-blue-900">Exam Year Change for <span className="text-pink-700">{yearChangeModal.studentName}</span> <span className="text-yellow-700">({yearChangeModal.classTitle})</span></h2>
            <div className="mb-4">
              <label className="block text-sm font-semibold mb-1 text-blue-800">Select New Exam Year</label>
              <select
                className="w-full border-2 border-pink-400 rounded px-2 py-1 bg-white text-blue-900 font-bold focus:ring-2 focus:ring-pink-400"
                value={selectedExamYear}
                onChange={e => handleExamYearSelect(e.target.value, studentExamYear?.toString() || '')}
                disabled={studentExamYear === null}
              >
                <option value="">Select year</option>
                {studentExamYear !== null && [0, 1, 2].map(offset => {
                  const year = studentExamYear + offset;
                  let label = `${year}`;
                  if (offset === 0) label += ' (Current)';
                  if (offset === 1) label += ' (Next Year, Free)';
                  if (offset === 2) label += ' (Year After, Half Fee)';
                  return <option key={year} value={year}>{label}</option>;
                })}
              </select>
            </div>
            <div className="mb-4">
              <label className="block text-sm font-semibold mb-1 text-pink-800">Fee Adjustment</label>
              <div className="text-base font-bold text-yellow-700">{feeAdjustment}</div>
            </div>
            <div className="flex justify-end gap-2 mt-4">
              <button
                type="button"
                onClick={() => setYearChangeModal(null)}
                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 font-semibold"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmYearChange}
                className="px-4 py-2 bg-gradient-to-r from-pink-500 to-yellow-400 text-white rounded-md hover:from-yellow-400 hover:to-pink-500 font-bold shadow"
              >
                Confirm Year Change
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Timeline Modal */}
      {timelineModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
          <div className="bg-gradient-to-br from-blue-50 via-pink-50 to-yellow-50 rounded-lg shadow-lg p-6 w-full max-w-md border-2 border-blue-200">
            <h2 className="text-lg font-extrabold mb-4 text-blue-900">Exam Year Change Timeline for <span className="text-pink-700">{timelineModal.studentName}</span> <span className="text-yellow-700">({timelineModal.classTitle})</span></h2>
            {yearChangeLoading ? (
              <div className="text-center py-8 text-blue-700 font-bold">Loading...</div>
            ) : yearChangeHistory.length === 0 ? (
              <div className="text-gray-500">No year changes recorded yet.</div>
            ) : (
              <ul className="timeline pl-4">
                {yearChangeHistory.map((change, idx) => (
                  <li key={change.id || idx} className="mb-4">
                    <div className="flex items-center gap-2">
                      <span className="font-extrabold text-lg text-blue-900">{change.new_exam_year}</span>
                      <span className={`text-xs font-bold ${change.fee_adjustment === 'No Fee (Free)' ? 'text-green-600' : change.fee_adjustment === 'Half Fee' ? 'text-yellow-600' : 'text-pink-700'}`}>({change.fee_adjustment})</span>
                    </div>
                    <div className="text-xs text-gray-700 font-semibold">Changed at: <span className="text-blue-700">{new Date(change.changed_at).toLocaleString()}</span></div>
                  </li>
                ))}
              </ul>
            )}
            <div className="flex justify-end mt-4">
              <button
                className="px-4 py-2 rounded bg-blue-600 hover:bg-blue-700 text-white font-bold shadow"
                onClick={() => setTimelineModal(null)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
      {classSelectionModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
          <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-md">
            <h2 className="text-lg font-bold mb-2">Select New Class for {classSelectionModal.studentName}</h2>
            <div className="mb-4">
              <label className="block text-sm font-medium mb-1">Select Class</label>
              <select
                className="w-full border border-gray-300 rounded px-2 py-1"
                value={selectedNewClassId}
                onChange={e => setSelectedNewClassId(e.target.value)}
              >
                <option value="">Select a class</option>
                {availableClasses.map((classItem) => (
                  <option key={classItem.id} value={classItem.id}>
                    {classItem.title}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex justify-end space-x-3">
              <button
                type="button"
                onClick={() => setClassSelectionModal(null)}
                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmClassSelection}
                disabled={loading || !selectedNewClassId}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                {loading ? 'Saving...' : 'Confirm'}
              </button>
            </div>
          </div>
        </div>
      )}
      {duplicateYearChangeWarning && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
          <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-md">
            <h2 className="text-lg font-bold mb-2 text-yellow-700">Duplicate Year Change</h2>
            <div className="mb-4 text-yellow-800">{duplicateYearChangeWarning}</div>
            <div className="flex justify-end">
              <button
                type="button"
                onClick={() => setDuplicateYearChangeWarning(null)}
                className="px-4 py-2 bg-yellow-600 text-white rounded-md hover:bg-yellow-700"
              >
                OK
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Table */}
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th scope="col" className="px-6 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Student</th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Class</th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Amount</th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Date</th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Method</th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Status</th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Payment Progress</th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Notes</th>
            <th scope="col" className="relative px-6 py-3"><span className="sr-only">Actions</span></th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {paginatedPayments.map((payment, idx) => (
            <PaymentRow
              key={payment.id + idx}
              payment={payment}
              classFee={payment.classes?.fee || 0}
              getPaymentProgress={getPaymentProgress}
              getPaymentMethodLabel={getPaymentMethodLabel}
              getStatusColor={getStatusColor}
              handleStatusChange={handleStatusChange}
              loading={loading}
            />
          ))}
        </tbody>
      </table>
      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center items-center gap-2 mt-4">
          <button
            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
            disabled={currentPage === 1}
            className="px-3 py-1 rounded bg-blue-100 text-blue-700 font-semibold disabled:opacity-50"
          >
            Prev
          </button>
          <span className="text-sm font-medium text-gray-700">
            Page {currentPage} of {totalPages}
          </span>
          <button
            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
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