import React, { createContext, useContext, useState, useEffect } from 'react';
import { collection, query, where, getDocs, doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { UserSession } from '../types';
import { initializeDatabase } from '../services/dataService';

interface AuthContextType {
  user: UserSession | null;
  loading: boolean;
  loginAsAdmin: (email: string, pass: string) => Promise<{ success: boolean; message?: string }>;
  loginAsGuru: (nip: string, pass: string) => Promise<{ success: boolean; message?: string }>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const STORAGE_KEY = 'smkn3_tahfidz_session';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserSession | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    // Initialize database once on app start
    initializeDatabase().catch(console.error);

    // Restore saved session from localStorage
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        setUser(JSON.parse(saved));
      }
    } catch (e) {
      console.error('Failed to load session:', e);
    } finally {
      setLoading(false);
    }
  }, []);

  const loginAsAdmin = async (email: string, pass: string): Promise<{ success: boolean; message?: string }> => {
    setLoading(true);
    try {
      const cleanEmail = email.trim().toLowerCase();
      const cleanPass = pass.trim();

      // Check configured admin credentials (supports admin@smkn3pangkep.sch.id, superadmin, admin with bismillah or admin123)
      const isAdminUsernameMatch =
        cleanEmail === 'admin@smkn3pangkep.sch.id' ||
        cleanEmail === 'superadmin' ||
        cleanEmail === 'admin';
      const isAdminPasswordMatch =
        cleanPass === 'bismillah' || cleanPass === 'admin123';

      if (isAdminUsernameMatch && isAdminPasswordMatch) {
        const session: UserSession = {
          uid: 'superadmin-1',
          email: 'admin@smkn3pangkep.sch.id',
          name: 'Super Admin SMKN 3 Pangkep',
          role: 'superadmin',
        };
        setUser(session);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
        setLoading(false);
        return { success: true };
      }

      // Check Admin Staf credentials (adminhapalan@smkn3pangkep.sch.id / password: bismilllah or bismillah)
      const isStaffUsernameMatch =
        cleanEmail === 'adminhapalan@smkn3pangkep.sch.id' ||
        cleanEmail === 'adminhapalan';
      const isStaffPasswordMatch =
        cleanPass === 'bismilllah' || cleanPass === 'bismillah';

      if (isStaffUsernameMatch && isStaffPasswordMatch) {
        const session: UserSession = {
          uid: 'adminstaf-1',
          email: 'adminhapalan@smkn3pangkep.sch.id',
          name: 'Admin Staf Hafalan SMKN 3 Pangkep',
          role: 'admin_staf',
        };
        setUser(session);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
        setLoading(false);
        return { success: true };
      }

      // Check Firestore admins collection if custom admin was added
      const staffDoc = await getDoc(doc(db, 'admins', 'adminhapalan'));
      if (staffDoc.exists()) {
        const data = staffDoc.data();
        if (
          (data.email?.toLowerCase() === cleanEmail || cleanEmail === 'adminhapalan') &&
          (data.password === cleanPass || cleanPass === 'bismilllah' || cleanPass === 'bismillah')
        ) {
          const session: UserSession = {
            uid: data.uid || 'adminstaf-1',
            email: data.email || 'adminhapalan@smkn3pangkep.sch.id',
            name: data.name || 'Admin Staf Hafalan SMKN 3 Pangkep',
            role: 'admin_staf',
          };
          setUser(session);
          localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
          setLoading(false);
          return { success: true };
        }
      }

      const adminDoc = await getDoc(doc(db, 'admins', 'superadmin'));
      if (adminDoc.exists()) {
        const data = adminDoc.data();
        if (data.email?.toLowerCase() === cleanEmail && data.password === cleanPass) {
          const session: UserSession = {
            uid: data.uid || 'superadmin-1',
            email: data.email,
            name: data.name || 'Super Admin SMKN 3 Pangkep',
            role: 'superadmin',
          };
          setUser(session);
          localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
          setLoading(false);
          return { success: true };
        }
      }

      setLoading(false);
      return { success: false, message: 'Email atau kata sandi Admin/Staf salah.' };
    } catch (error: any) {
      setLoading(false);
      return { success: false, message: error.message || 'Terjadi kesalahan saat verifikasi admin.' };
    }
  };

  const loginAsGuru = async (nip: string, pass: string): Promise<{ success: boolean; message?: string }> => {
    setLoading(true);
    try {
      const cleanNip = nip.trim();
      const strippedNip = cleanNip.replace(/[\s\.\-]/g, '');
      const cleanPass = pass.trim();

      if (!cleanNip || !cleanPass) {
        setLoading(false);
        return { success: false, message: 'NIP dan Kata Sandi wajib diisi.' };
      }

      let matchedDoc: any = null;
      let matchedDocId: string = '';

      // 1. Query by exact NIP
      const q = query(collection(db, 'teachers'), where('nip', '==', cleanNip));
      const querySnap = await getDocs(q);

      if (!querySnap.empty) {
        matchedDoc = querySnap.docs[0].data();
        matchedDocId = querySnap.docs[0].id;
      } else if (strippedNip !== cleanNip) {
        // Query by stripped NIP (no spaces or dashes)
        const qStrip = query(collection(db, 'teachers'), where('nip', '==', strippedNip));
        const snapStrip = await getDocs(qStrip);
        if (!snapStrip.empty) {
          matchedDoc = snapStrip.docs[0].data();
          matchedDocId = snapStrip.docs[0].id;
        }
      }

      // 2. If not found in query, search memory across all teacher docs
      if (!matchedDoc) {
        const allSnap = await getDocs(collection(db, 'teachers'));
        const found = allSnap.docs.find((d) => {
          const data = d.data();
          const docNip = String(data.nip || '').trim();
          const docNipStrip = docNip.replace(/[\s\.\-]/g, '');
          return (
            docNip === cleanNip ||
            docNipStrip === strippedNip ||
            docNipStrip.includes(strippedNip) ||
            strippedNip.includes(docNipStrip) ||
            (data.name && data.name.toLowerCase() === cleanNip.toLowerCase())
          );
        });

        if (found) {
          matchedDoc = found.data();
          matchedDocId = found.id;
        }
      }

      // 3. Fallback: Auto-create/restore EMIL AIDIN, S.Pd (NIP: 199005252023211010)
      if (
        !matchedDoc &&
        (strippedNip === '199005252023211010' ||
          cleanNip === '199005252023211010' ||
          cleanNip.toLowerCase().includes('emil aidin'))
      ) {
        const emilDocId = 'teacher-199005252023211010';
        const emilData = {
          id: emilDocId,
          nip: '199005252023211010',
          name: 'EMIL AIDIN, S.Pd',
          classes: 'Guru Wali',
          role: 'guru_wali',
          email: '199005252023211010@smkn3pangkep.sch.id',
          phone: '-',
          password: 'bismillah',
          isActive: true,
          totalMemorized: 0,
          totalInProcess: 0,
          totalRemaining: 38,
          createdAt: new Date().toISOString(),
        };
        try {
          await setDoc(doc(db, 'teachers', emilDocId), emilData);
        } catch (e) {
          console.error('Error persisting Emil Aidin record:', e);
        }
        matchedDoc = emilData;
        matchedDocId = emilDocId;
      }

      // 4. Fallback for the 3 Pegawai TU
      if (!matchedDoc) {
        const staffFallback = [
          { nip: '197412162025212005', name: 'SRI WATI PUTRI', classes: 'Tata Usaha (TU)' },
          { nip: '197508282025212006', name: 'DAHRIYANTI', classes: 'Tata Usaha (TU)' },
          { nip: '198605012025212025', name: 'ANUGRAH TRIANA WAHAB', classes: 'Tata Usaha (TU)' },
        ].find((s) => s.nip === cleanNip || s.nip === strippedNip);

        if (staffFallback) {
          const staffDocId = `pegawai-${staffFallback.nip}`;
          const staffData = {
            id: staffDocId,
            nip: staffFallback.nip,
            name: staffFallback.name,
            classes: staffFallback.classes,
            role: 'pegawai_tu',
            email: `${staffFallback.nip}@smkn3pangkep.sch.id`,
            phone: '-',
            password: 'bismillah',
            isActive: true,
            totalMemorized: 0,
            totalInProcess: 0,
            totalRemaining: 38,
            createdAt: new Date().toISOString(),
          };
          try {
            await setDoc(doc(db, 'teachers', staffDocId), staffData);
          } catch (e) {
            console.error('Error persisting TU record:', e);
          }
          matchedDoc = staffData;
          matchedDocId = staffDocId;
        }
      }

      if (!matchedDoc) {
        setLoading(false);
        return {
          success: false,
          message: `Guru / Pegawai dengan NIP "${cleanNip}" tidak ditemukan. Pastikan data akun sudah diimpor oleh Admin atau periksa kembali NIP Anda.`,
        };
      }

      if (matchedDoc.isActive === false) {
        setLoading(false);
        return { success: false, message: 'Akun Anda sedang dinonaktifkan oleh Administrator.' };
      }

      // Password verification:
      // Accepts exact match, case-insensitive match, or default "bismillah"
      const docPass = String(matchedDoc.password || '').trim();
      const isPasswordCorrect =
        cleanPass === docPass ||
        cleanPass.toLowerCase() === docPass.toLowerCase() ||
        cleanPass.toLowerCase() === 'bismillah' ||
        (!docPass && cleanPass.toLowerCase() === 'bismillah');

      if (!isPasswordCorrect) {
        setLoading(false);
        return {
          success: false,
          message: 'Kata sandi tidak sesuai. Silakan coba kata sandi default "bismillah" atau hubungi Admin.',
        };
      }

      const isTU =
        matchedDoc.classes?.includes('Tata Usaha') ||
        matchedDoc.role === 'pegawai_tu' ||
        matchedDoc.classes?.toLowerCase() === 'tu';

      const session: UserSession = {
        uid: matchedDocId,
        email: matchedDoc.email || `${matchedDoc.nip}@smkn3pangkep.sch.id`,
        name: matchedDoc.name,
        role: isTU ? 'pegawai_tu' : 'guru_wali',
        nip: matchedDoc.nip,
        classes: matchedDoc.classes,
      };

      setUser(session);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
      setLoading(false);
      return { success: true };
    } catch (error: any) {
      setLoading(false);
      return { success: false, message: error.message || 'Terjadi kesalahan sistem saat login guru.' };
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem(STORAGE_KEY);
  };

  return (
    <AuthContext.Provider value={{ user, loading, loginAsAdmin, loginAsGuru, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
