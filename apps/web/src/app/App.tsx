import { RouterProvider } from 'react-router-dom';
import { router } from './router.js';
import { SupabaseAuthProvider, useSupabaseAuth } from './SupabaseAuthProvider.js';
import { supabaseClient } from './supabase.js';
import { useOnlineStatus } from '../components/PwaStatus.js';

export function App() {
  if (!supabaseClient) {
    return (
      <main className="mx-auto max-w-xl p-8 text-slate-900">
        <h1 className="text-xl font-bold">Supabase configuration required</h1>
        <p className="mt-3">
          Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in the repository
          root .env.local file, then restart the web development server.
        </p>
      </main>
    );
  }

  return (
    <SupabaseAuthProvider client={supabaseClient}>
      <AuthenticatedApp />
    </SupabaseAuthProvider>
  );
}

function AuthenticatedApp() {
  const online = useOnlineStatus();
  const { userId, isLoading, error } = useSupabaseAuth();

  if (!online) return <RouterProvider router={router} />;

  if (isLoading) {
    return <main className="p-8 text-slate-700">Connecting to Supabase...</main>;
  }

  if (error || !userId) {
    return (
      <main className="mx-auto max-w-xl p-8 text-slate-900" role="alert">
        <h1 className="text-xl font-bold">Could not start an anonymous session</h1>
        <p className="mt-3">{error ?? 'Supabase returned no user.'}</p>
        <p className="mt-3 text-sm text-slate-600">
          Check the project URL and anon key, and enable anonymous sign-ins in
          Supabase Authentication settings.
        </p>
      </main>
    );
  }

  return <RouterProvider router={router} />;
}
