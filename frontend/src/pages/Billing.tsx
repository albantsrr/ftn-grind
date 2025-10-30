import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { api } from '../services/api';
import Sidebar from '../components/Sidebar';
import type { Subscription } from '../types';

export default function Billing() {
  const { user, logout } = useAuth();
  const [searchParams] = useSearchParams();
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [loading, setLoading] = useState(true);
  const [upgrading, setUpgrading] = useState(false);
  const [managingSubscription, setManagingSubscription] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Check for success/cancel params from Stripe redirect
  useEffect(() => {
    const success = searchParams.get('success');
    const canceled = searchParams.get('canceled');

    if (success === 'true') {
      setSuccessMessage('Payment successful! Your Premium subscription is now active.');
      // Reload user data after successful payment
      window.location.reload();
    } else if (canceled === 'true') {
      setError('Payment canceled. You can try again anytime.');
    }
  }, [searchParams]);

  // Load subscription status
  useEffect(() => {
    loadSubscription();
  }, []);

  const loadSubscription = async () => {
    try {
      setLoading(true);
      const data = await api.getSubscriptionStatus();
      setSubscription(data);
    } catch (err) {
      console.error('Failed to load subscription:', err);
      setError('Failed to load subscription status');
    } finally {
      setLoading(false);
    }
  };

  const handleUpgrade = async () => {
    try {
      setUpgrading(true);
      setError(null);
      const { url } = await api.createCheckoutSession();
      window.location.href = url; // Redirect to Stripe Checkout
    } catch (err) {
      console.error('Failed to create checkout session:', err);
      setError(err instanceof Error ? err.message : 'Failed to start checkout');
      setUpgrading(false);
    }
  };

  const handleManageSubscription = async () => {
    try {
      setManagingSubscription(true);
      setError(null);
      const { url } = await api.createPortalSession();
      window.location.href = url; // Redirect to Stripe Customer Portal
    } catch (err) {
      console.error('Failed to create portal session:', err);
      setError(err instanceof Error ? err.message : 'Failed to open subscription management');
      setManagingSubscription(false);
    }
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const isPremium = user?.subscription_tier === 'premium';
  const isActive = subscription?.subscription_status === 'active';

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-900">
      <Sidebar onLogout={logout} username={user?.username || ''} subscriptionTier={user?.subscription_tier} />

      <div className="flex-1 overflow-auto">
        <div className="max-w-4xl mx-auto p-8">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
              Subscription & Billing
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Manage your FortiFlow subscription
            </p>
          </div>

          {/* Success/Error Messages */}
          {successMessage && (
            <div className="mb-6 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
              <p className="text-green-800 dark:text-green-200">{successMessage}</p>
            </div>
          )}

          {error && (
            <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
              <p className="text-red-800 dark:text-red-200">{error}</p>
            </div>
          )}

          {loading ? (
            <div className="text-center py-12">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
              <p className="mt-4 text-gray-600 dark:text-gray-400">Loading subscription...</p>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Current Plan Card */}
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 border border-gray-200 dark:border-gray-700">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                    Current Plan
                  </h2>
                  <span
                    className={`px-4 py-2 rounded-full font-semibold ${
                      isPremium
                        ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white'
                        : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                    }`}
                  >
                    {isPremium ? '⭐ Premium' : 'Free'}
                  </span>
                </div>

                {isPremium && isActive ? (
                  <div className="space-y-3">
                    <p className="text-gray-600 dark:text-gray-400">
                      <span className="font-medium">Price:</span> 3.99 EUR / month
                    </p>
                    <p className="text-gray-600 dark:text-gray-400">
                      <span className="font-medium">Next billing date:</span>{' '}
                      {formatDate(subscription?.current_period_end || null)}
                    </p>
                    {subscription?.cancel_at_period_end && (
                      <p className="text-amber-600 dark:text-amber-400">
                        ⚠️ Your subscription will be canceled at the end of the billing period.
                      </p>
                    )}
                  </div>
                ) : (
                  <p className="text-gray-600 dark:text-gray-400">
                    You're currently on the Free plan with limited features.
                  </p>
                )}
              </div>

              {/* Features Comparison */}
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 border border-gray-200 dark:border-gray-700">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                  {isPremium ? 'Your Premium Features' : 'Upgrade to Premium'}
                </h2>

                <ul className="space-y-3">
                  <li className="flex items-start">
                    <span className="text-green-500 mr-3 text-xl">✓</span>
                    <span className="text-gray-700 dark:text-gray-300">
                      <strong>Unlimited routines</strong> - Create as many training routines as you need
                    </span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-green-500 mr-3 text-xl">✓</span>
                    <span className="text-gray-700 dark:text-gray-300">
                      <strong>Community access</strong> - Browse and import routines from other users
                    </span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-green-500 mr-3 text-xl">✓</span>
                    <span className="text-gray-700 dark:text-gray-300">
                      <strong>Share your routines</strong> - Make your routines public for others
                    </span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-green-500 mr-3 text-xl">✓</span>
                    <span className="text-gray-700 dark:text-gray-300">
                      <strong>Statistics & Analytics</strong> - Track your progress with detailed stats
                    </span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-green-500 mr-3 text-xl">✓</span>
                    <span className="text-gray-700 dark:text-gray-300">
                      <strong>Grade system</strong> - Progress from Bronze to Legend
                    </span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-green-500 mr-3 text-xl">✓</span>
                    <span className="text-gray-700 dark:text-gray-300">
                      <strong>Streak tracking</strong> - Build and maintain training streaks
                    </span>
                  </li>
                </ul>

                {!isPremium && (
                  <div className="mt-6">
                    <button
                      onClick={handleUpgrade}
                      disabled={upgrading}
                      className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-semibold py-3 px-6 rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {upgrading ? 'Redirecting to checkout...' : 'Upgrade to Premium - 3.99€/month'}
                    </button>
                    <p className="text-center text-sm text-gray-500 dark:text-gray-400 mt-3">
                      Cancel anytime. No long-term commitment.
                    </p>
                  </div>
                )}

                {isPremium && isActive && (
                  <div className="mt-6">
                    <button
                      onClick={handleManageSubscription}
                      disabled={managingSubscription}
                      className="w-full bg-gray-600 hover:bg-gray-700 text-white font-semibold py-3 px-6 rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {managingSubscription ? 'Opening...' : 'Manage Subscription'}
                    </button>
                    <p className="text-center text-sm text-gray-500 dark:text-gray-400 mt-3">
                      Update payment method, view invoices, or cancel subscription
                    </p>
                  </div>
                )}
              </div>

              {/* Free Plan Limitations */}
              {!isPremium && (
                <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl p-6">
                  <h3 className="text-lg font-semibold text-amber-900 dark:text-amber-200 mb-3">
                    Free Plan Limitations
                  </h3>
                  <ul className="space-y-2 text-amber-800 dark:text-amber-300">
                    <li className="flex items-start">
                      <span className="mr-2">•</span>
                      Limited to 2 routines maximum
                    </li>
                    <li className="flex items-start">
                      <span className="mr-2">•</span>
                      No access to Community features
                    </li>
                    <li className="flex items-start">
                      <span className="mr-2">•</span>
                      No access to Statistics dashboard
                    </li>
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
