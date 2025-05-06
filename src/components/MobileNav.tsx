'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

export default function MobileNav() {
  const [activeSection, setActiveSection] = useState<'physical' | 'online'>('physical');
  const [menuOpen, setMenuOpen] = useState(false);
  const pathname = usePathname();
  const supabase = createClientComponentClient();

  const isActive = (path: string) => pathname.startsWith(path);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    window.location.href = '/';
  };

  return (
    <div className="md:hidden">
      {/* Top bar with burger menu */}
      <div className="fixed top-0 left-0 right-0 bg-gray-800 border-b border-gray-700 p-2 z-50 flex items-center justify-between">
        <div className="flex space-x-2">
          <button
            onClick={() => setActiveSection('physical')}
            className={`flex-1 py-2 px-4 rounded-md text-sm font-medium ${
              activeSection === 'physical'
                ? 'bg-red-600 text-white'
                : 'bg-gray-700 text-gray-300'
            }`}
          >
            Physical Classes
          </button>
          <button
            onClick={() => setActiveSection('online')}
            className={`flex-1 py-2 px-4 rounded-md text-sm font-medium ${
              activeSection === 'online'
                ? 'bg-red-600 text-white'
                : 'bg-gray-700 text-gray-300'
            }`}
          >
            Online Classes
          </button>
        </div>
        {/* Burger menu icon */}
        <button
          className="mobile-menu-button ml-2"
          onClick={() => setMenuOpen(!menuOpen)}
          aria-label="Open menu"
        >
          <svg className="h-7 w-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
      </div>
      {/* Slide-out menu */}
      <div
        className={`fixed top-0 right-0 h-full w-64 bg-gray-900 shadow-lg z-50 transform transition-transform duration-300 ${menuOpen ? 'translate-x-0' : 'translate-x-full'}`}
        style={{ willChange: 'transform' }}
      >
        <div className="flex flex-col h-full p-6">
          <button
            className="self-end mb-6 text-gray-400 hover:text-white"
            onClick={() => setMenuOpen(false)}
            aria-label="Close menu"
          >
            <svg className="h-7 w-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
          <Link href="/dashboard" className="nav-link mb-4 font-semibold text-lg" onClick={() => setMenuOpen(false)}>
            Dashboard
          </Link>
          <Link href="/dashboard/physical/students" className="nav-link mb-2" onClick={() => setMenuOpen(false)}>
            Physical Students
          </Link>
          <Link href="/dashboard/online/students" className="nav-link mb-2" onClick={() => setMenuOpen(false)}>
            Online Students
          </Link>
          <Link href="/dashboard/physical/classes" className="nav-link mb-2" onClick={() => setMenuOpen(false)}>
            Physical Classes
          </Link>
          <Link href="/dashboard/online/classes" className="nav-link mb-2" onClick={() => setMenuOpen(false)}>
            Online Classes
          </Link>
          <Link href="/dashboard/physical/attendance" className="nav-link mb-2" onClick={() => setMenuOpen(false)}>
            Physical Attendance
          </Link>
          <Link href="/dashboard/online/attendance" className="nav-link mb-2" onClick={() => setMenuOpen(false)}>
            Online Attendance
          </Link>
          <Link href="/dashboard/physical/enrollments" className="nav-link mb-2" onClick={() => setMenuOpen(false)}>
            Physical Enrollments
          </Link>
          <Link href="/dashboard/online/enrollments" className="nav-link mb-2" onClick={() => setMenuOpen(false)}>
            Online Enrollments
          </Link>
          <Link href="/dashboard/physical/payments" className="nav-link mb-2" onClick={() => setMenuOpen(false)}>
            Physical Payments
          </Link>
          <Link href="/dashboard/online/payments" className="nav-link mb-2" onClick={() => setMenuOpen(false)}>
            Online Payments
          </Link>
          <div className="mt-auto pt-6">
            <button
              className="btn-secondary w-full"
              onClick={handleSignOut}
            >
              Sign Out
            </button>
          </div>
        </div>
      </div>
      {/* Overlay when menu is open */}
      {menuOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-40 z-40"
          onClick={() => setMenuOpen(false)}
        />
      )}
      {/* Bottom Navigation */}
      <div className="fixed bottom-0 left-0 right-0 bg-gray-800 border-t border-gray-700 p-2 z-50">
        <div className="grid grid-cols-5 gap-1">
          <Link
            href={`/dashboard/${activeSection}/students`}
            className={`flex flex-col items-center justify-center p-2 rounded-md ${
              isActive(`/dashboard/${activeSection}/students`)
                ? 'text-white bg-gray-700'
                : 'text-gray-400'
            }`}
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
              />
            </svg>
            <span className="text-xs mt-1">Students</span>
          </Link>

          <Link
            href={`/dashboard/${activeSection}/classes`}
            className={`flex flex-col items-center justify-center p-2 rounded-md ${
              isActive(`/dashboard/${activeSection}/classes`)
                ? 'text-white bg-gray-700'
                : 'text-gray-400'
            }`}
          >
            <svg
              className="w-5 h-5"
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
            <span className="text-xs mt-1">Classes</span>
          </Link>

          <Link
            href={`/dashboard/${activeSection}/attendance`}
            className={`flex flex-col items-center justify-center p-2 rounded-md ${
              isActive(`/dashboard/${activeSection}/attendance`)
                ? 'text-white bg-gray-700'
                : 'text-gray-400'
            }`}
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"
              />
            </svg>
            <span className="text-xs mt-1">Attendance</span>
          </Link>

          <Link
            href={`/dashboard/${activeSection}/enrollments`}
            className={`flex flex-col items-center justify-center p-2 rounded-md ${
              isActive(`/dashboard/${activeSection}/enrollments`)
                ? 'text-white bg-gray-700'
                : 'text-gray-400'
            }`}
          >
            <svg
              className="w-5 h-5"
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
            <span className="text-xs mt-1">Enrollments</span>
          </Link>

          <Link
            href={`/dashboard/${activeSection}/payments`}
            className={`flex flex-col items-center justify-center p-2 rounded-md ${
              isActive(`/dashboard/${activeSection}/payments`)
                ? 'text-white bg-gray-700'
                : 'text-gray-400'
            }`}
          >
            <svg
              className="w-5 h-5"
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
            <span className="text-xs mt-1">Payments</span>
          </Link>
        </div>
      </div>
      {/* Content Padding */}
      <div className="pb-16 pt-16" />
    </div>
  );
} 