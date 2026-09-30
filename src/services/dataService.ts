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
import { Teacher, Student, MemorizationRecord, ActivityLog, MemorizationStatus } from '../types';
import { INITIAL_TEACHERS, INITIAL_STUDENTS } from '../data/seedData';
import { JUZ_30_SURAHS } from '../data/juz30Data';

const TEACHERS_COL = 'teachers';
const STUDENTS_COL = 'students';
const ADMINS_COL = 'admins';
const LOGS_COL = 'activity_logs';

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
      totalRemaining: 37,
      createdAt: new Date().toISOString(),
      lastUpdated: new Date().toISOString(),
    };
    await setDoc(doc(db, STUDENTS_COL, id), newStudent);

    // Initialize all 37 surahs as belum_hapal
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

    const remaining = Math.max(0, 37 - memorized - inProcess);

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
