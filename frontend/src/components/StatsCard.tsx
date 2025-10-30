import { useEffect, useState } from 'react';

interface StatsCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  color: 'green' | 'blue' | 'orange' | 'purple';
  tooltip?: string;
  delay?: number;
}

const colorClasses = {
  green: {
    bg: 'bg-green-100 dark:bg-green-900/30',
    icon: 'text-green-600 dark:text-green-400',
    hover: 'hover:border-green-400 dark:hover:border-green-500'
  },
  blue: {
    bg: 'bg-blue-100 dark:bg-blue-900/30',
    icon: 'text-blue-600 dark:text-blue-400',
    hover: 'hover:border-blue-400 dark:hover:border-blue-500'
  },
  orange: {
    bg: 'bg-orange-100 dark:bg-orange-900/30',
    icon: 'text-orange-600 dark:text-orange-400',
    hover: 'hover:border-orange-400 dark:hover:border-orange-500'
  },
  purple: {
    bg: 'bg-purple-100 dark:bg-purple-900/30',
    icon: 'text-purple-600 dark:text-purple-400',
    hover: 'hover:border-purple-400 dark:hover:border-purple-500'
  }
};

export default function StatsCard({ title, value, icon, color, tooltip, delay = 0 }: StatsCardProps) {
  const [displayValue, setDisplayValue] = useState(0);
  const [isHovered, setIsHovered] = useState(false);
  const [showTooltip, setShowTooltip] = useState(false);
  const classes = colorClasses[color];

  // Animate number counting
  useEffect(() => {
    const timer = setTimeout(() => {
      if (typeof value === 'number') {
        const duration = 1000; // 1 second animation
        const steps = 30;
        const increment = value / steps;
        let current = 0;

        const counter = setInterval(() => {
          current += increment;
          if (current >= value) {
            setDisplayValue(value);
            clearInterval(counter);
          } else {
            setDisplayValue(Math.floor(current));
          }
        }, duration / steps);

        return () => clearInterval(counter);
      }
    }, delay);

    return () => clearTimeout(timer);
  }, [value, delay]);

  const finalValue = typeof value === 'number' ? displayValue : value;

  return (
    <div
      className={`bg-white dark:bg-gray-800 rounded-xl shadow-lg border-2 border-gray-200 dark:border-gray-700 p-6
        transition-all duration-300 transform ${classes.hover}
        ${isHovered ? 'scale-105 shadow-2xl' : 'scale-100'}
        relative group cursor-pointer`}
      onMouseEnter={() => {
        setIsHovered(true);
        if (tooltip) setShowTooltip(true);
      }}
      onMouseLeave={() => {
        setIsHovered(false);
        setShowTooltip(false);
      }}
      style={{ animationDelay: `${delay}ms` }}
    >
      {/* Tooltip */}
      {tooltip && showTooltip && (
        <div className="absolute -top-12 left-1/2 transform -translate-x-1/2 z-20
          bg-gray-900 dark:bg-gray-700 text-white text-sm px-3 py-2 rounded-lg
          whitespace-nowrap shadow-xl animate-fade-in">
          {tooltip}
          <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 translate-y-1/2 rotate-45
            w-2 h-2 bg-gray-900 dark:bg-gray-700"></div>
        </div>
      )}

      <div className="flex items-center gap-4">
        {/* Icon with pulse animation */}
        <div className={`w-16 h-16 ${classes.bg} rounded-xl flex items-center justify-center
          transition-transform duration-300 ${isHovered ? 'rotate-12 scale-110' : 'rotate-0 scale-100'}`}>
          <div className={`${classes.icon} ${isHovered ? 'animate-pulse-gentle' : ''}`}>
            {icon}
          </div>
        </div>

        <div className="flex-1">
          <p className="text-gray-600 dark:text-gray-400 text-sm font-medium mb-1">{title}</p>
          <p className="text-4xl font-bold text-gray-900 dark:text-white transition-all duration-300">
            {finalValue}
          </p>
        </div>
      </div>

      <style>{`
        @keyframes fade-in {
          from { opacity: 0; transform: translate(-50%, -4px); }
          to { opacity: 1; transform: translate(-50%, 0); }
        }
        @keyframes pulse-gentle {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.7; }
        }
        .animate-fade-in {
          animation: fade-in 0.2s ease-out;
        }
        .animate-pulse-gentle {
          animation: pulse-gentle 1.5s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
}
