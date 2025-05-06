'use client';

import { useState, useEffect } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

interface StudentFormProps {
  onSuccess: (student?: any) => void;
  onCancel: () => void;
  classType: 'physical' | 'online';
  photoBlob?: Blob | null;
  student?: {
    id: string;
    name: string;
    email: string;
    phone: string;
    student_number: string;
    exam_facing_year: number;
    photo_url: string;
  };
}

export default function StudentForm({ onSuccess, onCancel, classType, photoBlob, student }: StudentFormProps) {
  const [name, setName] = useState(student?.name || '');
  const [email, setEmail] = useState(student?.email || '');
  const [phone, setPhone] = useState(student?.phone || '');
  const [studentNumber, setStudentNumber] = useState(student?.student_number || '');
  const [examFacingYear, setExamFacingYear] = useState(student?.exam_facing_year || new Date().getFullYear());
  const [photoUrl, setPhotoUrl] = useState(student?.photo_url || '');
  const [imageStats, setImageStats] = useState<{ size: number; width: number; height: number } | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [localPhotoBlob, setLocalPhotoBlob] = useState<Blob | null>(null);
  const [localImageStats, setLocalImageStats] = useState<{ size: number; width: number; height: number } | null>(null);

  useEffect(() => {
    if (photoBlob) {
      setPhotoUrl('');
      const reader = new FileReader();
      reader.onloadend = (e) => {
        const img = new window.Image();
        img.src = reader.result as string;
        img.onload = () => {
          setImageStats({
            size: photoBlob.size,
            width: img.naturalWidth,
            height: img.naturalHeight,
          });
        };
      };
      reader.readAsDataURL(photoBlob);
    }
  }, [photoBlob]);

  const supabase = createClientComponentClient();

  // Handle file upload and compression
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const compressed = await compressImage(file);
    setLocalPhotoBlob(compressed);
    // Get image stats
    const reader = new FileReader();
    reader.onloadend = (ev) => {
      const img = new window.Image();
      img.src = reader.result as string;
      img.onload = () => {
        setLocalImageStats({
          size: compressed.size,
          width: img.naturalWidth,
          height: img.naturalHeight,
        });
      };
    };
    reader.readAsDataURL(compressed);
  };

  // Compress image utility
  const compressImage = async (file: File): Promise<Blob> => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (event) => {
        const img = new window.Image();
        img.src = event.target?.result as string;
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const MAX_WIDTH = 800;
          const MAX_HEIGHT = 800;
          let width = img.width;
          let height = img.height;
          if (width > height) {
            if (width > MAX_WIDTH) {
              height *= MAX_WIDTH / width;
              width = MAX_WIDTH;
            }
          } else {
            if (height > MAX_HEIGHT) {
              width *= MAX_HEIGHT / height;
              height = MAX_HEIGHT;
            }
          }
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx?.drawImage(img, 0, 0, width, height);
          canvas.toBlob((blob) => {
            if (blob) resolve(blob);
          }, 'image/jpeg', 0.7);
        };
      };
    });
  };

  let effectivePhotoBlob = localPhotoBlob || photoBlob || null;
  let effectiveImageStats = localPhotoBlob ? localImageStats : imageStats;

  // Determine which image to preview: uploaded or existing
  let previewImageUrl = '';
  if (localPhotoBlob) {
    previewImageUrl = URL.createObjectURL(localPhotoBlob);
  } else if (student && student.photo_url) {
    previewImageUrl = student.photo_url;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !studentNumber) return;

    setLoading(true);
    setError(null);
    setSuccess(false);
    let filename = '';
    let finalPhotoUrl = photoUrl;
    try {
      // 1. Prepare student data
      const studentData = {
        name,
        email,
        phone,
        student_number: studentNumber,
        exam_facing_year: examFacingYear,
        photo_url: student ? student.photo_url : '', // default to existing photo for edit
        class_type: classType,
      };
      let insertResult;
      if (student) {
        insertResult = await supabase
          .from('students')
          .update(studentData)
          .eq('id', student.id)
          .select();
      } else {
        insertResult = await supabase
          .from('students')
          .insert(studentData)
          .select();
      }
      if (insertResult.error) {
        if (insertResult.error.message.includes('email')) {
          setError('This email is already used by another student.');
        } else if (insertResult.error.message.includes('phone')) {
          setError('This phone number is already used by another student.');
        } else if (insertResult.error.message.includes('student_number')) {
          setError('This student number is already used by another student.');
        } else {
          setError(insertResult.error.message);
        }
        setLoading(false);
        return;
      }
      const newStudent = Array.isArray(insertResult.data) ? insertResult.data[0] : insertResult.data;
      // 2. If a new image was uploaded, upload and update photo_url
      if (localPhotoBlob) {
        filename = `${Date.now()}-${Math.random().toString(36).substring(7)}.jpg`;
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('student-photos')
          .upload(filename, localPhotoBlob, {
            contentType: 'image/jpeg',
            cacheControl: '3600',
          });
        if (uploadError) {
          // If upload fails, delete the student record (if new)
          if (!student) await supabase.from('students').delete().eq('id', newStudent.id);
          throw uploadError;
        }
        const { data: publicData } = supabase.storage
          .from('student-photos')
          .getPublicUrl(filename);
        finalPhotoUrl = publicData.publicUrl;
        // Update student record with new photo_url
        const { error: updateError } = await supabase
          .from('students')
          .update({ photo_url: finalPhotoUrl })
          .eq('id', newStudent.id);
        if (updateError) throw updateError;
      } else if (student) {
        // If editing and no new image, keep the existing photo_url
        finalPhotoUrl = student.photo_url;
      }
      setSuccess(true);
      onSuccess({ ...newStudent, photo_url: finalPhotoUrl });
    } catch (err: any) {
      setError(err.message || 'An error occurred');
      if (filename && !success) {
        await supabase.storage.from('student-photos').remove([filename]);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="studentNumber" className="block text-sm font-medium text-gray-900">
          Student Number *
        </label>
        <input
          type="text"
          id="studentNumber"
          value={studentNumber}
          onChange={(e) => setStudentNumber(e.target.value)}
          className="mt-1 block w-full rounded-md border-blue-700 bg-gray-800 text-white placeholder:text-blue-200 text-base shadow-sm focus:border-blue-400 focus:ring-2 focus:ring-blue-400 sm:text-base"
          required
        />
      </div>
      <div>
        <label htmlFor="name" className="block text-sm font-medium text-gray-900">
          Name *
        </label>
        <input
          type="text"
          id="name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="mt-1 block w-full rounded-md border-blue-700 bg-gray-800 text-white placeholder:text-blue-200 text-base shadow-sm focus:border-blue-400 focus:ring-2 focus:ring-blue-400 sm:text-base"
          required
        />
      </div>
      <div>
        <label htmlFor="email" className="block text-sm font-medium text-gray-900">
          Email
        </label>
        <input
          type="email"
          id="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="mt-1 block w-full rounded-md border-blue-700 bg-gray-800 text-white placeholder:text-blue-200 text-base shadow-sm focus:border-blue-400 focus:ring-2 focus:ring-blue-400 sm:text-base"
        />
      </div>
      <div>
        <label htmlFor="phone" className="block text-sm font-medium text-gray-900">
          Phone
        </label>
        <input
          type="tel"
          id="phone"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          className="mt-1 block w-full rounded-md border-blue-700 bg-gray-800 text-white placeholder:text-blue-200 text-base shadow-sm focus:border-blue-400 focus:ring-2 focus:ring-blue-400 sm:text-base"
        />
      </div>
      <div>
        <label htmlFor="examFacingYear" className="block text-sm font-medium text-gray-900">
          Exam Facing Year *
        </label>
        <select
          id="examFacingYear"
          value={examFacingYear}
          onChange={(e) => setExamFacingYear(Number(e.target.value))}
          className="mt-1 block w-full rounded-md border-blue-700 bg-gray-800 text-white text-base shadow-sm focus:border-blue-400 focus:ring-2 focus:ring-blue-400 sm:text-base"
          required
        >
          {Array.from({ length: 5 }, (_, i) => new Date().getFullYear() + i).map((year) => (
            <option key={year} value={year}>
              {year}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label htmlFor="photoUpload" className="block text-sm font-medium text-gray-900">
          Upload Image (Optional)
        </label>
        <input
          type="file"
          id="photoUpload"
          accept="image/*"
          onChange={handleImageUpload}
          className="mt-1 block w-full rounded-md border-blue-700 bg-gray-800 text-white placeholder:text-blue-200 text-base shadow-sm focus:border-blue-400 focus:ring-2 focus:ring-blue-400 sm:text-base"
        />
      </div>
      {previewImageUrl && (
        <div>
          <label className="block text-sm font-medium text-gray-900 mb-2">
            {localPhotoBlob ? 'New Photo Preview' : 'Current Photo'}
          </label>
          <img
            src={previewImageUrl}
            alt="Student"
            className="w-32 h-32 object-cover rounded-lg"
          />
          {effectiveImageStats && (
            <div className="text-xs text-gray-400 mt-1">
              Size: {(effectiveImageStats.size / 1024).toFixed(2)} KB, Dimensions: {effectiveImageStats.width} x {effectiveImageStats.height}
            </div>
          )}
        </div>
      )}
      {error && (
        <div className="rounded-md bg-red-900/50 p-4">
          <div className="text-sm text-red-200">{error}</div>
        </div>
      )}
      {success && (
        <div className="rounded-md bg-green-900/50 p-4 mb-2">
          <div className="text-sm text-green-200">Student added successfully!</div>
        </div>
      )}
      <div className="flex justify-end space-x-3">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 text-sm font-medium text-gray-200 bg-gray-700 border border-gray-600 rounded-md shadow-sm hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={loading || !name || !studentNumber}
          className="inline-flex justify-center px-4 py-2 text-sm font-medium text-white bg-red-600 border border-transparent rounded-md shadow-sm hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? 'Saving...' : student ? 'Update Student' : 'Add Student'}
        </button>
      </div>
    </form>
  );
} 