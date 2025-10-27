import { useState } from 'react';

interface RatingStarsProps {
  rating: number; // Current rating (can be average)
  totalRatings?: number; // Total number of ratings
  onRate?: (rating: number) => void; // Callback when user rates (interactive mode)
  interactive?: boolean; // If true, allows user interaction
  size?: 'sm' | 'md' | 'lg';
}

export default function RatingStars({
  rating,
  totalRatings,
  onRate,
  interactive = false,
  size = 'md'
}: RatingStarsProps) {
  const [hoverRating, setHoverRating] = useState(0);

  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6'
  };

  const handleClick = (starRating: number) => {
    if (interactive && onRate) {
      onRate(starRating);
    }
  };

  const handleMouseEnter = (starRating: number) => {
    if (interactive) {
      setHoverRating(starRating);
    }
  };

  const handleMouseLeave = () => {
    if (interactive) {
      setHoverRating(0);
    }
  };

  const displayRating = hoverRating || rating;

  return (
    <div className="flex items-center gap-1">
      {/* Stars */}
      <div className="flex items-center gap-0.5">
        {[1, 2, 3, 4, 5].map((star) => {
          const isFilled = star <= displayRating;
          const isPartiallyFilled = star === Math.ceil(displayRating) && displayRating % 1 !== 0;

          return (
            <button
              key={star}
              type="button"
              onClick={() => handleClick(star)}
              onMouseEnter={() => handleMouseEnter(star)}
              onMouseLeave={handleMouseLeave}
              disabled={!interactive}
              className={`${
                interactive ? 'cursor-pointer hover:scale-110' : 'cursor-default'
              } transition-transform`}
              aria-label={`Rate ${star} stars`}
            >
              {isPartiallyFilled ? (
                // Partial star (for averages like 3.7)
                <svg
                  className={`${sizeClasses[size]} text-yellow-400`}
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <defs>
                    <linearGradient id={`gradient-${star}`}>
                      <stop offset={`${(displayRating % 1) * 100}%`} stopColor="currentColor" />
                      <stop offset={`${(displayRating % 1) * 100}%`} stopColor="transparent" />
                    </linearGradient>
                  </defs>
                  <path
                    d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"
                    fill={`url(#gradient-${star})`}
                    stroke="currentColor"
                    strokeWidth="1"
                  />
                </svg>
              ) : (
                // Full or empty star
                <svg
                  className={`${sizeClasses[size]} ${
                    isFilled ? 'text-yellow-400' : 'text-gray-300 dark:text-gray-600'
                  } ${interactive && hoverRating >= star ? 'text-yellow-300' : ''}`}
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                </svg>
              )}
            </button>
          );
        })}
      </div>

      {/* Rating text */}
      <div className="text-sm text-gray-600 dark:text-gray-400 ml-1">
        {rating > 0 ? (
          <>
            <span className="font-semibold">{rating.toFixed(1)}</span>
            {totalRatings !== undefined && (
              <span className="ml-1">({totalRatings})</span>
            )}
          </>
        ) : (
          <span>Pas encore noté</span>
        )}
      </div>
    </div>
  );
}
