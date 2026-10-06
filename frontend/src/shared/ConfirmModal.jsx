import React, { useState, useEffect } from 'react';
import { AlertCircle, AlertTriangle, Trash2, CheckCircle2, Loader2, HelpCircle, ShieldAlert } from 'lucide-react';
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
  isLoading = false,
  requireMatchText = '',
  inputLabel = '',
  inputPlaceholder = ''
}) {
  const [typedValue, setTypedValue] = useState('');

  useEffect(() => {
    if (isOpen) {
      setTypedValue('');
    }
  }, [isOpen, requireMatchText]);

  const isMatch = requireMatchText
    ? typedValue.trim().toLowerCase() === requireMatchText.trim().toLowerCase()
    : true;

  const Icon = CustomIcon || (requireMatchText ? ShieldAlert : variant === 'danger' ? Trash2 : variant === 'warning' ? AlertTriangle : HelpCircle);

  const confirmButtonClass = variant === 'danger'
    ? 'bg-rose-600 hover:bg-rose-500 text-white shadow-lg shadow-rose-950/50'
    : variant === 'warning'
    ? 'bg-amber-500 hover:bg-amber-400 text-black shadow-lg shadow-amber-950/50 font-black'
    : 'liquid-btn-primary';

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && isMatch && !isLoading) {
      e.preventDefault();
      onConfirm?.();
    }
  };

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
            disabled={isLoading || !isMatch}
            onClick={onConfirm}
            className={`px-5 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider flex items-center space-x-1.5 transition-all active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed ${confirmButtonClass}`}
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
      <div className="space-y-4 py-1">
        <p className="text-xs sm:text-sm text-zinc-300 leading-relaxed font-sans">
          {message}
        </p>

        {requireMatchText && (
          <div className="space-y-2 pt-2 border-t border-white/10">
            <label className="block text-xs font-medium text-zinc-300">
              {inputLabel || (
                <span>
                  Please type <span className="font-mono font-bold text-white bg-white/10 px-1.5 py-0.5 rounded select-all border border-white/20">{requireMatchText}</span> to confirm:
                </span>
              )}
            </label>
            <input
              type="text"
              autoFocus
              value={typedValue}
              onChange={(e) => setTypedValue(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={isLoading}
              placeholder={inputPlaceholder || `Type "${requireMatchText}" here`}
              className="w-full px-3.5 py-2.5 rounded-xl bg-black/60 border border-white/20 text-white font-mono text-xs sm:text-sm focus:outline-none focus:border-rose-500 focus:ring-1 focus:ring-rose-500 transition-all placeholder:text-zinc-600"
            />
            {typedValue.length > 0 && !isMatch && (
              <p className="text-[11px] text-rose-400 font-mono flex items-center space-x-1 animate-fade-in">
                <AlertCircle className="w-3 h-3 flex-shrink-0" />
                <span>Name does not match yet</span>
              </p>
            )}
            {isMatch && typedValue.trim().length > 0 && (
              <p className="text-[11px] text-emerald-400 font-mono flex items-center space-x-1 animate-fade-in">
                <CheckCircle2 className="w-3 h-3 flex-shrink-0" />
                <span>Name verified. You may proceed with deletion.</span>
              </p>
            )}
          </div>
        )}
      </div>
    </CustomModal>
  );
}
