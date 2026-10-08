export type UserRole = 'superadmin' | 'admin_staf' | 'guru_wali' | 'pegawai_tu';

export interface UserSession {
  uid: string;
  email: string;
  name: string;
  role: UserRole;
  nip?: string;
  classes?: string;
}

export interface Teacher {
  id: string;
  nip: string;
  name: string;
  email: string;
  password?: string;
  phone: string;
  classes: string;
  role?: 'guru_wali' | 'pegawai_tu';
  isActive: boolean;
  totalMemorized?: number; // Jumlah surah yang sudah hapal (dari 38: Al-Fatihah & Juz 30)
  totalInProcess?: number; // Jumlah surah dalam proses
  totalRemaining?: number; // Jumlah surah belum hapal
  lastHafalanUpdated?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface TeacherMemorizationRecord {
  id?: string;
  teacherId: string;
  teacherNip: string;
  teacherName: string;
  surahNumber: number;
  surahName: string;
  arabicName: string;
  totalAyat: number;
  ayatRange: string;
  status: MemorizationStatus;
  completedDate?: string;
  grade?: 'Mumtaz' | 'Jayyid Jiddan' | 'Jayyid' | 'Maqbul' | '';
  notes?: string; // Catatan tajwid / tahsin / kelancaran
  listenerName?: string; // Guru/Ustadz yang ditunjuk menyimak
  listenerNip?: string;
  updatedAt: string;
}

export interface Student {
  id: string;
  nisn: string;
  name: string;
  className: string;
  teacherNip: string;
  teacherName: string;
  parentPhone?: string;
  totalMemorized: number; // Jumlah surah yang sudah hapal (dari 38: Al-Fatihah & 37 Surah Juz 30)
  totalInProcess: number; // Jumlah surah dalam proses
  totalRemaining: number; // Jumlah surah belum hapal
  lastUpdated: string;
  createdAt: string;
}

export type MemorizationStatus = 'belum_hapal' | 'proses_hapal' | 'sudah_hapal';

export interface SurahMeta {
  number: number;
  name: string;
  arabicName: string;
  totalAyat: number;
  meaning: string;
  type: 'Makkiyah' | 'Madaniyah';
}

export interface MemorizationRecord {
  id?: string;
  studentId: string;
  surahNumber: number;
  surahName: string;
  arabicName: string;
  totalAyat: number;
  ayatRange: string; // e.g. "Ayat 1 - 40" atau "Lengkap (1 - 40)"
  status: MemorizationStatus;
  targetDate?: string; // Tanggal target penyelesaian
  completedDate?: string; // Tanggal tuntas
  grade?: 'Mumtaz' | 'Jayyid Jiddan' | 'Jayyid' | 'Maqbul' | '';
  notes?: string;
  verifiedByNip?: string;
  verifiedByName?: string;
  updatedAt: string;
}

export interface ActivityLog {
  id: string;
  actorNip: string;
  actorName: string;
  actorRole: string;
  action: string;
  description: string;
  studentName?: string;
  surahName?: string;
  timestamp: string;
}

export type MediaCategory = 'foto' | 'video' | 'folder_drive' | 'dokumen';

export interface DocumentationRecord {
  id: string;
  title: string; // Judul kegiatan / bimbingan
  date: string; // Tanggal kegiatan (YYYY-MM-DD)
  teacherNip: string;
  teacherName: string;
  className: string; // Kelas atau kelompok bimbingan
  studentId?: string; // Opsional jika untuk siswa tertentu
  studentName?: string; // Opsional
  driveUrl: string; // Link Google Drive (foto/video/folder)
  mediaType: MediaCategory; // Jenis media
  description?: string; // Catatan / keterangan tambahan
  createdAt: string;
  updatedAt?: string;
}

export interface DatabaseBackupPayload {
  metadata: {
    app: string;
    version: string;
    exportedAt: string;
    exportedBy: string;
    school: string;
    totalTeachers: number;
    totalStudents: number;
    totalHafalanRecords: number;
    totalDocumentations?: number;
  };
  teachers: Teacher[];
  students: Student[];
  hafalan: { [studentId: string]: MemorizationRecord[] };
  documentations?: DocumentationRecord[];
  activityLogs?: ActivityLog[];
}

