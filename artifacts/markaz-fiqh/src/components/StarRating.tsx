import { useState } from 'react';
import { cn } from '@/lib/utils';

interface StarRatingProps {
  rating: number;
  size?: 'sm' | 'md' | 'lg';
  interactive?: boolean;
  onChange?: (rating: number) => void;
  className?: string;
}

const SIZE_MAP = {
  sm: 'w-3.5 h-3.5',
  md: 'w-5 h-5',
  lg: 'w-7 h-7',
};

export function StarRating({
  rating,
  size = 'md',
  interactive = false,
  onChange,
  className,
}: StarRatingProps) {
  const [hovered, setHovered] = useState(0);

  const display = interactive && hovered > 0 ? hovered : rating;

  return (
    <div
      className={cn('flex items-center gap-0.5', className)}
      onMouseLeave={() => interactive && setHovered(0)}
    >
      {[1, 2, 3, 4, 5].map((star) => {
        const filled = star <= display;
        return (
          <svg
            key={star}
            viewBox="0 0 20 20"
            fill={filled ? 'currentColor' : 'none'}
            stroke="currentColor"
            strokeWidth={1.5}
            style={{ pointerEvents: 'all' }}
            className={cn(
              SIZE_MAP[size],
              filled ? 'text-yellow-400' : 'text-muted-foreground/40',
              interactive && 'cursor-pointer transition-colors duration-100',
              interactive && star <= hovered && 'text-yellow-400',
            )}
            onMouseEnter={() => interactive && setHovered(star)}
            onClick={() => interactive && onChange?.(star)}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"
            />
          </svg>
        );
      })}
    </div>
  );
}
