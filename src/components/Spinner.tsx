import React from 'react';

interface SpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  color?: 'blue' | 'purple' | 'green' | 'red';
  variant?: 'default' | 'modern' | 'gradient';
}

export function Spinner({ size = 'md', color = 'blue', variant = 'modern' }: SpinnerProps) {
  const sizeMap = {
    sm: 24,
    md: 48,
    lg: 64,
  };

  const colorMap = {
    blue: { primary: '#2563eb', secondary: '#3b82f6' },
    purple: { primary: '#9333ea', secondary: '#c084fc' },
    green: { primary: '#16a34a', secondary: '#4ade80' },
    red: { primary: '#dc2626', secondary: '#ef4444' },
  };

  const size_px = sizeMap[size];
  const colors = colorMap[color];

  if (variant === 'gradient') {
    return (
      <div className="flex items-center justify-center">
        <style>{`
          @keyframes spinnerGradient {
            0% {
              transform: rotate(0deg);
              filter: hue-rotate(0deg);
            }
            100% {
              transform: rotate(360deg);
              filter: hue-rotate(360deg);
            }
          }
          .spinner-gradient {
            animation: spinnerGradient 2s linear infinite;
          }
        `}</style>
        <svg
          width={size_px}
          height={size_px}
          viewBox="0 0 50 50"
          className="spinner-gradient"
        >
          <circle
            cx="25"
            cy="25"
            r="20"
            fill="none"
            stroke="url(#grad)"
            strokeWidth="3"
            strokeLinecap="round"
            strokeDasharray="31.4 94.2"
          />
          <defs>
            <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" style={{ stopColor: colors.primary, stopOpacity: 1 }} />
              <stop offset="100%" style={{ stopColor: colors.secondary, stopOpacity: 1 }} />
            </linearGradient>
          </defs>
        </svg>
      </div>
    );
  }

  if (variant === 'modern') {
    return (
      <div className="flex items-center justify-center">
        <style>{`
          @keyframes spinnerModern {
            0% {
              transform: rotate(0deg) scale(1);
              opacity: 1;
            }
            100% {
              transform: rotate(360deg) scale(1);
              opacity: 1;
            }
          }
          @keyframes spinnerDot {
            0% {
              opacity: 0.3;
              transform: scale(0.8);
            }
            50% {
              opacity: 1;
              transform: scale(1);
            }
            100% {
              opacity: 0.3;
              transform: scale(0.8);
            }
          }
          .spinner-modern {
            animation: spinnerModern 1.5s linear infinite;
          }
          .spinner-dot {
            animation: spinnerDot 1.5s ease-in-out infinite;
          }
        `}</style>
        <svg
          width={size_px}
          height={size_px}
          viewBox="0 0 50 50"
          className="spinner-modern"
        >
          {/* Anillo externo */}
          <circle
            cx="25"
            cy="25"
            r="18"
            fill="none"
            stroke={colors.primary}
            strokeWidth="2"
            opacity="0.3"
          />
          {/* Anillo con progreso */}
          <circle
            cx="25"
            cy="25"
            r="18"
            fill="none"
            stroke="url(#gradMod)"
            strokeWidth="2.5"
            strokeDasharray="28.3 113.1"
            strokeLinecap="round"
          />
          {/* Puntito decorativo */}
          <circle
            cx="25"
            cy="8"
            r="2.5"
            fill={colors.secondary}
            className="spinner-dot"
            style={{ animationDelay: '0s' }}
          />
          <defs>
            <linearGradient id="gradMod" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" style={{ stopColor: colors.primary, stopOpacity: 1 }} />
              <stop offset="100%" style={{ stopColor: colors.secondary, stopOpacity: 1 }} />
            </linearGradient>
          </defs>
        </svg>
      </div>
    );
  }

  // Default variant
  return (
    <div className="flex items-center justify-center">
      <style>{`
        @keyframes spinnerPulse {
          0% {
            stroke-dashoffset: 0;
          }
          100% {
            stroke-dashoffset: 240;
          }
        }
        .spinner-default {
          animation: spinnerPulse 1.2s linear infinite;
        }
      `}</style>
      <svg
        width={size_px}
        height={size_px}
        viewBox="0 0 50 50"
        className="spinner-default"
      >
        <circle
          cx="25"
          cy="25"
          r="20"
          fill="none"
          stroke="url(#gradDefault)"
          strokeWidth="3"
          strokeLinecap="round"
          strokeDasharray="60 240"
        />
        <defs>
          <linearGradient id="gradDefault" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" style={{ stopColor: colors.primary, stopOpacity: 1 }} />
            <stop offset="100%" style={{ stopColor: colors.secondary, stopOpacity: 1 }} />
          </linearGradient>
        </defs>
      </svg>
    </div>
  );
}
