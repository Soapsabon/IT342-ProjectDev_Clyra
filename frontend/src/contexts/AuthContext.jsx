import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { onAuthStateChanged, signInWithEmailAndPassword, signOut } from 'firebase/auth';
import { auth } from '../firebase/config';
import { fetchMe, serverLogout } from '../services/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [firebaseUser, setFirebaseUser] = useState(null);
  const [profile, setProfile] = useState(null); // trusted profile + role from the backend
  const [loading, setLoading] = useState(true); // true until the first auth check finished
  const [authError, setAuthError] = useState('');

  // Firebase restores the session after a page refresh and fires this listener;
  // we then ask the backend for the trusted role.
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        setFirebaseUser(null);
        setProfile(null);
        setLoading(false);
        return;
      }
      setLoading(true);
      try {
        const me = await fetchMe();
        setFirebaseUser(user);
        setProfile(me);
        setAuthError('');
      } catch (err) {
        // 401/403/offline: the account is not usable in Clyra -> end the Firebase session.
        setAuthError(err.message || 'Could not load your account.');
        setProfile(null);
        setFirebaseUser(null);
        await signOut(auth);
      } finally {
        setLoading(false);
      }
    });
    return unsubscribe;
  }, []);

  const login = useCallback(async (email, password) => {
    setAuthError('');
    await signInWithEmailAndPassword(auth, email.trim(), password);
    // onAuthStateChanged loads the profile; pages react to `profile` becoming available.
  }, []);

  const logout = useCallback(async () => {
    try {
      await serverLogout(); // revoke refresh tokens server-side (best effort)
    } catch {
      /* the local sign-out below must happen regardless */
    }
    await signOut(auth);
    setFirebaseUser(null);
    setProfile(null);
  }, []);

  const refreshProfile = useCallback(async () => {
    const me = await fetchMe();
    setProfile(me);
    return me;
  }, []);

  const value = useMemo(
    () => ({ firebaseUser, profile, loading, authError, setAuthError, login, logout, refreshProfile }),
    [firebaseUser, profile, loading, authError, login, logout, refreshProfile],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>');
  return ctx;
}
