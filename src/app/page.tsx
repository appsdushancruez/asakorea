"use client";
import { useState, useEffect } from "react";
import Image from "next/image";
import dynamic from "next/dynamic";
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { useRouter } from 'next/navigation';

const LoginPage = dynamic(() => import("./auth/login/page"), { ssr: false });

export default function Home() {
  const [showLogin, setShowLogin] = useState(false);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const checkSession = async () => {
      const supabase = createClientComponentClient();
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        router.push('/dashboard');
      } else {
        setLoading(false);
      }
    };
    checkSession();
  }, [router]);

  if (loading) return null;

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-950 pattern-bg relative overflow-x-hidden">
      {/* Animated Korean Characters Background */}
      <div className="pointer-events-none select-none absolute inset-0 z-0">
        {[...Array(16)].map((_, i) => (
          <span
            key={i}
            className={`absolute text-[2.5rem] md:text-5xl font-extrabold text-red-500 opacity-20 animate-float${i % 4}`}
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${(i % 4) * 1.2}s`,
            }}
          >
            {['한', '글', '꿈', '희', '사', '랑', '빛', '열', '정', '학', '교', '생', '도', '전', '미', '래'][i]}
          </span>
        ))}
      </div>
      {/* Logo */}
      <header className="w-full flex justify-center mt-8 mb-4 z-10">
        <img src="/logo.png" alt="Logo" style={{ height: 120, width: 480, objectFit: 'contain' }} />
      </header>
      {/* Animated Teacher Name */}
      <h1 className="text-3xl md:text-5xl font-extrabold text-center mb-2 bg-gradient-to-r from-red-400 via-orange-400 to-purple-600 bg-clip-text text-transparent animate-gradient-move z-10">
        아산타 아수루무니<br />
        <span className="block text-lg md:text-2xl font-bold text-orange-400 mt-2">Asantha Asurumuni</span>
      </h1>
      {/* Subtitle */}
      <h2 className="text-xl md:text-2xl text-center text-orange-300 font-semibold mb-6 z-10">한국어 EPS-TOPIK &amp; Korean Language School</h2>
      {/* Description */}
      <p className="max-w-xl text-center text-gray-300 mb-8 text-lg z-10">
        Welcome to the premier Korean language and EPS-TOPIK exam preparation platform. Learn, practice, and succeed with expert guidance from 아산타 아수루무니 (Asantha Asurumuni).
      </p>
      {/* Sign In Button */}
      <button
        className="btn-primary px-8 py-3 text-lg font-bold shadow-lg animate-fade-in z-10"
        onClick={() => setShowLogin(true)}
      >
        Sign In
      </button>
      {/* Login Modal */}
      {showLogin && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-70">
          <div className="relative flex flex-col items-center justify-center w-full max-w-xs h-[370px] mx-auto animate-fade-in">
            <button
              className="absolute top-2 right-2 text-gray-400 hover:text-white text-2xl z-10"
              onClick={() => setShowLogin(false)}
              aria-label="Close login"
            >
              &times;
            </button>
            <div className="rounded-lg bg-gray-900 shadow-lg p-6 w-full h-full flex flex-col justify-center">
              <LoginPage />
            </div>
          </div>
        </div>
      )}
      {/* Footer */}
      <footer className="absolute bottom-4 w-full text-center text-xs text-gray-500 z-10">
        &copy; {new Date().getFullYear()} 아산타 아수루무니 | Asantha Asurumuni | EPS-TOPIK Korean School
        <div className="mt-1 text-gray-400">Software by : Dushan Cruez - TechMelvin - 0705565150</div>
      </footer>
      <style jsx global>{`
        @keyframes gradient-move {
          0% { background-position: 0% 50%; }
          100% { background-position: 100% 50%; }
        }
        .animate-gradient-move {
          background-size: 200% 200%;
          animation: gradient-move 3s linear infinite alternate;
        }
        @keyframes float0 {
          0% { transform: translateY(0); }
          100% { transform: translateY(-40px); }
        }
        @keyframes float1 {
          0% { transform: translateY(0); }
          100% { transform: translateY(40px); }
        }
        @keyframes float2 {
          0% { transform: translateY(0); }
          100% { transform: translateY(-30px); }
        }
        @keyframes float3 {
          0% { transform: translateY(0); }
          100% { transform: translateY(30px); }
        }
        .animate-float0 { animation: float0 6s ease-in-out infinite alternate; }
        .animate-float1 { animation: float1 7s ease-in-out infinite alternate; }
        .animate-float2 { animation: float2 5s ease-in-out infinite alternate; }
        .animate-float3 { animation: float3 8s ease-in-out infinite alternate; }
      `}</style>
    </div>
  );
} 