import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react';
import type { SupabaseClient } from '@t-crossword/data';

interface SupabaseAuthContextValue {
  client: SupabaseClient;
  userId: string | null;
  isLoading: boolean;
  error: string | null;
}

const SupabaseAuthContext = createContext<SupabaseAuthContextValue | null>(null);
const pendingAnonymousSessions = new WeakMap<SupabaseClient, Promise<string>>();

async function ensureAnonymousUser(client: SupabaseClient): Promise<string> {
  const { data, error } = await client.auth.getSession();
  if (error) throw error;
  if (data.session) return data.session.user.id;

  let pendingSession = pendingAnonymousSessions.get(client);
  if (!pendingSession) {
    pendingSession = client.auth.signInAnonymously().then(({ data: signInData, error: signInError }) => {
      if (signInError) throw signInError;
      if (!signInData.user) throw new Error('Anonymous sign-in returned no user.');
      return signInData.user.id;
    });
    pendingAnonymousSessions.set(client, pendingSession);
  }

  try {
    return await pendingSession;
  } finally {
    if (pendingAnonymousSessions.get(client) === pendingSession) {
      pendingAnonymousSessions.delete(client);
    }
  }
}

export function SupabaseAuthProvider({
  client,
  children,
}: {
  client: SupabaseClient;
  children: ReactNode;
}) {
  const [userId, setUserId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    const {
      data: { subscription },
    } = client.auth.onAuthStateChange((_event, session) => {
      if (!isMounted) return;
      setUserId(session?.user.id ?? null);
      if (session) setError(null);
    });

    async function initializeSession() {
      try {
        const nextUserId = await ensureAnonymousUser(client);
        if (isMounted) {
          setUserId(nextUserId);
          setError(null);
        }
      } catch (sessionError) {
        if (isMounted) {
          setError(
            sessionError instanceof Error
              ? sessionError.message
              : 'Could not initialize the Supabase session.'
          );
        }
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }

    void initializeSession();

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, [client]);

  return (
    <SupabaseAuthContext.Provider value={{ client, userId, isLoading, error }}>
      {children}
    </SupabaseAuthContext.Provider>
  );
}

export function useSupabaseAuth(): SupabaseAuthContextValue {
  const context = useContext(SupabaseAuthContext);
  if (!context) {
    throw new Error('useSupabaseAuth must be used within SupabaseAuthProvider.');
  }
  return context;
}
