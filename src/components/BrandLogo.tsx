import React from 'react';

export type BrandLogoVariant =
  | 'default'
  | 'without-tagline'
  | 'tagline'
  | 'with-tagline'
  | 'icon'
  | 'dark'
  | 'dark-tagline'
  | 'stacked'
  | 'full';

export interface BrandLogoProps {
  className?: string;
  variant?: BrandLogoVariant;
  size?: 'sm' | 'md' | 'lg' | 'xl' | '2xl';
  alt?: string;
}

export const BrandLogo: React.FC<BrandLogoProps> = ({
  className = '',
  variant = 'default',
  size = 'md',
  alt = 'Maxicareer',
}) => {
  const isIconOnly = variant === 'icon';
  const isStacked = variant === 'stacked';
  const isTagline = variant === 'tagline' || variant === 'with-tagline';
  const isDark = variant === 'dark' || variant === 'dark-tagline';

  // Determine asset paths from /images/ with cache-buster
  let src = '/images/maxicareer-logo.png?v=3';
  let svgSrc = '/images/maxicareer-logo.svg?v=3';

  if (isIconOnly) {
    src = '/images/maxicareer-icon.png?v=3';
    svgSrc = '/images/maxicareer-icon.svg?v=3';
  } else if (isStacked) {
    src = '/images/maxicareer-logo-stacked.png?v=3';
    svgSrc = '/images/maxicareer-logo-stacked.png?v=3';
  } else if (isTagline) {
    src = '/images/maxicareer-logo-tagline.png?v=3';
    svgSrc = '/images/maxicareer-logo-tagline.svg?v=3';
  } else if (isDark) {
    src = '/images/maxicareer-logo-white.png?v=3';
    svgSrc = '/images/maxicareer-logo-white.svg?v=3';
  }

  // Size styling while strictly preserving aspect ratio and ensuring high visibility
  let sizeClasses = '';
  if (isIconOnly) {
    switch (size) {
      case 'sm':
        sizeClasses = 'h-7 w-7';
        break;
      case 'md':
        sizeClasses = 'h-9 w-9';
        break;
      case 'lg':
        sizeClasses = 'h-10 w-10 sm:h-11 sm:w-11';
        break;
      case 'xl':
        sizeClasses = 'h-16 w-16';
        break;
      case '2xl':
        sizeClasses = 'h-24 w-24';
        break;
      default:
        sizeClasses = 'h-9 w-9';
        break;
    }
  } else {
    // Full Logo (Icon + Maxicareer wordmark)
    switch (size) {
      case 'sm':
        sizeClasses = 'h-8 sm:h-9 w-auto';
        break;
      case 'md':
        sizeClasses = 'h-10 sm:h-12 w-auto';
        break;
      case 'lg':
        sizeClasses = 'h-12 sm:h-14 md:h-16 w-auto';
        break;
      case 'xl':
        sizeClasses = 'h-16 sm:h-20 md:h-24 w-auto';
        break;
      case '2xl':
        sizeClasses = 'h-22 sm:h-26 md:h-30 w-auto';
        break;
      default:
        sizeClasses = 'h-10 sm:h-12 w-auto';
        break;
    }
  }

  return (
    <div className={`inline-flex items-center select-none ${className}`}>
      <picture className="block">
        <source srcSet={svgSrc} type="image/svg+xml" />
        <img
          src={src}
          alt={alt}
          className={`${sizeClasses} object-contain transition-transform duration-200`}
          loading="eager"
          decoding="async"
          referrerPolicy="no-referrer"
        />
      </picture>
    </div>
  );
};
