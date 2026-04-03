'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { signUp } from '../../../lib/auth';
import { createGarageForNewUser } from '../../../lib/auth-actions';
import Link from 'next/link';

export default function SignupPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [garageName, setGarageName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError('');
    setLoading(true);

    if (!garageName.trim()) {
      setError('Nom du garage requis');
      setLoading(false);
      return;
    }

    try {
      console.log('[SignupPage] Submitting signup...');
      const authData = await signUp(email, password, garageName);
      console.log('[SignupPage] Auth user created:', authData.user?.id);

      if (authData.user?.id) {
        try {
          console.log('[SignupPage] Setting up garage via server action...');
          await createGarageForNewUser(authData.user.id, garageName);
          console.log('[SignupPage] Garage setup complete');
        } catch (dbErr) {
          console.error('[SignupPage] Garage setup error:', dbErr);
          // User created but garage setup failed - will retry on next login
          setError('Compte créé mais erreur d\'initialisation. Essayez de vous connecter.');
          setLoading(false);
          return;
        }
      }

      console.log('[SignupPage] Signup successful, redirecting...');
      router.replace('/');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Échec de l\'inscription';
      console.error('[SignupPage] Signup error:', errorMessage, err);
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--background)] text-[var(--foreground)] p-4">
      <div className="w-full max-w-md bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-xl p-8 shadow-md">
        <h1 className="text-2xl font-bold mb-6 text-gray-900 dark:text-white">Créer un compte</h1>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-slate-200">Nom du garage</label>
            <input
              type="text"
              value={garageName}
              onChange={(e) => setGarageName(e.target.value)}
              required
              className="mt-1 block w-full rounded-lg border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-800 px-3 py-2 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-slate-200">Adresse e-mail</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="mt-1 block w-full rounded-lg border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-800 px-3 py-2 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-slate-200">Mot de passe</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="mt-1 block w-full rounded-lg border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-800 px-3 py-2 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-blue-600 text-white px-4 py-2 font-medium hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? 'Création...' : 'Créer un compte'}
          </button>
        </form>

        <p className="mt-4 text-sm text-gray-600 dark:text-slate-300">
          Déjà un compte ?{' '}
          <Link href="/auth/login" className="text-blue-600 hover:text-blue-700">
            Se connecter
          </Link>
        </p>
      </div>
    </div>
  );
}
