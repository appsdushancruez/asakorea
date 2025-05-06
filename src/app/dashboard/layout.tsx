'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import MobileNav from '@/components/MobileNav';
import { HiUserGroup, HiAcademicCap, HiClipboardList, HiCash, HiDatabase } from 'react-icons/hi';
import { GiTempleGate, GiRiceCooker, GiChopsticks, GiMoneyStack } from 'react-icons/gi';
import { MdOutlineSchool, MdOutlineComputer } from 'react-icons/md';
import { FaDatabase, FaClipboardList } from 'react-icons/fa';

interface Stats {
  totalStudents: number;
  totalClasses: number;
  totalEnrollments: number;
  totalPayments: number;
  totalRevenue: number;
  averageAttendance: number;
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [stats, setStats] = useState<Stats>({
    totalStudents: 0,
    totalClasses: 0,
    totalEnrollments: 0,
    totalPayments: 0,
    totalRevenue: 0,
    averageAttendance: 0,
  });
  const [loading, setLoading] = useState(true);

  const supabase = createClientComponentClient();

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      setLoading(true);

      const [
        studentsResponse,
        classesResponse,
        enrollmentsResponse,
        paymentsResponse,
        attendanceResponse,
      ] = await Promise.all([
        supabase.from('students').select('id', { count: 'exact' }),
        supabase.from('classes').select('id', { count: 'exact' }),
        supabase.from('enrollments').select('id', { count: 'exact' }),
        supabase.from('payments').select('amount'),
        supabase.from('attendance').select('status'),
      ]);

      const totalAttendance = attendanceResponse.data?.length || 0;
      const presentAttendance =
        attendanceResponse.data?.filter((a) => a.status === 'present').length || 0;
      const averageAttendance =
        totalAttendance > 0 ? (presentAttendance / totalAttendance) * 100 : 0;

      setStats({
        totalStudents: studentsResponse.count || 0,
        totalClasses: classesResponse.count || 0,
        totalEnrollments: enrollmentsResponse.count || 0,
        totalPayments: paymentsResponse.data?.length || 0,
        totalRevenue: (paymentsResponse.data?.reduce((sum, p) => sum + (p.amount || 0), 0)) || 0,
        averageAttendance,
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const isActive = (path: string) => pathname.startsWith(path);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push('/');
  };

  return (
    <div className="min-h-screen bg-gray-900">
      {/* Desktop header bar with sign out */}
      <div className="hidden md:flex items-center justify-between px-6 py-4 bg-gray-800 border-b border-gray-700">
        <h1 className="text-xl font-bold text-white">한국어 학교</h1>
        <button
          className="btn-secondary"
          onClick={handleSignOut}
        >
          Sign Out
        </button>
      </div>
      <MobileNav />
      <div className="flex">
        {/* Sidebar */}
        <div className="hidden md:flex md:flex-shrink-0">
          <div className="flex flex-col w-64">
            <div className="flex flex-col flex-grow pt-5 pb-4 overflow-y-auto bg-gray-800">
              <div className="flex items-center flex-shrink-0 px-4 md:hidden">
                <h1 className="text-xl font-bold text-white">한국어 학교</h1>
              </div>
              <nav className="mt-5 flex-1 px-2 space-y-1">
                {/* Dashboard */}
                <div className="space-y-1 mb-4">
                  <Link
                    href="/dashboard"
                    className={`group flex items-center px-2 py-2 text-base font-semibold rounded-md transition-colors ${
                      pathname === '/dashboard'
                        ? 'bg-gradient-to-r from-blue-700 to-blue-900 text-white shadow-lg'
                        : 'text-white hover:bg-blue-800 hover:text-white'
                    }`}
                  >
                    <GiTempleGate className="mr-3 h-6 w-6 text-blue-400" />
                    Dashboard
                  </Link>
                </div>
                {/* Physical Classes */}
                <div className="space-y-1">
                  <h3 className="px-3 text-xs font-bold text-blue-200 uppercase tracking-wider">
                    <GiTempleGate className="inline-block mr-1 text-blue-400" /> Physical Classes
                  </h3>
                  <Link
                    href="/dashboard/physical/students"
                    className={`group flex items-center px-2 py-2 text-base font-medium rounded-md transition-colors ${
                      pathname === '/dashboard/physical/students'
                        ? 'bg-blue-900 text-white'
                        : 'text-blue-100 hover:bg-blue-800 hover:text-white'
                    }`}
                  >
                    <HiUserGroup className="mr-3 h-6 w-6 text-blue-400" />
                    Students
                  </Link>
                  <Link
                    href="/dashboard/physical/classes"
                    className={`group flex items-center px-2 py-2 text-base font-medium rounded-md transition-colors ${
                      pathname === '/dashboard/physical/classes'
                        ? 'bg-blue-900 text-white'
                        : 'text-blue-100 hover:bg-blue-800 hover:text-white'
                    }`}
                  >
                    <MdOutlineSchool className="mr-3 h-6 w-6 text-blue-400" />
                    Classes
                  </Link>
                  <Link
                    href="/dashboard/physical/attendance"
                    className={`group flex items-center px-2 py-2 text-base font-medium rounded-md transition-colors ${
                      pathname === '/dashboard/physical/attendance'
                        ? 'bg-blue-900 text-white'
                        : 'text-blue-100 hover:bg-blue-800 hover:text-white'
                    }`}
                  >
                    <HiClipboardList className="mr-3 h-6 w-6 text-blue-400" />
                    Attendance
                  </Link>
                  <Link
                    href="/dashboard/physical/enrollments"
                    className={`group flex items-center px-2 py-2 text-base font-medium rounded-md transition-colors ${
                      pathname === '/dashboard/physical/enrollments'
                        ? 'bg-blue-900 text-white'
                        : 'text-blue-100 hover:bg-blue-800 hover:text-white'
                    }`}
                  >
                    <FaClipboardList className="mr-3 h-6 w-6 text-blue-400" />
                    Enrollments
                  </Link>
                  <Link
                    href="/dashboard/physical/payments"
                    className={`group flex items-center px-2 py-2 text-base font-medium rounded-md transition-colors ${
                      pathname === '/dashboard/physical/payments'
                        ? 'bg-blue-900 text-white'
                        : 'text-blue-100 hover:bg-blue-800 hover:text-white'
                    }`}
                  >
                    <GiMoneyStack className="mr-3 h-6 w-6 text-blue-400" />
                    Payments
                  </Link>
                </div>
                {/* Online Classes */}
                <div className="space-y-1 mt-4">
                  <h3 className="px-3 text-xs font-bold text-pink-200 uppercase tracking-wider">
                    <GiRiceCooker className="inline-block mr-1 text-pink-400" /> Online Classes
                  </h3>
                  <Link
                    href="/dashboard/online/students"
                    className={`group flex items-center px-2 py-2 text-base font-medium rounded-md transition-colors ${
                      pathname === '/dashboard/online/students'
                        ? 'bg-pink-900 text-white'
                        : 'text-pink-100 hover:bg-pink-800 hover:text-white'
                    }`}
                  >
                    <HiUserGroup className="mr-3 h-6 w-6 text-pink-400" />
                    Students
                  </Link>
                  <Link
                    href="/dashboard/online/classes"
                    className={`group flex items-center px-2 py-2 text-base font-medium rounded-md transition-colors ${
                      pathname === '/dashboard/online/classes'
                        ? 'bg-pink-900 text-white'
                        : 'text-pink-100 hover:bg-pink-800 hover:text-white'
                    }`}
                  >
                    <MdOutlineComputer className="mr-3 h-6 w-6 text-pink-400" />
                    Classes
                  </Link>
                  <Link
                    href="/dashboard/online/attendance"
                    className={`group flex items-center px-2 py-2 text-base font-medium rounded-md transition-colors ${
                      pathname === '/dashboard/online/attendance'
                        ? 'bg-pink-900 text-white'
                        : 'text-pink-100 hover:bg-pink-800 hover:text-white'
                    }`}
                  >
                    <HiClipboardList className="mr-3 h-6 w-6 text-pink-400" />
                    Attendance
                  </Link>
                  <Link
                    href="/dashboard/online/enrollments"
                    className={`group flex items-center px-2 py-2 text-base font-medium rounded-md transition-colors ${
                      pathname === '/dashboard/online/enrollments'
                        ? 'bg-pink-900 text-white'
                        : 'text-pink-100 hover:bg-pink-800 hover:text-white'
                    }`}
                  >
                    <FaClipboardList className="mr-3 h-6 w-6 text-pink-400" />
                    Enrollments
                  </Link>
                  <Link
                    href="/dashboard/online/payments"
                    className={`group flex items-center px-2 py-2 text-base font-medium rounded-md transition-colors ${
                      pathname === '/dashboard/online/payments'
                        ? 'bg-pink-900 text-white'
                        : 'text-pink-100 hover:bg-pink-800 hover:text-white'
                    }`}
                  >
                    <GiMoneyStack className="mr-3 h-6 w-6 text-pink-400" />
                    Payments
                  </Link>
                </div>
              </nav>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex flex-col flex-1 min-h-screen">
          <main className="flex-1">
            <div className="py-6">
              <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
                {/* Stats Grid */}
                <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
                  {/* Total Students */}
                  <div className="bg-gray-800 overflow-hidden shadow rounded-lg">
                    <div className="p-5">
                      <div className="flex items-center">
                        <div className="flex-shrink-0">
                          <svg
                            className="h-6 w-6 text-red-500"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                            />
                          </svg>
                        </div>
                        <div className="ml-5 w-0 flex-1">
                          <dl>
                            <dt className="text-sm font-medium text-gray-400 truncate">
                              Total Students
                            </dt>
                            <dd className="flex items-baseline">
                              <div className="text-2xl font-semibold text-white">
                                {loading ? '...' : stats.totalStudents}
                              </div>
                            </dd>
                          </dl>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Total Classes */}
                  <div className="bg-gray-800 overflow-hidden shadow rounded-lg">
                    <div className="p-5">
                      <div className="flex items-center">
                        <div className="flex-shrink-0">
                          <svg
                            className="h-6 w-6 text-red-500"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                            />
                          </svg>
                        </div>
                        <div className="ml-5 w-0 flex-1">
                          <dl>
                            <dt className="text-sm font-medium text-gray-400 truncate">
                              Total Classes
                            </dt>
                            <dd className="flex items-baseline">
                              <div className="text-2xl font-semibold text-white">
                                {loading ? '...' : stats.totalClasses}
                              </div>
                            </dd>
                          </dl>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Total Enrollments */}
                  <div className="bg-gray-800 overflow-hidden shadow rounded-lg">
                    <div className="p-5">
                      <div className="flex items-center">
                        <div className="flex-shrink-0">
                          <svg
                            className="h-6 w-6 text-red-500"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                            />
                          </svg>
                        </div>
                        <div className="ml-5 w-0 flex-1">
                          <dl>
                            <dt className="text-sm font-medium text-gray-400 truncate">
                              Total Enrollments
                            </dt>
                            <dd className="flex items-baseline">
                              <div className="text-2xl font-semibold text-white">
                                {loading ? '...' : stats.totalEnrollments}
                              </div>
                            </dd>
                          </dl>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Total Revenue */}
                  <div className="bg-gray-800 overflow-hidden shadow rounded-lg">
                    <div className="p-5">
                      <div className="flex items-center">
                        <div className="flex-shrink-0">
                          <svg
                            className="h-6 w-6 text-red-500"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                            />
                          </svg>
                        </div>
                        <div className="ml-5 w-0 flex-1">
                          <dl>
                            <dt className="text-sm font-medium text-gray-400 truncate">
                              Total Revenue
                            </dt>
                            <dd className="flex items-baseline">
                              <div className="text-2xl font-semibold text-white">
                                {loading ? '...' : `₨${stats.totalRevenue.toLocaleString()}`}
                              </div>
                            </dd>
                          </dl>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Total Payments */}
                  <div className="bg-gray-800 overflow-hidden shadow rounded-lg">
                    <div className="p-5">
                      <div className="flex items-center">
                        <div className="flex-shrink-0">
                          <svg
                            className="h-6 w-6 text-red-500"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z"
                            />
                          </svg>
                        </div>
                        <div className="ml-5 w-0 flex-1">
                          <dl>
                            <dt className="text-sm font-medium text-gray-400 truncate">
                              Total Payments
                            </dt>
                            <dd className="flex items-baseline">
                              <div className="text-2xl font-semibold text-white">
                                {loading ? '...' : stats.totalPayments}
                              </div>
                            </dd>
                          </dl>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Average Attendance */}
                  <div className="bg-gray-800 overflow-hidden shadow rounded-lg">
                    <div className="p-5">
                      <div className="flex items-center">
                        <div className="flex-shrink-0">
                          <svg
                            className="h-6 w-6 text-red-500"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                            />
                          </svg>
                        </div>
                        <div className="ml-5 w-0 flex-1">
                          <dl>
                            <dt className="text-sm font-medium text-gray-400 truncate">
                              Average Attendance
                            </dt>
                            <dd className="flex items-baseline">
                              <div className="text-2xl font-semibold text-white">
                                {loading ? '...' : `${Math.round(stats.averageAttendance)}%`}
                              </div>
                            </dd>
                          </dl>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Page Content */}
                <div className="mt-8">{children}</div>
              </div>
            </div>
          </main>
          <footer className="w-full text-center text-xs text-gray-500 py-3 border-t border-gray-800 bg-gray-900">
            Software by : Dushan Cruez - TechMelvin - 0705565150
          </footer>
        </div>
      </div>
    </div>
  );
} 