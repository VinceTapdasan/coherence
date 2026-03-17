import { createContext, useContext, useEffect, useState } from 'react';
import { useRouter, useSegments } from 'expo-router';
import * as SecureStore from 'expo-secure-store';
import type { User, Credentials } from '@/types';

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  signIn: (credentials: Credentials) => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    checkAuth();
  }, []);

  // TODO: re-enable when auth screens are built
  // useEffect(() => {
  //   if (isLoading) return;
  //   const inAuthGroup = segments[0] === '(auth)';
  //   if (!user && !inAuthGroup) {
  //     router.replace('/(auth)/login');
  //   } else if (user && inAuthGroup) {
  //     router.replace('/(tabs)');
  //   }
  // }, [user, segments, isLoading]);

  async function checkAuth() {
    try {
      const token = await SecureStore.getItemAsync('authToken');
      if (token) {
        // TODO: validate token with your API and set user
        // const userData = await api.getUser(token);
        // setUser(userData);
      }
    } catch {
      await SecureStore.deleteItemAsync('authToken');
    } finally {
      setIsLoading(false);
    }
  }

  async function signIn(credentials: Credentials) {
    // TODO: call your API login endpoint
    // const { token, user } = await api.login(credentials);
    // await SecureStore.setItemAsync('authToken', token);
    // setUser(user);
    void credentials;
  }

  async function signOut() {
    await SecureStore.deleteItemAsync('authToken');
    setUser(null);
  }

  return (
    <AuthContext.Provider value={{ user, isLoading, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
}
