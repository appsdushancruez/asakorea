'use client';

import { useState, useEffect } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import Modal from '@/components/Modal';
import PaymentForm from '@/components/PaymentForm';
import PaymentList from '@/components/PaymentList';

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

export default function PhysicalPaymentsPage() {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const supabase = createClientComponentClient();

  useEffect(() => {
    fetchPayments();
  }, []);

  const fetchPayments = async () => {
    try {
      setLoading(true);
      setError(null);

      const { data, error } = await supabase
        .from('payments')
        .select(`
          *,
          students:student_id(name, photo_url),
          classes:class_id(title, fee)
        `)
        .eq('class_type', 'physical')
        .order('payment_date', { ascending: false });

      if (error) throw error;

      setPayments(data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleSuccess = () => {
    setShowModal(false);
    fetchPayments();
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
          <h1 className="text-2xl font-bold text-gray-900">Payments</h1>
          <p className="mt-2 text-sm text-gray-700">
            Manage student payments for physical classes
          </p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
        >
          Record Payment
        </button>
      </div>

      {/* Payments List */}
      <div className="bg-white shadow rounded-lg p-6 pb-24 sm:pb-0">
        <PaymentList payments={payments} onUpdate={fetchPayments} />
      </div>

      {/* Payment Modal */}
      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title="Record Payment"
      >
        <PaymentForm
          onSuccess={handleSuccess}
          onCancel={() => setShowModal(false)}
          classType="physical"
        />
      </Modal>
    </div>
  );
} 