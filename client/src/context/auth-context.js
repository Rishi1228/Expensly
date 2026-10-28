import { createContext, useContext } from 'react';

export const AuthContext = createContext(null);

/** { session, user, loading, signOut } */
export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>');
  return ctx;
}
