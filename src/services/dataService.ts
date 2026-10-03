import {
  collection,
  doc,
  setDoc,
  getDocs,
  getDoc,
  updateDoc,
  deleteDoc,
  onSnapshot,
  query,
  orderBy,
  limit,
} from 'firebase/firestore';
import * as XLSX from 'xlsx';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { Teacher, Student, MemorizationRecord, ActivityLog, MemorizationStatus, DatabaseBackupPayload, DocumentationRecord } from '../types';
import { INITIAL_TEACHERS, INITIAL_STUDENTS } from '../data/seedData';
import { JUZ_30_SURAHS } from '../data/juz30Data';

const TEACHERS_COL = 'teachers';
const STUDENTS_COL = 'students';
const ADMINS_COL = 'admins';
const LOGS_COL = 'activity_logs';
const DOCUMENTATIONS_COL = 'documentations';

// Initialize default data into Firestore if empty
export async function initializeDatabase() {
  try {
    // 1. Ensure Super Admin document exists
    const adminDocRef = doc(db, ADMINS_COL, 'superadmin');
    const adminSnap = await getDoc(adminDocRef);
    if (!adminSnap.exists()) {
      await setDoc(adminDocRef, {
        uid: 'superadmin-1',
        email: 'admin@smkn3pangkep.sch.id',
        password: 'bismillah', // configured default superadmin
        name: 'Super Admin SMKN 3 Pangkep',
        role: 'superadmin',
        createdAt: new Date().toISOString(),
      });
    }

    // 2. Ensure Admin Staf document exists (adminhapalan@smkn3pangkep.sch.id / bismilllah)
    const staffDocRef = doc(db, ADMINS_COL, 'adminhapalan');
    const staffSnap = await getDoc(staffDocRef);
    if (!staffSnap.exists()) {
      await setDoc(staffDocRef, {
        uid: 'adminstaf-1',
        email: 'adminhapalan@smkn3pangkep.sch.id',
        password: 'bismilllah',
        name: 'Admin Staf Hafalan SMKN 3 Pangkep',
        role: 'admin_staf',
        createdAt: new Date().toISOString(),
      });
    }
  } catch (error) {
    console.error('Error seeding initial data:', error);
  }
}

// ----------------- TEACHERS SERVICE -----------------

export function subscribeTeachers(callback: (teachers: Teacher[]) => void) {
  try {
    return onSnapshot(
      collection(db, TEACHERS_COL),
      (snap) => {
        const teachers: Teacher[] = [];
        snap.forEach((doc) => teachers.push({ ...(doc.data() as Teacher), id: doc.id }));
        callback(teachers);
      },
      (error) => {
        handleFirestoreError(error, OperationType.GET, TEACHERS_COL);
      }
    );
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, TEACHERS_COL);
  }
}

export async function addTeacher(teacher: Omit<Teacher, 'id' | 'createdAt'>): Promise<string> {
  const path = TEACHERS_COL;
  try {
    const id = `teacher-${Date.now()}`;
    const newTeacher: Teacher = {
      ...teacher,
      id,
      createdAt: new Date().toISOString(),
    };
    await setDoc(doc(db, TEACHERS_COL, id), newTeacher);
    await logActivity({
      actorNip: teacher.nip,
      actorName: teacher.name,
      actorRole: 'Admin',
      action: 'Tambah Guru Wali',
      description: `Menambahkan Guru Wali baru: ${teacher.name} (NIP: ${teacher.nip})`,
    });
    return id;
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function updateTeacher(id: string, data: Partial<Teacher>): Promise<void> {
  const path = `${TEACHERS_COL}/${id}`;
  try {
    await updateDoc(doc(db, TEACHERS_COL, id), {
      ...data,
      updatedAt: new Date().toISOString(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

export async function updateTeacherPassword(id: string, newPass: string, teacherName: string): Promise<void> {
  const path = `${TEACHERS_COL}/${id}`;
  try {
    await updateDoc(doc(db, TEACHERS_COL, id), {
      password: newPass,
      updatedAt: new Date().toISOString(),
    });
    await logActivity({
      actorNip: 'superadmin',
      actorName: 'Super Admin',
      actorRole: 'Admin',
      action: 'Ubah Kata Sandi Guru',
      description: `Memperbarui kata sandi untuk Guru Wali: ${teacherName}`,
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

export async function deleteTeacher(
  id: string,
  teacherName?: string,
  deleteAssignedStudents: boolean = false,
  teacherNip?: string
): Promise<void> {
  const path = `${TEACHERS_COL}/${id}`;
  try {
    // Delete the teacher doc
    await deleteDoc(doc(db, TEACHERS_COL, id));

    // If option selected and NIP provided, delete their assigned students too
    if (deleteAssignedStudents && teacherNip) {
      try {
        const studentSnap = await getDocs(collection(db, STUDENTS_COL));
        for (const sDoc of studentSnap.docs) {
          const sData = sDoc.data() as Student;
          if (sData.teacherNip === teacherNip) {
            await deleteStudent(sDoc.id);
          }
        }
      } catch (e) {
        console.warn('Error deleting assigned students of teacher:', e);
      }
    }

    await logActivity({
      actorNip: 'superadmin',
      actorName: 'Super Admin',
      actorRole: 'Admin',
      action: 'Hapus Guru Wali',
      description: `Menghapus akun Guru Wali: ${teacherName || id} (NIP: ${teacherNip || id})`,
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

// Purge all dummy data for teachers and students from Firestore
export async function clearAllDummyData(): Promise<{ deletedTeachers: number; deletedStudents: number }> {
  let deletedTeachers = 0;
  let deletedStudents = 0;

  try {
    // 1. Delete all students and their hafalan subcollections
    const studentSnap = await getDocs(collection(db, STUDENTS_COL));
    for (const sDoc of studentSnap.docs) {
      try {
        const hafalanSnap = await getDocs(collection(db, STUDENTS_COL, sDoc.id, 'hafalan'));
        for (const h of hafalanSnap.docs) {
          await deleteDoc(doc(db, STUDENTS_COL, sDoc.id, 'hafalan', h.id));
        }
      } catch (e) {
        // ignore subcollection err
      }
      await deleteDoc(doc(db, STUDENTS_COL, sDoc.id));
      deletedStudents++;
    }

    // 2. Delete all teachers
    const teacherSnap = await getDocs(collection(db, TEACHERS_COL));
    for (const tDoc of teacherSnap.docs) {
      await deleteDoc(doc(db, TEACHERS_COL, tDoc.id));
      deletedTeachers++;
    }

    await logActivity({
      actorNip: 'superadmin',
      actorName: 'Super Admin',
      actorRole: 'Admin',
      action: 'Bersihkan Data Dummy',
      description: `Menghapus ${deletedTeachers} guru dan ${deletedStudents} siswa dummy dari sistem.`,
    });

    return { deletedTeachers, deletedStudents };
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, STUDENTS_COL);
  }
}

// ----------------- STUDENTS SERVICE -----------------

export function subscribeStudents(callback: (students: Student[]) => void, teacherNip?: string) {
  try {
    return onSnapshot(
      collection(db, STUDENTS_COL),
      (snap) => {
        const list: Student[] = [];
        snap.forEach((doc) => {
          const item = { ...(doc.data() as Student), id: doc.id };
          // If teacherNip is provided, enforce segregation: teacher only sees their assigned students!
          if (!teacherNip || item.teacherNip === teacherNip) {
            list.push(item);
          }
        });
        callback(list);
      },
      (error) => {
        handleFirestoreError(error, OperationType.GET, STUDENTS_COL);
      }
    );
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, STUDENTS_COL);
  }
}

export async function addStudent(studentData: Omit<Student, 'id' | 'createdAt' | 'lastUpdated' | 'totalMemorized' | 'totalInProcess' | 'totalRemaining'>): Promise<string> {
  const path = STUDENTS_COL;
  try {
    const id = `student-${Date.now()}`;
    const newStudent: Student = {
      ...studentData,
      id,
      totalMemorized: 0,
      totalInProcess: 0,
      totalRemaining: JUZ_30_SURAHS.length,
      createdAt: new Date().toISOString(),
      lastUpdated: new Date().toISOString(),
    };
    await setDoc(doc(db, STUDENTS_COL, id), newStudent);

    // Initialize all surahs (Al-Fatihah + Juz 30) as belum_hapal
    for (const surah of JUZ_30_SURAHS) {
      const hafalanRef = doc(db, STUDENTS_COL, id, 'hafalan', surah.number.toString());
      const record: MemorizationRecord = {
        studentId: id,
        surahNumber: surah.number,
        surahName: surah.name,
        arabicName: surah.arabicName,
        totalAyat: surah.totalAyat,
        ayatRange: `1 - ${surah.totalAyat}`,
        status: 'belum_hapal',
        updatedAt: new Date().toISOString(),
      };
      await setDoc(hafalanRef, record);
    }

    await logActivity({
      actorNip: studentData.teacherNip,
      actorName: studentData.teacherName,
      actorRole: 'Guru Wali',
      action: 'Tambah Siswa',
      studentName: studentData.name,
      description: `Mendaftarkan siswa baru: ${studentData.name} (${studentData.className})`,
    });

    return id;
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function updateStudent(
  id: string,
  data: Partial<Student>,
  actorInfo?: { name: string; nip: string }
): Promise<void> {
  const path = `${STUDENTS_COL}/${id}`;
  try {
    await updateDoc(doc(db, STUDENTS_COL, id), {
      ...data,
      lastUpdated: new Date().toISOString(),
    });
    if (actorInfo && data.name) {
      await logActivity({
        actorNip: actorInfo.nip,
        actorName: actorInfo.name,
        actorRole: 'Guru Wali',
        action: 'Ubah Data Siswa',
        studentName: data.name,
        description: `Memperbarui data siswa: ${data.name} (NIS/NISN: ${data.nisn}, Kelas: ${data.className})`,
      });
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

export async function deleteStudent(
  id: string,
  actorInfo?: { name: string; nip: string; studentName?: string }
): Promise<void> {
  const path = `${STUDENTS_COL}/${id}`;
  try {
    // Delete hafalan subcollection records
    try {
      const hafalanSnap = await getDocs(collection(db, STUDENTS_COL, id, 'hafalan'));
      for (const h of hafalanSnap.docs) {
        await deleteDoc(doc(db, STUDENTS_COL, id, 'hafalan', h.id));
      }
    } catch (e) {
      console.warn('Subcollection cleanup warning:', e);
    }

    await deleteDoc(doc(db, STUDENTS_COL, id));
    if (actorInfo) {
      await logActivity({
        actorNip: actorInfo.nip,
        actorName: actorInfo.name,
        actorRole: 'Guru Wali',
        action: 'Hapus Siswa',
        studentName: actorInfo.studentName,
        description: `Menghapus data bimbingan siswa: ${actorInfo.studentName || id}`,
      });
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

// ----------------- HAFALAN DETAIL SERVICE -----------------

export function subscribeStudentHafalan(
  studentId: string,
  callback: (records: MemorizationRecord[]) => void
) {
  const path = `${STUDENTS_COL}/${studentId}/hafalan`;
  try {
    return onSnapshot(
      collection(db, STUDENTS_COL, studentId, 'hafalan'),
      (snap) => {
        const recordsMap = new Map<number, MemorizationRecord>();
        snap.forEach((doc) => {
          const rec = doc.data() as MemorizationRecord;
          recordsMap.set(rec.surahNumber, rec);
        });

        // Ensure all 37 surahs of Juz 30 are always present and ordered
        const fullList: MemorizationRecord[] = JUZ_30_SURAHS.map((surah) => {
          if (recordsMap.has(surah.number)) {
            return recordsMap.get(surah.number)!;
          }
          return {
            studentId,
            surahNumber: surah.number,
            surahName: surah.name,
            arabicName: surah.arabicName,
            totalAyat: surah.totalAyat,
            ayatRange: `1 - ${surah.totalAyat}`,
            status: 'belum_hapal',
            updatedAt: new Date().toISOString(),
          };
        });

        callback(fullList);
      },
      (error) => {
        handleFirestoreError(error, OperationType.GET, path);
      }
    );
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, path);
  }
}

export async function updateHafalanRecord(
  studentId: string,
  surahNumber: number,
  recordData: Partial<MemorizationRecord>,
  actorInfo: { name: string; nip: string; role: string; studentName: string }
): Promise<void> {
  const path = `${STUDENTS_COL}/${studentId}/hafalan/${surahNumber}`;
  try {
    const surahMeta = JUZ_30_SURAHS.find((s) => s.number === surahNumber);
    const docRef = doc(db, STUDENTS_COL, studentId, 'hafalan', surahNumber.toString());

    await setDoc(
      docRef,
      {
        ...recordData,
        studentId,
        surahNumber,
        surahName: surahMeta?.name || '',
        arabicName: surahMeta?.arabicName || '',
        totalAyat: surahMeta?.totalAyat || 0,
        verifiedByName: actorInfo.name,
        verifiedByNip: actorInfo.nip,
        updatedAt: new Date().toISOString(),
      },
      { merge: true }
    );

    // Recalculate student aggregates
    const hafalanSnap = await getDocs(collection(db, STUDENTS_COL, studentId, 'hafalan'));
    let memorized = 0;
    let inProcess = 0;
    hafalanSnap.forEach((doc) => {
      const data = doc.data() as MemorizationRecord;
      if (data.status === 'sudah_hapal') memorized++;
      else if (data.status === 'proses_hapal') inProcess++;
    });

    const remaining = Math.max(0, JUZ_30_SURAHS.length - memorized - inProcess);

    await updateDoc(doc(db, STUDENTS_COL, studentId), {
      totalMemorized: memorized,
      totalInProcess: inProcess,
      totalRemaining: remaining,
      lastUpdated: new Date().toISOString(),
    });

    // Log this activity
    const statusLabel =
      recordData.status === 'sudah_hapal'
        ? 'Sudah Hapal (Tuntas)'
        : recordData.status === 'proses_hapal'
        ? 'Proses Hapal'
        : 'Belum Hapal';

    await logActivity({
      actorNip: actorInfo.nip,
      actorName: actorInfo.name,
      actorRole: actorInfo.role,
      action: 'Update Hafalan',
      studentName: actorInfo.studentName,
      surahName: surahMeta?.name,
      description: `Memperbarui surah ${surahMeta?.name} menjadi [${statusLabel}] untuk ananda ${actorInfo.studentName}`,
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

// ----------------- ACTIVITY LOGS -----------------

export async function logActivity(log: Omit<ActivityLog, 'id' | 'timestamp'>) {
  try {
    const id = `log-${Date.now()}`;
    await setDoc(doc(db, LOGS_COL, id), {
      ...log,
      id,
      timestamp: new Date().toISOString(),
    });
  } catch (e) {
    console.error('Failed to log activity:', e);
  }
}

export function subscribeActivityLogs(callback: (logs: ActivityLog[]) => void, maxCount = 25) {
  const path = LOGS_COL;
  try {
    const q = query(collection(db, LOGS_COL), orderBy('timestamp', 'desc'), limit(maxCount));
    return onSnapshot(
      q,
      (snap) => {
        const logs: ActivityLog[] = [];
        snap.forEach((doc) => logs.push({ ...(doc.data() as ActivityLog), id: doc.id }));
        callback(logs);
      },
      (error) => {
        // Fallback without ordering index if needed
        onSnapshot(
          collection(db, LOGS_COL),
          (snapshot) => {
            const list: ActivityLog[] = [];
            snapshot.forEach((d) => list.push({ ...(d.data() as ActivityLog), id: d.id }));
            list.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
            callback(list.slice(0, maxCount));
          },
          (err) => handleFirestoreError(err, OperationType.GET, path)
        );
      }
    );
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, path);
  }
}

// ----------------- EXCEL TEMPLATE & IMPORT -----------------

export function downloadExcelTemplate() {
  const sampleData = [
    {
      'Nama Guru': 'Drs. H. Muhammad Yunus, M.Pd',
      NIP: '198205142008011005',
      'Nama Siswa': 'Muhammad Fadil Akbar',
      NISN: '0078899112',
      Kelas: 'X DPIB 1',
    },
    {
      'Nama Guru': 'Drs. H. Muhammad Yunus, M.Pd',
      NIP: '198205142008011005',
      'Nama Siswa': 'Siti Nur Azizah',
      NISN: '0078899113',
      Kelas: 'X TITL 1',
    },
    {
      'Nama Guru': 'Nurul Aini, S.Pd.I',
      NIP: '198904222015022003',
      'Nama Siswa': 'Wahyu Ramadhan',
      NISN: '0078899114',
      Kelas: 'X TJKT 1',
    },
  ];

  const ws = XLSX.utils.json_to_sheet(sampleData);
  // Set column widths for nice appearance
  ws['!cols'] = [
    { wch: 32 }, // Nama Guru
    { wch: 22 }, // NIP
    { wch: 28 }, // Nama Siswa
    { wch: 16 }, // NISN
    { wch: 14 }, // Kelas
  ];

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Data Bimbingan Tahfidz');

  // Trigger download
  XLSX.writeFile(wb, 'Template_Bimbingan_Hafalan_SMKN3_Pangkep.xlsx');
}

export function downloadTeacherExcelTemplate() {
  const sampleData = [
    {
      'Nama Guru Wali': 'Drs. H. Muhammad Yunus, M.Pd',
      'NIP (Username)': '198205142008011005',
      'Kelas Bimbingan': 'X DPIB 1, XI DPIB 1',
      'Kata Sandi Saat Ini': 'bismillah',
    },
    {
      'Nama Guru Wali': 'Nurul Aini, S.Pd.I',
      'NIP (Username)': '198904222015022003',
      'Kelas Bimbingan': 'X TITL 1',
      'Kata Sandi Saat Ini': 'bismillah',
    },
    {
      'Nama Guru Wali': 'Ahmad Fauzi, S.T',
      'NIP (Username)': '198701102011011002',
      'Kelas Bimbingan': 'X TJKT 1',
      'Kata Sandi Saat Ini': 'bismillah',
    },
  ];

  const ws = XLSX.utils.json_to_sheet(sampleData);
  ws['!cols'] = [
    { wch: 32 }, // Nama Guru Wali
    { wch: 24 }, // NIP (Username)
    { wch: 26 }, // Kelas Bimbingan
    { wch: 22 }, // Kata Sandi Saat Ini
  ];

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Format Akun Guru');
  XLSX.writeFile(wb, 'Format_Import_Akun_Guru_Wali_SMKN3_Pangkep.xlsx');
}

export async function processTeacherExcelUpload(
  file: File
): Promise<{ added: number; updated: number; total: number; errors: string[] }> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        const rawJson: any[] = XLSX.utils.sheet_to_json(worksheet, { raw: false });

        let addedCount = 0;
        let updatedCount = 0;
        const errors: string[] = [];

        // Fetch existing teachers to detect updates vs new
        const existingSnap = await getDocs(collection(db, TEACHERS_COL));
        const existingByNip = new Map<string, { id: string; docData: Teacher }>();
        existingSnap.forEach((d) => {
          const t = d.data() as Teacher;
          if (t.nip) existingByNip.set(t.nip.trim(), { id: d.id, docData: t });
        });

        for (let i = 0; i < rawJson.length; i++) {
          const row = rawJson[i];
          const rowNum = i + 2;

          // Support exact required headers or common variations
          const rawName =
            row['Nama Guru Wali'] ??
            row['Nama Guru'] ??
            row['nama guru wali'] ??
            row['Nama'] ??
            row['Guru'];
          const rawNip =
            row['NIP (Username)'] ??
            row['NIP'] ??
            row['Username'] ??
            row['nip'] ??
            row['username'];
          const rawClasses =
            row['Kelas Bimbingan'] ??
            row['Kelas'] ??
            row['kelas bimbingan'] ??
            row['Rombel'];
          const rawPassword =
            row['Kata Sandi Saat Ini'] ??
            row['Kata Sandi'] ??
            row['Password'] ??
            row['kata sandi saat ini'] ??
            row['password'];

          const name = String(rawName || '').trim();
          const nip = String(rawNip || '').trim();
          const classes = String(rawClasses || '').trim();
          // User requirement: "semua akun guru paswordnya bismillah"
          const password = String(rawPassword || '').trim() || 'bismillah';

          if (!name || !nip) {
            errors.push(`Baris ${rowNum}: Nama Guru Wali dan NIP (Username) tidak boleh kosong.`);
            continue;
          }

          const existing = existingByNip.get(nip);
          if (existing) {
            // Update existing teacher record
            await updateDoc(doc(db, TEACHERS_COL, existing.id), {
              name,
              classes: classes || existing.docData.classes || '',
              password: password || 'bismillah',
              updatedAt: new Date().toISOString(),
            });
            updatedCount++;
          } else {
            // Add new teacher
            const newId = `teacher-${nip || Date.now()}`;
            const newTeacher: Teacher = {
              id: newId,
              nip,
              name,
              classes: classes || '-',
              password: password || 'bismillah',
              email: `${nip}@smkn3pangkep.sch.id`,
              phone: '-',
              isActive: true,
              createdAt: new Date().toISOString(),
            };
            await setDoc(doc(db, TEACHERS_COL, newId), newTeacher);
            existingByNip.set(nip, { id: newId, docData: newTeacher });
            addedCount++;
          }
        }

        await logActivity({
          actorNip: 'superadmin',
          actorName: 'Admin',
          actorRole: 'Admin',
          action: 'Import Akun Guru Wali',
          description: `Import Excel Akun Guru: ${addedCount} guru baru ditambahkan, ${updatedCount} akun diperbarui dengan kata sandi default "bismillah" (File: ${file.name})`,
        });

        resolve({
          added: addedCount,
          updated: updatedCount,
          total: addedCount + updatedCount,
          errors,
        });
      } catch (err: any) {
        reject(new Error(err.message || 'Gagal memproses file Excel guru.'));
      }
    };
    reader.onerror = () => reject(new Error('Gagal membaca file'));
    reader.readAsArrayBuffer(file);
  });
}

export async function processExcelUpload(
  file: File,
  currentActor: { nip: string; name: string; role: string }
): Promise<{ added: number; errors: string[] }> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        const rawJson: any[] = XLSX.utils.sheet_to_json(worksheet);

        let addedCount = 0;
        const errors: string[] = [];

        for (let i = 0; i < rawJson.length; i++) {
          const row = rawJson[i];
          const rowNum = i + 2;

          const namaSiswa = String(row['Nama Siswa'] || row['nama_siswa'] || '').trim();
          const nisn = String(row['NISN'] || row['nisn'] || '').trim();
          const kelas = String(row['Kelas'] || row['kelas'] || '').trim();
          let namaGuru = String(row['Nama Guru'] || row['nama_guru'] || '').trim();
          let nip = String(row['NIP'] || row['nip'] || '').trim();

          if (!namaSiswa || !nisn || !kelas) {
            errors.push(`Baris ${rowNum}: Nama Siswa, NISN, dan Kelas wajib diisi.`);
            continue;
          }

          // If current actor is Guru Wali, ensure it matches their NIP/name
          if (currentActor.role === 'guru_wali') {
            nip = currentActor.nip;
            namaGuru = currentActor.name;
          } else if (!nip || !namaGuru) {
            nip = currentActor.nip || '198205142008011005';
            namaGuru = currentActor.name || 'Guru Wali SMKN 3 Pangkep';
          }

          await addStudent({
            nisn,
            name: namaSiswa,
            className: kelas,
            teacherNip: nip,
            teacherName: namaGuru,
          });
          addedCount++;
        }

        await logActivity({
          actorNip: currentActor.nip,
          actorName: currentActor.name,
          actorRole: currentActor.role === 'superadmin' ? 'Super Admin' : 'Guru Wali',
          action: 'Import Data Excel',
          description: `Berhasil mengimpor ${addedCount} data siswa bimbingan dari file ${file.name}`,
        });

        resolve({ added: addedCount, errors });
      } catch (err: any) {
        reject(new Error(err.message || 'Gagal memproses file Excel.'));
      }
    };
    reader.onerror = () => reject(new Error('Gagal membaca file'));
    reader.readAsArrayBuffer(file);
  });
}

// ----------------- DOKUMENTASI HAFALAN SERVICE -----------------

// Helper to strip undefined values so Firestore setDoc/updateDoc never errors
function cleanUndefined<T extends Record<string, any>>(obj: T): T {
  const result: any = {};
  for (const [key, value] of Object.entries(obj)) {
    if (value !== undefined) {
      result[key] = value;
    }
  }
  return result;
}

export function subscribeDocumentations(
  callback: (docs: DocumentationRecord[]) => void
) {
  try {
    return onSnapshot(
      collection(db, DOCUMENTATIONS_COL),
      (snap) => {
        const list: DocumentationRecord[] = [];
        snap.forEach((d) => {
          list.push({ ...(d.data() as DocumentationRecord), id: d.id });
        });
        // Sort descending by date, then by createdAt
        list.sort((a, b) => {
          const dateA = a.date || a.createdAt;
          const dateB = b.date || b.createdAt;
          return dateB.localeCompare(dateA);
        });
        callback(list);
      },
      (error) => {
        handleFirestoreError(error, OperationType.GET, DOCUMENTATIONS_COL);
      }
    );
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, DOCUMENTATIONS_COL);
  }
}

export async function addDocumentation(
  docData: Omit<DocumentationRecord, 'id' | 'createdAt'>,
  actor: { nip: string; name: string; role: string }
): Promise<string> {
  const path = DOCUMENTATIONS_COL;
  try {
    const id = `doc-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    const newDoc = cleanUndefined({
      ...docData,
      id,
      createdAt: new Date().toISOString(),
    });
    await setDoc(doc(db, DOCUMENTATIONS_COL, id), newDoc);

    await logActivity({
      actorNip: actor.nip,
      actorName: actor.name,
      actorRole: actor.role === 'superadmin' ? 'Super Admin' : 'Guru Wali',
      action: 'Upload Dokumentasi',
      description: `Menambahkan dokumentasi bukti monitoring hafalan: "${docData.title}" (${docData.className}${docData.studentName ? ` - ${docData.studentName}` : ''})`,
    });

    return id;
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
    throw error;
  }
}

export async function updateDocumentation(
  id: string,
  docData: Partial<DocumentationRecord>,
  actor: { nip: string; name: string; role: string }
): Promise<void> {
  const path = `${DOCUMENTATIONS_COL}/${id}`;
  try {
    const cleaned = cleanUndefined({
      ...docData,
      updatedAt: new Date().toISOString(),
    });
    await updateDoc(doc(db, DOCUMENTATIONS_COL, id), cleaned);

    await logActivity({
      actorNip: actor.nip,
      actorName: actor.name,
      actorRole: actor.role === 'superadmin' ? 'Super Admin' : 'Guru Wali',
      action: 'Update Dokumentasi',
      description: `Memperbarui dokumentasi bukti monitoring: "${docData.title || id}"`,
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
    throw error;
  }
}

export async function deleteDocumentation(
  id: string,
  title: string,
  actor: { nip: string; name: string; role: string }
): Promise<void> {
  const path = `${DOCUMENTATIONS_COL}/${id}`;
  try {
    await deleteDoc(doc(db, DOCUMENTATIONS_COL, id));

    await logActivity({
      actorNip: actor.nip,
      actorName: actor.name,
      actorRole: actor.role === 'superadmin' ? 'Super Admin' : 'Guru Wali',
      action: 'Hapus Dokumentasi',
      description: `Menghapus dokumentasi bukti monitoring: "${title}"`,
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
    throw error;
  }
}

// ----------------- DATABASE BACKUP & RESTORE SERVICE -----------------

/**
 * Buat file cadangan (backup) lengkap seluruh koleksi database Firestore
 */
export async function createDatabaseBackup(actorInfo?: { name: string; nip: string }): Promise<DatabaseBackupPayload> {
  try {
    // 1. Fetch all teachers
    const teachersSnap = await getDocs(collection(db, TEACHERS_COL));
    const teachers: Teacher[] = [];
    teachersSnap.forEach((d) => teachers.push({ ...(d.data() as Teacher), id: d.id }));

    // 2. Fetch all students & their hafalan records
    const studentsSnap = await getDocs(collection(db, STUDENTS_COL));
    const students: Student[] = [];
    const hafalanMap: { [studentId: string]: MemorizationRecord[] } = {};
    let totalHafalanRecords = 0;

    for (const studentDoc of studentsSnap.docs) {
      const studentData = { ...(studentDoc.data() as Student), id: studentDoc.id };
      students.push(studentData);

      // Fetch hafalan subcollection for each student
      const hafalanSnap = await getDocs(collection(db, STUDENTS_COL, studentDoc.id, 'hafalan'));
      const records: MemorizationRecord[] = [];
      hafalanSnap.forEach((hDoc) => {
        records.push(hDoc.data() as MemorizationRecord);
      });
      hafalanMap[studentDoc.id] = records;
      totalHafalanRecords += records.length;
    }

    // 3. Fetch all documentations
    const docsSnap = await getDocs(collection(db, DOCUMENTATIONS_COL));
    const documentations: DocumentationRecord[] = [];
    docsSnap.forEach((dDoc) => documentations.push({ ...(dDoc.data() as DocumentationRecord), id: dDoc.id }));

    // 4. Fetch activity logs
    const logsSnap = await getDocs(query(collection(db, LOGS_COL), orderBy('timestamp', 'desc'), limit(500)));
    const activityLogs: ActivityLog[] = [];
    logsSnap.forEach((lDoc) => activityLogs.push({ ...(lDoc.data() as ActivityLog), id: lDoc.id }));

    const now = new Date();
    const backupPayload: DatabaseBackupPayload = {
      metadata: {
        app: 'Tahfidz-SMKN3Pangkep',
        version: '1.0',
        exportedAt: now.toISOString(),
        exportedBy: actorInfo?.name || 'Super Admin',
        school: 'SMK Negeri 3 Pangkep',
        totalTeachers: teachers.length,
        totalStudents: students.length,
        totalHafalanRecords,
        totalDocumentations: documentations.length,
      },
      teachers,
      students,
      hafalan: hafalanMap,
      documentations,
      activityLogs,
    };

    // Trigger browser download of JSON file
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(backupPayload, null, 2));
    const downloadAnchor = document.createElement('a');
    const timestampStr = now.toISOString().replace(/[:.]/g, '-').slice(0, 19);
    const fileName = `Backup_Database_Tahfidz_SMKN3Pangkep_${timestampStr}.json`;
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', fileName);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();

    await logActivity({
      actorNip: actorInfo?.nip || 'admin',
      actorName: actorInfo?.name || 'Super Admin',
      actorRole: 'Super Admin',
      action: 'Backup Database',
      description: `Berhasil mencadangkan database (${teachers.length} guru, ${students.length} siswa, ${totalHafalanRecords} catatan hafalan, ${documentations.length} dokumentasi)`,
    });

    return backupPayload;
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, 'backup');
    throw error;
  }
}

/**
 * Pulihkan database Firestore dari file cadangan JSON
 */
export async function restoreDatabaseBackup(
  payload: DatabaseBackupPayload,
  mode: 'replace' | 'merge',
  onProgress?: (message: string, percent: number) => void,
  actorInfo?: { name: string; nip: string }
): Promise<{ success: boolean; teacherCount: number; studentCount: number; hafalanCount: number }> {
  try {
    if (!payload || !payload.metadata || !Array.isArray(payload.teachers) || !Array.isArray(payload.students)) {
      throw new Error('Format file backup tidak valid atau rusak.');
    }

    onProgress?.('Mempersiapkan pemulihan database...', 10);

    // If replace mode, clear current teachers, students, & documentations first
    if (mode === 'replace') {
      onProgress?.('Membersihkan data database saat ini...', 20);
      await clearAllDummyData();
      // Also clear documentations
      const currentDocs = await getDocs(collection(db, DOCUMENTATIONS_COL));
      for (const d of currentDocs.docs) {
        await deleteDoc(d.ref);
      }
    }

    // 1. Restore Teachers
    onProgress?.('Memulihkan data Guru Wali...', 30);
    let teacherCount = 0;
    for (const teacher of payload.teachers) {
      const teacherId = teacher.id || `teacher-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`;
      await setDoc(doc(db, TEACHERS_COL, teacherId), {
        ...teacher,
        id: teacherId,
        updatedAt: new Date().toISOString(),
      });
      teacherCount++;
    }

    // 2. Restore Students & Hafalan
    onProgress?.('Memulihkan data Siswa...', 50);
    let studentCount = 0;
    let hafalanCount = 0;

    const totalStudentsToRestore = payload.students.length;
    for (let i = 0; i < totalStudentsToRestore; i++) {
      const student = payload.students[i];
      const studentId = student.id || `student-${Date.now()}-${i}`;

      await setDoc(doc(db, STUDENTS_COL, studentId), {
        ...student,
        id: studentId,
        lastUpdated: new Date().toISOString(),
      });
      studentCount++;

      // Restore student hafalan records if present in backup
      const studentRecords = payload.hafalan ? payload.hafalan[student.id || studentId] : undefined;
      if (Array.isArray(studentRecords) && studentRecords.length > 0) {
        for (const record of studentRecords) {
          const surahNum = record.surahNumber.toString();
          await setDoc(doc(db, STUDENTS_COL, studentId, 'hafalan', surahNum), {
            ...record,
            studentId,
            updatedAt: record.updatedAt || new Date().toISOString(),
          });
          hafalanCount++;
        }
      } else {
        // If not in backup, initialize standard surahs for this student
        for (const surah of JUZ_30_SURAHS) {
          const hafalanRef = doc(db, STUDENTS_COL, studentId, 'hafalan', surah.number.toString());
          await setDoc(hafalanRef, {
            studentId,
            surahNumber: surah.number,
            surahName: surah.name,
            arabicName: surah.arabicName,
            totalAyat: surah.totalAyat,
            ayatRange: `1 - ${surah.totalAyat}`,
            status: 'belum_hapal',
            updatedAt: new Date().toISOString(),
          });
          hafalanCount++;
        }
      }

      const progressPct = 50 + Math.round(((i + 1) / Math.max(1, totalStudentsToRestore)) * 30);
      onProgress?.(`Memulihkan data siswa (${i + 1}/${totalStudentsToRestore})...`, progressPct);
    }

    // 3. Restore Documentations if any
    if (Array.isArray(payload.documentations)) {
      onProgress?.('Memulihkan data Dokumentasi Hafalan...', 85);
      for (const d of payload.documentations) {
        const docId = d.id || `doc-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`;
        await setDoc(doc(db, DOCUMENTATIONS_COL, docId), {
          ...d,
          id: docId,
        });
      }
    }

    // 4. Restore Activity Logs if any
    if (Array.isArray(payload.activityLogs)) {
      for (const log of payload.activityLogs.slice(0, 100)) {
        const logId = log.id || `log-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`;
        await setDoc(doc(db, LOGS_COL, logId), log);
      }
    }

    onProgress?.('Menyelesaikan verifikasi integritas...', 95);

    await logActivity({
      actorNip: actorInfo?.nip || 'admin',
      actorName: actorInfo?.name || 'Super Admin',
      actorRole: 'Super Admin',
      action: 'Restore Database',
      description: `Berhasil memulihkan database [Mode: ${mode === 'replace' ? 'Timpa Penuh' : 'Gabung'}] (${teacherCount} guru, ${studentCount} siswa, ${hafalanCount} catatan hafalan)`,
    });

    onProgress?.('Pemulihan database selesai dengan sukses!', 100);

    return {
      success: true,
      teacherCount,
      studentCount,
      hafalanCount,
    };
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, 'restore');
    throw error;
  }
}


