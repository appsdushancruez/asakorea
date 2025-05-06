'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Modal from '@/components/Modal';
import ImageCapture from '@/components/ImageCapture';
import StudentForm from '@/components/StudentForm';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { Database } from '@/types/supabase';
import { GiTempleGate } from 'react-icons/gi';
import { MdOutlineComputer, MdPhotoCamera } from 'react-icons/md';

export default function DashboardPage() {
  const router = useRouter();
  const [showCaptureModal, setShowCaptureModal] = useState(false);
  const [capturedPhotoBlob, setCapturedPhotoBlob] = useState<Blob | null>(null);
  const [showClassTypePrompt, setShowClassTypePrompt] = useState(false);
  const [selectedClassType, setSelectedClassType] = useState<'physical' | 'online' | null>(null);
  const [showStudentForm, setShowStudentForm] = useState(false);
  const [recentStudents, setRecentStudents] = useState<any[]>([]);
  const [locationCount, setLocationCount] = useState<number>(0);
  const [physicalClassCount, setPhysicalClassCount] = useState<number>(0);
  const [onlineClassCount, setOnlineClassCount] = useState<number>(0);
  const supabase = createClientComponentClient<Database>();

  useEffect(() => {
    const fetchRecentStudents = async () => {
      const { data, error } = await supabase
        .from('students')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(10);
      if (!error && data) setRecentStudents(data);
    };
    const fetchCounts = async () => {
      const [{ count: locCount }, { count: physCount }, { count: onlineCount }] = await Promise.all([
        supabase.from('locations').select('id', { count: 'exact', head: true }),
        supabase.from('classes').select('id', { count: 'exact', head: true }).eq('class_type', 'physical'),
        supabase.from('classes').select('id', { count: 'exact', head: true }).eq('class_type', 'online'),
      ]);
      setLocationCount(locCount || 0);
      setPhysicalClassCount(physCount || 0);
      setOnlineClassCount(onlineCount || 0);
    };
    fetchRecentStudents();
    fetchCounts();
  }, []);

  const handleCaptureClick = () => {
    setShowCaptureModal(true);
    setCapturedPhotoBlob(null);
    setShowClassTypePrompt(false);
    setSelectedClassType(null);
    setShowStudentForm(false);
  };

  const handleImageCaptured = (imageData: Blob | string) => {
    if (imageData instanceof Blob) {
      setCapturedPhotoBlob(imageData);
    } else {
      // If string (base64), ignore or handle as needed
      setCapturedPhotoBlob(null);
    }
    setShowCaptureModal(false);
    setShowClassTypePrompt(true);
  };

  const handleClassTypeSelect = (type: 'physical' | 'online') => {
    setSelectedClassType(type);
    setShowClassTypePrompt(false);
    setShowStudentForm(true);
  };

  const handleStudentFormSuccess = (student?: any) => {
    setShowStudentForm(false);
    setCapturedPhotoBlob(null);
    setSelectedClassType(null);
    if (student) {
      setRecentStudents((prev) => [student, ...prev.filter(s => s.id !== student.id)].slice(0, 10));
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl py-16 sm:py-24 lg:max-w-none lg:py-32">
          <h2 className="text-2xl font-bold text-gray-900">Welcome to Korean Class Management</h2>
          <p className="mt-4 text-gray-500">
            Select a section from the sidebar to manage your classes.
          </p>

          <div className="mt-10 space-y-12 lg:grid lg:grid-cols-3 lg:gap-x-6 lg:space-y-0">
            <div className="group relative">
              <div className="relative h-80 w-full overflow-hidden rounded-lg bg-white sm:aspect-h-1 sm:aspect-w-2 lg:aspect-h-1 lg:aspect-w-1 group-hover:opacity-75 sm:h-64 flex flex-col items-center justify-center">
                <GiTempleGate className="text-blue-400 mb-4" size={56} />
                <div className="flex flex-col items-center justify-center flex-1">
                  <h3 className="text-lg font-medium text-indigo-900">Physical Classes</h3>
                  <p className="mt-2 text-sm text-indigo-500">
                    Manage your in-person Korean language classes
                  </p>
                  <button
                    onClick={() => router.push('/dashboard/physical/students')}
                    className="mt-4 rounded-md bg-indigo-600 px-3.5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
                  >
                    View Physical Classes
                  </button>
                </div>
              </div>
            </div>

            <div className="group relative">
              <div className="relative h-80 w-full overflow-hidden rounded-lg bg-white sm:aspect-h-1 sm:aspect-w-2 lg:aspect-h-1 lg:aspect-w-1 group-hover:opacity-75 sm:h-64 flex flex-col items-center justify-center">
                <MdOutlineComputer className="text-green-400 mb-4" size={56} />
                <div className="flex flex-col items-center justify-center flex-1">
                  <h3 className="text-lg font-medium text-green-900">Online Classes</h3>
                  <p className="mt-2 text-sm text-green-500">
                    Manage your online Korean language classes
                  </p>
                  <button
                    onClick={() => router.push('/dashboard/online/students')}
                    className="mt-4 rounded-md bg-green-600 px-3.5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-green-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-green-600"
                  >
                    View Online Classes
                  </button>
                </div>
              </div>
            </div>

            <div className="group relative">
              <div className="relative h-80 w-full overflow-hidden rounded-lg bg-white sm:aspect-h-1 sm:aspect-w-2 lg:aspect-h-1 lg:aspect-w-1 group-hover:opacity-75 sm:h-64 flex flex-col items-center justify-center">
                <MdPhotoCamera className="text-red-400 mb-4" size={56} />
                <div className="flex flex-col items-center justify-center flex-1">
                  <h3 className="text-lg font-medium text-red-900">Quick Capture Student Photo</h3>
                  <p className="mt-2 text-sm text-red-500">
                    Capture and register a new student on the spot
                  </p>
                  <button
                    onClick={handleCaptureClick}
                    className="mt-4 rounded-md bg-red-600 px-3.5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-red-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-600"
                  >
                    Capture Student Photo
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Modal for Image Capture */}
          <Modal isOpen={showCaptureModal} onClose={() => setShowCaptureModal(false)} title="Capture or Upload Student Photo">
            <div className="p-4">
              <ImageCapture
                onImageCaptured={handleImageCaptured}
                onError={() => setShowCaptureModal(false)}
              />
            </div>
          </Modal>

          {/* Prompt for Class Type */}
          <Modal isOpen={showClassTypePrompt} onClose={() => setShowClassTypePrompt(false)} title="Select Class Type">
            <div className="p-6 text-center">
              <div className="flex justify-center gap-4">
                <button
                  className="px-6 py-3 rounded-lg bg-indigo-600 text-white font-semibold hover:bg-indigo-700"
                  onClick={() => handleClassTypeSelect('physical')}
                >
                  Physical
                </button>
                <button
                  className="px-6 py-3 rounded-lg bg-green-600 text-white font-semibold hover:bg-green-700"
                  onClick={() => handleClassTypeSelect('online')}
                >
                  Online
                </button>
              </div>
            </div>
          </Modal>

          {/* Student Registration Form with Photo */}
          <Modal isOpen={showStudentForm} onClose={() => setShowStudentForm(false)} title="Register Student">
            <div className="p-4">
              <StudentForm
                onSuccess={handleStudentFormSuccess}
                onCancel={() => setShowStudentForm(false)}
                classType={selectedClassType || 'physical'}
                photoBlob={capturedPhotoBlob}
              />
            </div>
          </Modal>
        </div>
      </div>
    </div>
  );
} 