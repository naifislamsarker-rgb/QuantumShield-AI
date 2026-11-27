import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react';
import {
  onAuthStateChanged,
  signInWithPopup,
  signOut,
  type User,
} from 'firebase/auth';
import {
  doc,
  getDoc,
  serverTimestamp,
  setDoc,
} from 'firebase/firestore';
import {
  auth,
  db,
  googleProvider,
  handleFirestoreError,
  OperationType,
} from '../firebase';
import { clampBlueprintString } from '../utils/securityScanner';

const ADMIN_BOOTSTRAP_EMAIL = 'naifislamsarkerr@gmail.com';

interface FirebaseContextValue {
  user: User | null;
  authReady: boolean;
  isAdmin: boolean;
  authBusy: boolean;
  authError: string | null;
  signInWithGoogle: () => Promise<void>;
  signOutUser: () => Promise<void>;
}

const FirebaseContext = createContext<FirebaseContextValue | null>(null);

export function FirebaseProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [authReady, setAuthReady] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [authBusy, setAuthBusy] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (nextUser) => {
      setUser(nextUser);
      if (!nextUser) {
        setIsAdmin(false);
        setAuthReady(true);
        return;
      }

      if (nextUser.emailVerified) {
        const userPath = `users/${nextUser.uid}`;
        try {
          const userRef = doc(db, 'users', nextUser.uid);
          const snap = await getDoc(userRef);
          if (!snap.exists()) {
            await setDoc(userRef, {
              uid: nextUser.uid,
              displayName: clampBlueprintString(
                nextUser.displayName || nextUser.email || 'Operator',
                100
              ),
              email: clampBlueprintString(nextUser.email || '', 160),
              role: 'analyst',
              createdAt: serverTimestamp(),
            });
          }
        } catch (err) {
          console.error('User profile sync error:', err);
          if (err instanceof Error && err.message.includes('Missing or insufficient permissions')) {
            handleFirestoreError(err, OperationType.WRITE, userPath);
          }
        }

        const adminRef = doc(db, 'admins', nextUser.uid);
        try {
          const adminSnap = await getDoc(adminRef);
          if (adminSnap.exists()) {
            setIsAdmin(true);
          } else if (nextUser.email === ADMIN_BOOTSTRAP_EMAIL) {
            await setDoc(adminRef, {
              uid: nextUser.uid,
              email: nextUser.email,
              grantedAt: serverTimestamp(),
            });
            setIsAdmin(true);
          } else {
            setIsAdmin(false);
          }
        } catch {
          setIsAdmin(false);
        }
      } else {
        setIsAdmin(false);
      }

      setAuthReady(true);
    });

    return () => unsubscribe();
  }, []);

  const signInWithGoogle = async () => {
    setAuthError(null);
    setAuthBusy(true);
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Sign-in could not be completed.';
      setAuthError(msg);
    } finally {
      setAuthBusy(false);
    }
  };

  const signOutUser = async () => {
    setAuthError(null);
    setAuthBusy(true);
    try {
      await signOut(auth);
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Sign-out failed.';
      setAuthError(msg);
    } finally {
      setAuthBusy(false);
    }
  };

  return (
    <FirebaseContext.Provider
      value={{
        user,
        authReady,
        isAdmin,
        authBusy,
        authError,
        signInWithGoogle,
        signOutUser,
      }}
    >
      {children}
    </FirebaseContext.Provider>
  );
}

export function useFirebase() {
  const ctx = useContext(FirebaseContext);
  if (!ctx) {
    throw new Error('useFirebase must be used inside FirebaseProvider');
  }
  return ctx;
}
