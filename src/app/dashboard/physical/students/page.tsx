'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import type { Student } from '@/lib/supabase';
import Modal from '@/components/Modal';
import StudentForm from '@/components/StudentForm';

export default function PhysicalStudentsPage() {
  const [students, setStudents] = useState<Student[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<Student | undefined>();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const studentsPerPage = 10;

  const fetchStudents = async () => {
    try {
      const { data, error } = await supabase
        .from('students')
        .select('*')
        .eq('class_type', 'physical')
        .order('name');

      if (error) throw error;
      setStudents(data || []);
    } catch (error) {
      setError(error instanceof Error ? error.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStudents();
  }, []);

  const handleAddStudent = () => {
    setSelectedStudent(undefined);
    setIsModalOpen(true);
  };

  const handleEditStudent = (student: Student) => {
    setSelectedStudent(student);
    setIsModalOpen(true);
  };

  const handleModalClose = () => {
    setIsModalOpen(false);
    setSelectedStudent(undefined);
  };

  const handleSuccess = () => {
    fetchStudents();
    handleModalClose();
  };

  const filteredStudents = students.filter(student =>
    student.name.toLowerCase().includes(search.toLowerCase()) ||
    (student.student_number && student.student_number.toLowerCase().includes(search.toLowerCase()))
  );
  const totalPages = Math.ceil(filteredStudents.length / studentsPerPage);
  const paginatedStudents = filteredStudents.slice((currentPage - 1) * studentsPerPage, currentPage * studentsPerPage);
  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages) setCurrentPage(page);
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
          <h1 className="text-2xl font-semibold text-gray-900">Physical Class Students</h1>
          <p className="mt-2 text-sm text-gray-700">
            A list of all students enrolled in physical Korean language classes.
          </p>
        </div>
        <div className="mt-4 sm:ml-16 sm:mt-0 sm:flex-none">
          <button
            type="button"
            onClick={handleAddStudent}
            className="block rounded-md bg-indigo-600 px-3 py-2 text-center text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
          >
            Add student
          </button>
        </div>
      </div>
      <div className="mt-4 max-w-md">
        <input
          type="text"
          placeholder="Search by name or student number"
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="block w-full rounded-md border-blue-700 bg-gray-800 text-white placeholder:text-blue-200 text-base shadow-sm focus:border-blue-400 focus:ring-2 focus:ring-blue-400 sm:text-base"
        />
      </div>

      {error && (
        <div className="mt-4 rounded-md bg-red-50 p-4">
          <div className="text-sm text-red-700">{error}</div>
        </div>
      )}

      <div className="mt-8 flow-root pb-24 sm:pb-0">
        <div className="-mx-4 -my-2 overflow-x-auto sm:-mx-6 lg:-mx-8">
          <div className="inline-block min-w-full py-2 align-middle sm:px-6 lg:px-8">
            <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 sm:rounded-lg">
              <table className="min-w-full divide-y divide-blue-200 overflow-x-auto text-xs sm:text-sm bg-gradient-to-br from-blue-100 via-pink-50 to-yellow-50">
                <thead className="bg-white">
                  <tr>
                    <th scope="col" className="py-3.5 pl-4 pr-3 text-left font-semibold text-gray-900 sm:pl-6">Student No.</th>
                    <th scope="col" className="px-3 py-3.5 text-left font-semibold text-gray-900">Name</th>
                    <th scope="col" className="px-3 py-3.5 text-left font-semibold text-gray-900">Contact</th>
                    <th scope="col" className="px-3 py-3.5 text-left font-semibold text-gray-900">Status</th>
                    <th scope="col" className="relative py-3.5 pl-3 pr-4 sm:pr-6"><span className="sr-only">Actions</span></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-blue-200 text-gray-900">
                  {paginatedStudents.map((student) => (
                    <tr key={student.id} className="hover:bg-blue-50">
                      <td className="whitespace-nowrap py-4 pl-4 pr-3 font-medium text-gray-900 sm:pl-6">{student.student_number}</td>
                      <td className="whitespace-nowrap px-3 py-4 flex items-center gap-2 text-gray-900">
                        {student.photo_url && (
                          <img src={student.photo_url} alt={student.name} className="w-8 h-8 rounded-full object-cover mr-2 border border-gray-300" />
                        )}
                        {student.name}
                      </td>
                      <td className="whitespace-nowrap px-3 py-4 text-gray-700">{student.email || student.phone || '-'}</td>
                      <td className="whitespace-nowrap px-3 py-4 text-gray-700">{student.status}</td>
                      <td className="relative whitespace-nowrap py-4 pl-3 pr-4 text-right font-medium sm:pr-6">
                        <button
                          onClick={() => handleEditStudent(student)}
                          className="text-indigo-700 hover:text-indigo-900"
                        >
                          Edit
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {totalPages > 1 && (
                <div className="flex justify-center items-center gap-2 py-4 bg-white border-t border-gray-200">
                  <button onClick={() => handlePageChange(currentPage - 1)} disabled={currentPage === 1} className="px-2 py-1 rounded disabled:opacity-50">Prev</button>
                  {Array.from({ length: totalPages }, (_, i) => (
                    <button key={i+1} onClick={() => handlePageChange(i+1)} className={`px-2 py-1 rounded ${currentPage === i+1 ? 'bg-indigo-600 text-white' : 'bg-gray-100'}`}>{i+1}</button>
                  ))}
                  <button onClick={() => handlePageChange(currentPage + 1)} disabled={currentPage === totalPages} className="px-2 py-1 rounded disabled:opacity-50">Next</button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <Modal
        isOpen={isModalOpen}
        onClose={handleModalClose}
        title={selectedStudent ? 'Edit Student' : 'Add New Student'}
      >
        <StudentForm
          classType="physical"
          onSuccess={handleSuccess}
          onCancel={handleModalClose}
          student={selectedStudent as any}
        />
      </Modal>
    </div>
  );
} 