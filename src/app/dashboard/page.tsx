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
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-blue-50 to-green-50 flex flex-col items-center justify-center p-8">
      <div className="max-w-5xl w-full mx-auto">
        <h1 className="text-3xl font-bold text-pink-700 mb-2 text-center drop-shadow">Welcome to Korean Class Management</h1>
        <p className="text-lg text-blue-600 mb-8 text-center">Select a section from the sidebar to manage your classes.</p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Physical Classes Card */}
          <div className="rounded-2xl shadow-lg bg-gradient-to-br from-blue-100 via-blue-50 to-pink-50 p-8 flex flex-col items-center border border-blue-200 hover:shadow-2xl transition">
            <div className="mb-4">
              <GiTempleGate className="text-blue-400" size={48} />
            </div>
            <h2 className="text-xl font-semibold text-blue-700 mb-2">Physical Classes</h2>
            <p className="text-blue-500 mb-4 text-center">Manage your in-person Korean language classes</p>
            <button
              onClick={() => router.push('/dashboard/physical/students')}
              className="bg-blue-500 hover:bg-blue-400 text-white font-bold py-2 px-4 rounded-lg shadow transition"
            >
              View Physical Classes
            </button>
          </div>
          {/* Online Classes Card */}
          <div className="rounded-2xl shadow-lg bg-gradient-to-br from-green-100 via-green-50 to-pink-50 p-8 flex flex-col items-center border border-green-200 hover:shadow-2xl transition">
            <div className="mb-4">
              <MdOutlineComputer className="text-green-400" size={48} />
            </div>
            <h2 className="text-xl font-semibold text-green-700 mb-2">Online Classes</h2>
            <p className="text-green-500 mb-4 text-center">Manage your online Korean language classes</p>
            <button
              onClick={() => router.push('/dashboard/online/students')}
              className="bg-green-500 hover:bg-green-400 text-white font-bold py-2 px-4 rounded-lg shadow transition"
            >
              View Online Classes
            </button>
          </div>
          {/* Quick Capture Student Photo Card */}
          <div className="rounded-2xl shadow-lg bg-gradient-to-br from-pink-100 via-pink-50 to-blue-50 p-8 flex flex-col items-center border border-pink-200 hover:shadow-2xl transition">
            <div className="mb-4">
              <MdPhotoCamera className="text-pink-400" size={48} />
            </div>
            <h2 className="text-xl font-semibold text-pink-700 mb-2">Quick Capture Student Photo</h2>
            <p className="text-pink-500 mb-4 text-center">Capture and register a new student on the spot</p>
            <button
              onClick={handleCaptureClick}
              className="bg-pink-500 hover:bg-pink-400 text-white font-bold py-2 px-4 rounded-lg shadow transition"
            >
              Capture Student Photo
            </button>
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
  );
} 