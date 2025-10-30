import { useNavigate } from 'react-router-dom';

interface PaywallModalProps {
  isOpen: boolean;
  onClose: () => void;
  feature: string; // "Community" or "Statistics"
}

export default function PaywallModal({ isOpen, onClose, feature }: PaywallModalProps) {
  const navigate = useNavigate();

  if (!isOpen) return null;

  const handleUpgrade = () => {
    navigate('/billing');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-md w-full p-6 relative">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        {/* Premium badge */}
        <div className="flex justify-center mb-4">
          <div className="bg-gradient-to-r from-purple-500 to-pink-500 text-white px-6 py-2 rounded-full font-bold text-lg">
            ⭐ Premium Feature
          </div>
        </div>

        {/* Title */}
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white text-center mb-4">
          Unlock {feature}
        </h2>

        {/* Description */}
        <p className="text-gray-600 dark:text-gray-400 text-center mb-6">
          {feature === 'Community' ? (
            <>
              Access thousands of training routines shared by the FortiFlow community.
              Browse, search, rate, and import routines to boost your training.
            </>
          ) : (
            <>
              Track your progress with detailed statistics, visualize your training data,
              build streaks, and climb the ranks from Bronze to Legend.
            </>
          )}
        </p>

        {/* Features list */}
        <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4 mb-6">
          <p className="font-semibold text-gray-900 dark:text-white mb-3">
            Premium includes:
          </p>
          <ul className="space-y-2 text-sm text-gray-700 dark:text-gray-300">
            <li className="flex items-start">
              <span className="text-green-500 mr-2">✓</span>
              <span>Unlimited routines</span>
            </li>
            <li className="flex items-start">
              <span className="text-green-500 mr-2">✓</span>
              <span>Community access</span>
            </li>
            <li className="flex items-start">
              <span className="text-green-500 mr-2">✓</span>
              <span>Statistics & Analytics</span>
            </li>
            <li className="flex items-start">
              <span className="text-green-500 mr-2">✓</span>
              <span>Grade system & Streaks</span>
            </li>
            <li className="flex items-start">
              <span className="text-green-500 mr-2">✓</span>
              <span>Share your routines</span>
            </li>
          </ul>
        </div>

        {/* Price */}
        <div className="text-center mb-6">
          <p className="text-3xl font-bold text-gray-900 dark:text-white">
            3.99€
            <span className="text-lg font-normal text-gray-600 dark:text-gray-400"> / month</span>
          </p>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Cancel anytime
          </p>
        </div>

        {/* CTA Buttons */}
        <div className="space-y-3">
          <button
            onClick={handleUpgrade}
            className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-semibold py-3 px-6 rounded-lg transition-all"
          >
            Upgrade to Premium
          </button>
          <button
            onClick={onClose}
            className="w-full bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 font-semibold py-3 px-6 rounded-lg transition-all"
          >
            Maybe Later
          </button>
        </div>
      </div>
    </div>
  );
}
