import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Navbar, NavTab } from './components/Navbar';
import { LoginView } from './components/LoginView';
import { DashboardView } from './components/DashboardView';
import { DataBimbinganView } from './components/DataBimbinganView';
import { DaftarSiswaView } from './components/DaftarSiswaView';
import { AkunGuruView } from './components/AkunGuruView';
import { BackupRestoreView } from './components/BackupRestoreView';
import { DetailHafalanModal } from './components/DetailHafalanModal';
import { Teacher, Student } from './types';
import { subscribeTeachers, subscribeStudents } from './services/dataService';
import { testConnection } from './firebase';
import { BookOpen, CheckCircle2, School } from 'lucide-react';

interface ErrorBoundaryProps {
  children: React.ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
}

class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Unhandled app error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center p-6 text-white text-center">
          <div className="max-w-md bg-slate-800 border border-slate-700 rounded-3xl p-8 shadow-2xl">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/20 text-amber-400 flex items-center justify-center mx-auto mb-4">
              <School className="w-6 h-6" />
            </div>
            <h2 className="text-xl font-bold mb-2">Terjadi Kendala Tampilan</h2>
            <p className="text-slate-300 text-xs mb-6">
              Sistem mendeteksi kendala pada antarmuka. Silakan klik tombol di bawah untuk memuat ulang aplikasi secara normal.
            </p>
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition shadow-lg shadow-emerald-900/40 cursor-pointer"
            >
              Muat Ulang Aplikasi
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

const MainApp: React.FC = () => {
  const { user, loading } = useAuth();
  const isSuperAdmin = user?.role === 'superadmin';
  const [activeTab, setActiveTab] = useState<NavTab>('dashboard');
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [dbConnected, setDbConnected] = useState<boolean>(true);

  // Set default active tab based on role upon login:
  // Guru Wali focuses directly on inputting student hafalan in Data Bimbingan ('bimbingan')
  // Admin starts at Dashboard ('dashboard')
  useEffect(() => {
    if (user?.role === 'guru_wali') {
      setActiveTab('bimbingan');
    } else if (user?.role === 'superadmin') {
      setActiveTab('dashboard');
    }
  }, [user?.role, user?.uid]);

  // Test Firestore connection on app mount per skill guideline
  useEffect(() => {
    testConnection().then((ok) => setDbConnected(ok));
  }, []);

  // Subscribe to Teachers and Students in real-time
  useEffect(() => {
    if (!user) return;

    const unsubTeachers = subscribeTeachers((list) => {
      setTeachers(list || []);
    });

    // If Guru Wali, filter only their students or subscribe
    const teacherNip = user.role === 'guru_wali' ? user.nip : undefined;
    const unsubStudents = subscribeStudents((list) => {
      setStudents(list || []);
      // Update selectedStudent reference if open
      if (selectedStudent) {
        const found = (list || []).find((s) => s.id === selectedStudent.id);
        if (found) setSelectedStudent(found);
      }
    }, teacherNip);

    return () => {
      if (typeof unsubTeachers === 'function') unsubTeachers();
      if (typeof unsubStudents === 'function') unsubStudents();
    };
  }, [user]);

  // Loading screen
  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center text-white">
        <div className="w-14 h-14 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mb-4" />
        <p className="text-emerald-400 font-bold text-sm tracking-wide">
          Memuat Sistem Monitoring Hafalan SMKN 3 PANGKEP...
        </p>
        <span className="text-xs text-slate-500 mt-1">Sinkronisasi Cloud Firebase</span>
      </div>
    );
  }

  // 1. Separate Login Page if not logged in
  if (!user) {
    return <LoginView />;
  }

  // Fallback for non-superadmin trying to access admin-only tabs
  const currentTab =
    !isSuperAdmin && (activeTab === 'kontrol_sandi' || activeTab === 'backup_restore')
      ? 'bimbingan'
      : activeTab;

  // 2. Logged In Dashboard & Navigation
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col">
      {/* Top Navbar */}
      <Navbar activeTab={currentTab} onSelectTab={setActiveTab} />

      {/* Main App Content Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {currentTab === 'dashboard' && (
          <DashboardView
            teachers={teachers}
            students={students}
            onNavigateTab={setActiveTab}
            onSelectStudent={(s) => setSelectedStudent(s)}
          />
        )}

        {currentTab === 'bimbingan' && (
          <DataBimbinganView
            teachers={teachers}
            students={students}
            onSelectStudent={(s) => setSelectedStudent(s)}
          />
        )}

        {currentTab === 'siswa' && (
          <DaftarSiswaView
            students={students}
            teachers={teachers}
            onSelectStudent={(s) => setSelectedStudent(s)}
          />
        )}

        {currentTab === 'kontrol_sandi' && isSuperAdmin && (
          <AkunGuruView teachers={teachers} />
        )}

        {currentTab === 'backup_restore' && isSuperAdmin && (
          <BackupRestoreView teachers={teachers} students={students} />
        )}
      </main>

      {/* Student 37-Surahs Juz 30 Modal */}
      {selectedStudent && (
        <DetailHafalanModal
          student={selectedStudent}
          onClose={() => setSelectedStudent(null)}
        />
      )}

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 mt-auto py-5 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <School className="w-4 h-4 text-emerald-600" />
            <span className="font-semibold text-slate-700">
              SMK Negeri 3 Pangkep (Pangkajene dan Kepulauan, Sulawesi Selatan)
            </span>
          </div>
          <div className="flex items-center gap-3 text-[11px]">
            <span className="flex items-center gap-1 text-emerald-600 font-medium">
              <CheckCircle2 className="w-3.5 h-3.5" /> Firebase Firestore Real-Time Active
            </span>
            <span>&bull;</span>
            <span>Program Tahfidz Juz 30</span>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <MainApp />
      </AuthProvider>
    </ErrorBoundary>
  );
}
