import React from 'react';
import { AlertCircle, AlertTriangle, Trash2, CheckCircle2, Loader2, HelpCircle } from 'lucide-react';
import CustomModal from './CustomModal';

export default function ConfirmModal({
  isOpen = false,
  onClose,
  onConfirm,
  title = 'Confirm Action',
  subtitle = 'Confirmation Required',
  message = 'Are you sure you want to proceed with this action?',
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  variant = 'danger', // 'danger' | 'primary' | 'warning'
  icon: CustomIcon,
  isLoading = false
}) {
  const Icon = CustomIcon || (variant === 'danger' ? Trash2 : variant === 'warning' ? AlertTriangle : HelpCircle);

  const confirmButtonClass = variant === 'danger'
    ? 'bg-rose-600 hover:bg-rose-500 text-white shadow-lg shadow-rose-950/50'
    : variant === 'warning'
    ? 'bg-amber-500 hover:bg-amber-400 text-black shadow-lg shadow-amber-950/50 font-black'
    : 'liquid-btn-primary';

  return (
    <CustomModal
      isOpen={isOpen}
      onClose={isLoading ? undefined : onClose}
      title={title}
      subtitle={subtitle}
      icon={Icon}
      size="md"
      showCloseButton={!isLoading}
      closeOnBackdrop={!isLoading}
      closeOnEsc={!isLoading}
      footer={
        <div className="flex items-center space-x-2.5 w-full justify-end">
          <button
            type="button"
            disabled={isLoading}
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl text-xs font-bold text-zinc-300 hover:text-white bg-white/5 hover:bg-white/10 border border-white/10 transition-all uppercase tracking-wider disabled:opacity-50"
          >
            {cancelText}
          </button>
          <button
            type="button"
            disabled={isLoading}
            onClick={onConfirm}
            className={`px-5 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider flex items-center space-x-1.5 transition-all active:scale-95 disabled:opacity-50 ${confirmButtonClass}`}
          >
            {isLoading ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>Processing...</span>
              </>
            ) : (
              <span>{confirmText}</span>
            )}
          </button>
        </div>
      }
    >
      <div className="space-y-3 py-1">
        <p className="text-xs sm:text-sm text-zinc-300 leading-relaxed font-sans">
          {message}
        </p>
      </div>
    </CustomModal>
  );
}
