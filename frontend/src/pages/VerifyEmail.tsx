import { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { api } from '../services/api';

export default function VerifyEmail() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [status, setStatus] = useState<'verifying' | 'success' | 'error'>('verifying');
  const [message, setMessage] = useState('');

  useEffect(() => {
    const token = searchParams.get('token');

    if (!token) {
      setStatus('error');
      setMessage('Token de vérification manquant');
      return;
    }

    verifyEmail(token);
  }, [searchParams]);

  const verifyEmail = async (token: string) => {
    try {
      await api.verifyEmail({ token });
      setStatus('success');
      setMessage('Votre email a été vérifié avec succès !');
    } catch (err) {
      setStatus('error');
      const errorMessage = err instanceof Error ? err.message : 'Token de vérification invalide ou expiré';
      setMessage(errorMessage);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-gray-900 dark:to-gray-800 px-4">
      <div className="max-w-md w-full">
        {/* Logo/Title */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent mb-2">
            FortiFlow
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Vérification de l'email
          </p>
        </div>

        {/* Status Card */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 border border-gray-200 dark:border-gray-700">
          <div className="text-center">
            {/* Icon */}
            <div className={`w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 ${
              status === 'verifying' ? 'bg-indigo-100 dark:bg-indigo-900/30' :
              status === 'success' ? 'bg-green-100 dark:bg-green-900/30' :
              'bg-red-100 dark:bg-red-900/30'
            }`}>
              {status === 'verifying' && (
                <div className="animate-spin rounded-full h-10 w-10 border-b-4 border-indigo-600"></div>
              )}
              {status === 'success' && (
                <svg className="w-10 h-10 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              )}
              {status === 'error' && (
                <svg className="w-10 h-10 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              )}
            </div>

            {/* Title */}
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">
              {status === 'verifying' && 'Vérification en cours...'}
              {status === 'success' && 'Email vérifié !'}
              {status === 'error' && 'Vérification échouée'}
            </h2>

            {/* Message */}
            <p className={`mb-6 ${
              status === 'success' ? 'text-green-600 dark:text-green-400' :
              status === 'error' ? 'text-red-600 dark:text-red-400' :
              'text-gray-600 dark:text-gray-400'
            }`}>
              {status === 'verifying' ? 'Veuillez patienter...' : message}
            </p>

            {/* Action Buttons */}
            {status === 'success' && (
              <button
                onClick={() => navigate('/login')}
                className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white px-6 py-3 rounded-lg font-semibold transition-all shadow-lg hover:shadow-xl flex items-center justify-center gap-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                </svg>
                Se connecter
              </button>
            )}

            {status === 'error' && (
              <div className="space-y-3">
                <Link
                  to="/login"
                  className="block w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white px-6 py-3 rounded-lg font-semibold transition-all shadow-lg hover:shadow-xl"
                >
                  Retour à la connexion
                </Link>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Le lien a peut-être expiré. Vous pouvez demander un nouveau lien de vérification depuis votre profil après vous être connecté.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
