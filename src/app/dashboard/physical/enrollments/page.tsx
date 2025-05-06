'use client';

import { useState, useEffect } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import Modal from '@/components/Modal';
import EnrollmentForm from '@/components/EnrollmentForm';
import EnrollmentList from '@/components/EnrollmentList';
import PaymentList from '@/components/PaymentList';

interface Class {
  id: string;
  title: string;
  max_students: number;
  status: 'active' | 'inactive';
  enrollments?: { count: number }[];
}

export default function PhysicalEnrollmentsPage() {
  const [classes, setClasses] = useState<Class[]>([]);
  const [selectedClass, setSelectedClass] = useState<string>('');
  const [showModal, setShowModal] = useState(false);
  const [initialStudentId, setInitialStudentId] = useState<string | undefined>(undefined);
  const [feeAdjustment, setFeeAdjustment] = useState<string | undefined>(undefined);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const supabase = createClientComponentClient();

  useEffect(() => {
    fetchClasses();
  }, []);

  const fetchClasses = async () => {
    try {
      setLoading(true);
      setError(null);

      const { data, error } = await supabase
        .from('classes')
        .select('*, enrollments(count)')
        .eq('class_type', 'physical')
        .eq('status', 'active')
        .order('title');

      if (error) throw error;

      setClasses(data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleEnroll = (classId: string, studentId?: string, feeAdj?: string) => {
    setSelectedClass(classId);
    setInitialStudentId(studentId);
    setFeeAdjustment(feeAdj);
    setShowModal(true);
  };

  const handleSuccess = () => {
    setShowModal(false);
    fetchClasses();
  };

  // Handler for re-enrollment after year change
  const handleReenrollRequest = (studentId: string, feeAdj: string) => {
    setInitialStudentId(studentId);
    setFeeAdjustment(feeAdj);
    setShowModal(true);
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
      <div className="sm:flex sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Physical Class Enrollments</h1>
          <p className="mt-2 text-sm text-gray-700">
            Manage student enrollments for physical classes
          </p>
        </div>
      </div>

      {/* Class Selection */}
      <div className="bg-gradient-to-br from-blue-50 via-pink-50 to-yellow-50 shadow rounded-lg p-6">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {classes.map((classItem) => (
            <div
              key={classItem.id}
              className="relative rounded-lg border border-blue-200 bg-white/80 px-6 py-5 shadow-lg hover:scale-105 hover:shadow-2xl transition-transform duration-200 ease-in-out hover:border-pink-400 hover:bg-pink-50/80 cursor-pointer"
            >
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-blue-900">{classItem.title}</h3>
                  <span className="text-xs text-pink-700">
                    {classItem.enrollments?.[0]?.count || 0} enrolled
                  </span>
                </div>
                <button
                  onClick={() => handleEnroll(classItem.id)}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-semibold rounded-md shadow-sm text-white bg-gradient-to-r from-pink-500 to-yellow-400 hover:from-yellow-400 hover:to-pink-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-pink-400"
                >
                  Enroll Student
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Enrollments List */}
      <div className="bg-white shadow rounded-lg p-6">
        <h2 className="text-lg font-medium text-gray-900 mb-4">All Enrollments</h2>
        <EnrollmentList classId={selectedClass} enablePagination enableSearch />
      </div>

      {/* Payment List for year change workflow */}
      <div className="bg-white shadow rounded-lg p-6 mb-6">
        <PaymentList payments={[]} onUpdate={fetchClasses} onReenrollRequest={handleReenrollRequest} />
      </div>

      {/* Enrollment Modal */}
      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title="Enroll Student"
      >
        <EnrollmentForm
          classId={selectedClass}
          onSuccess={handleSuccess}
          onCancel={() => setShowModal(false)}
          initialStudentId={initialStudentId}
          feeAdjustment={feeAdjustment}
        />
      </Modal>
    </div>
  );
} 