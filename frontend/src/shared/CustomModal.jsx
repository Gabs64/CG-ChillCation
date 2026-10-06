import React, { useEffect } from 'react';
import { X } from 'lucide-react';

const SIZE_CLASSES = {
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-lg',
  xl: 'max-w-xl',
  '2xl': 'max-w-2xl',
  '3xl': 'max-w-3xl',
  '4xl': 'max-w-4xl',
  '5xl': 'max-w-5xl',
  full: 'max-w-[96vw] sm:max-w-[92vw] lg:max-w-7xl'
};

export default function CustomModal({
  isOpen = false,
  onClose,
  title,
  subtitle,
  badge,
  icon: Icon,
  customHeader,
  size = '2xl',
  children,
  footer,
  showCloseButton = true,
  closeOnBackdrop = true,
  closeOnEsc = true,
  className = '',
  bodyClassName = '',
  headerClassName = ''
}) {
  // Prevent background scrolling when modal is open & listen for ESC key
  useEffect(() => {
    if (!isOpen) return;

    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const handleKeyDown = (e) => {
      if (closeOnEsc && e.key === 'Escape' && onClose) {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.style.overflow = originalOverflow;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, closeOnEsc, onClose]);

  if (!isOpen) return null;

  const maxWidthClass = SIZE_CLASSES[size] || SIZE_CLASSES['2xl'];

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3.5 sm:p-5 md:p-6 bg-black/85 backdrop-blur-xl animate-fade-in overflow-y-auto"
      onClick={(e) => {
        if (closeOnBackdrop && e.target === e.currentTarget && onClose) {
          onClose();
        }
      }}
      role="dialog"
      aria-modal="true"
    >
      <div
        className={`relative w-full ${maxWidthClass} liquid-glass border border-white/20 rounded-3xl overflow-hidden shadow-2xl animate-modal-pop my-auto max-h-[92vh] flex flex-col ${className}`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Uniform Close Button */}
        {showCloseButton && onClose && (
          <button
            onClick={onClose}
            aria-label="Close Modal"
            className="absolute top-4 right-4 z-30 p-2 rounded-full bg-white/5 hover:bg-white text-zinc-300 hover:text-black border border-white/10 hover:border-white transition-all shadow-lg group active:scale-90"
          >
            <X className="w-4 h-4 transition-transform group-hover:rotate-90 duration-200" />
          </button>
        )}

        {/* Custom or Standard Header */}
        {customHeader ? (
          <div className={`px-6 pt-6 pb-4 sm:px-8 sm:pt-8 sm:pb-5 border-b border-white/10 flex-shrink-0 relative ${headerClassName}`}>
            {customHeader}
          </div>
        ) : (title || subtitle || badge) ? (
          <div className={`px-6 pt-6 pb-4 sm:px-8 sm:pt-8 sm:pb-5 border-b border-white/10 flex-shrink-0 relative ${headerClassName}`}>
            <div className="flex items-start justify-between gap-4 pr-8">
              <div className="space-y-1">
                {subtitle && (
                  <span className="text-[10px] font-mono uppercase tracking-widest text-emerald-400 block font-bold">
                    {subtitle}
                  </span>
                )}
                <div className="flex items-center space-x-2.5">
                  {Icon && (
                    <div className="w-7 h-7 rounded-xl bg-white/10 flex items-center justify-center text-white border border-white/10 flex-shrink-0">
                      <Icon className="w-4 h-4" />
                    </div>
                  )}
                  {title && (
                    <h3 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                      {title}
                    </h3>
                  )}
                </div>
              </div>

              {badge && (
                <div className="flex-shrink-0 mt-0.5">
                  {badge}
                </div>
              )}
            </div>
          </div>
        ) : null}

        {/* Modal Scrollable Body */}
        <div className={`p-6 sm:p-8 flex-1 overflow-y-auto no-scrollbar space-y-4 ${bodyClassName}`}>
          {children}
        </div>

        {/* Modal Optional Footer */}
        {footer && (
          <div className="px-6 py-4 sm:px-8 sm:py-5 border-t border-white/10 bg-black/40 flex-shrink-0 flex items-center justify-end gap-2.5">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}
