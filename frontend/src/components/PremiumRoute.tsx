import { useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import PaywallModal from './PaywallModal';

interface PremiumRouteProps {
  children: ReactNode;
  featureName?: string;
  redirectTo?: string;
}

/**
 * PremiumRoute component
 *
 * Protects routes that require Premium subscription.
 * Shows a paywall modal if user is on Free tier.
 *
 * @param children - The component to render if user has premium access
 * @param featureName - Name of the feature for the paywall modal (e.g., "Statistics")
 * @param redirectTo - Where to redirect when paywall is closed (default: '/')
 */
export default function PremiumRoute({
  children,
  featureName = 'This Feature',
  redirectTo = '/'
}: PremiumRouteProps) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [showPaywall, setShowPaywall] = useState(false);

  const isPremium = user?.subscription_tier === 'premium';

  useEffect(() => {
    if (!isPremium) {
      setShowPaywall(true);
    }
  }, [isPremium]);

  const handleClosePaywall = () => {
    setShowPaywall(false);
    navigate(redirectTo);
  };

  // If user is premium, render the children
  if (isPremium) {
    return <>{children}</>;
  }

  // Otherwise show paywall modal
  return (
    <PaywallModal
      isOpen={showPaywall}
      onClose={handleClosePaywall}
      feature={featureName}
    />
  );
}
