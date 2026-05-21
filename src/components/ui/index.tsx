import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  forwardRef,
  ButtonHTMLAttributes,
  InputHTMLAttributes,
  SelectHTMLAttributes,
  TextareaHTMLAttributes,
} from 'react';
import { X, CheckCircle, AlertCircle, AlertTriangle, Info } from 'lucide-react';
import { v4 as uuid } from 'uuid';
import type { ToastMessage } from '@/types';

// ============================================================================
// TOAST SYSTEM
// ============================================================================

interface ToastContextValue {
  success: (title: string, msg?: string) => void;
  error: (title: string, msg?: string) => void;
  warning: (title: string, msg?: string) => void;
  info: (title: string, msg?: string) => void;
}

const ToastContext = createContext<ToastContextValue | undefined>(undefined);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const add = useCallback((type: ToastMessage['type'], title: string, message?: string) => {
    const id = uuid();
    setToasts((prev) => [...prev, { id, type, title, message }]);
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 5000);
  }, []);

  const remove = (id: string) => setToasts((prev) => prev.filter((t) => t.id !== id));

  const icons = { success: CheckCircle, error: AlertCircle, warning: AlertTriangle, info: Info };
  const colors = {
    success: 'var(--green)',
    error: 'var(--red)',
    warning: 'var(--amber)',
    info: 'var(--blue)',
  };

  return (
    <ToastContext.Provider
      value={{
        success: (t, m) => add('success', t, m),
        error: (t, m) => add('error', t, m),
        warning: (t, m) => add('warning', t, m),
        info: (t, m) => add('info', t, m),
      }}
    >
      {children}
      <div style={{ position: 'fixed', top: 16, right: 16, zIndex: 9999, display: 'flex', flexDirection: 'column', gap: 8 }}>
        {toasts.map((t) => {
          const Icon = icons[t.type];
          return (
            <div
              key={t.id}
              style={{
                display: 'flex',
                gap: 12,
                alignItems: 'flex-start',
                background: 'var(--surface)',
                border: `1px solid var(--border)`,
                borderLeft: `4px solid ${colors[t.type]}`,
                borderRadius: 8,
                padding: '12px 16px',
                minWidth: 300,
                maxWidth: 400,
                boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                animation: 'slideIn .2s ease',
              }}
            >
              <Icon size={18} color={colors[t.type]} style={{ flexShrink: 0, marginTop: 2 }} />
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 600, fontSize: 13, color: 'var(--text-1)' }}>{t.title}</div>
                {t.message && <div style={{ fontSize: 12, color: 'var(--text-3)', marginTop: 2 }}>{t.message}</div>}
              </div>
              <button onClick={() => remove(t.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-3)', padding: 0 }}>
                <X size={14} />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast deve ser usado dentro de <ToastProvider>');
  return ctx;
}

// ============================================================================
// BUTTON
// ============================================================================

type ButtonVariant = 'primary' | 'secondary' | 'danger' | 'ghost';
type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  icon?: React.ReactNode;
}

const btnStyles: Record<ButtonVariant, React.CSSProperties> = {
  primary: { background: 'var(--brand)', color: '#fff', border: '1px solid var(--brand)' },
  secondary: { background: 'var(--surface-2)', color: 'var(--text-1)', border: '1px solid var(--border)' },
  danger: { background: 'var(--red)', color: '#fff', border: '1px solid var(--red)' },
  ghost: { background: 'transparent', color: 'var(--text-2)', border: '1px solid transparent' },
};

const sizeStyles: Record<ButtonSize, React.CSSProperties> = {
  sm: { padding: '6px 12px', fontSize: 12, height: 30 },
  md: { padding: '8px 16px', fontSize: 13, height: 36 },
  lg: { padding: '10px 20px', fontSize: 14, height: 42 },
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = 'primary', size = 'md', loading, icon, children, style, disabled, ...props }, ref) => (
    <button
      ref={ref}
      disabled={disabled || loading}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 6,
        borderRadius: 6,
        fontWeight: 500,
        cursor: disabled || loading ? 'not-allowed' : 'default',
        opacity: disabled ? 0.6 : 1,
        transition: 'opacity .15s, box-shadow .15s',
        ...btnStyles[variant],
        ...sizeStyles[size],
        ...style,
      }}
      {...props}
    >
      {loading ? <Spinner size={14} /> : icon}
      {children}
    </button>
  )
);

// ============================================================================
// INPUT
// ============================================================================

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, hint, id, style, ...props }, ref) => {
    const inputId = id ?? label?.toLowerCase().replace(/\s+/g, '-');
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
        {label && (
          <label htmlFor={inputId} style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-2)' }}>
            {label}
          </label>
        )}
        <input
          ref={ref}
          id={inputId}
          style={{
            height: 36,
            padding: '0 12px',
            borderRadius: 6,
            border: `1px solid ${error ? 'var(--red)' : 'var(--border)'}`,
            background: 'var(--surface)',
            color: 'var(--text-1)',
            fontSize: 13,
            outline: 'none',
            ...style,
          }}
          {...props}
        />
        {error && <span style={{ fontSize: 11, color: 'var(--red)' }}>{error}</span>}
        {hint && !error && <span style={{ fontSize: 11, color: 'var(--text-3)' }}>{hint}</span>}
      </div>
    );
  }
);

// ============================================================================
// SELECT
// ============================================================================

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  options: { value: string; label: string }[];
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ label, error, options, id, style, ...props }, ref) => {
    const selectId = id ?? label?.toLowerCase().replace(/\s+/g, '-');
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
        {label && (
          <label htmlFor={selectId} style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-2)' }}>
            {label}
          </label>
        )}
        <select
          ref={ref}
          id={selectId}
          style={{
            height: 36,
            padding: '0 12px',
            borderRadius: 6,
            border: `1px solid ${error ? 'var(--red)' : 'var(--border)'}`,
            background: 'var(--surface)',
            color: 'var(--text-1)',
            fontSize: 13,
            ...style,
          }}
          {...props}
        >
          {options.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
        {error && <span style={{ fontSize: 11, color: 'var(--red)' }}>{error}</span>}
      </div>
    );
  }
);

// ============================================================================
// TEXTAREA
// ============================================================================

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ label, error, id, style, ...props }, ref) => {
    const taId = id ?? label?.toLowerCase().replace(/\s+/g, '-');
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
        {label && (
          <label htmlFor={taId} style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-2)' }}>
            {label}
          </label>
        )}
        <textarea
          ref={ref}
          id={taId}
          style={{
            padding: '8px 12px',
            borderRadius: 6,
            border: `1px solid ${error ? 'var(--red)' : 'var(--border)'}`,
            background: 'var(--surface)',
            color: 'var(--text-1)',
            fontSize: 13,
            resize: 'vertical',
            minHeight: 80,
            ...style,
          }}
          {...props}
        />
        {error && <span style={{ fontSize: 11, color: 'var(--red)' }}>{error}</span>}
      </div>
    );
  }
);

// ============================================================================
// MODAL
// ============================================================================

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  width?: number;
}

export function Modal({ open, onClose, title, children, footer, width = 480 }: ModalProps) {
  if (!open) return null;
  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, background: 'rgba(0,0,0,.5)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        zIndex: 1000, padding: 16,
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: 'var(--surface)',
          borderRadius: 10,
          width: '100%',
          maxWidth: width,
          maxHeight: '90vh',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 20px 60px rgba(0,0,0,.3)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px', borderBottom: '1px solid var(--border)' }}>
          <h3 style={{ margin: 0, fontSize: 15, fontWeight: 600, color: 'var(--text-1)' }}>{title}</h3>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-3)', padding: 4 }}>
            <X size={18} />
          </button>
        </div>
        <div style={{ padding: '20px', overflowY: 'auto', flex: 1 }}>{children}</div>
        {footer && (
          <div style={{ padding: '12px 20px', borderTop: '1px solid var(--border)', display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}

// ============================================================================
// BADGE
// ============================================================================

type BadgeColor = 'green' | 'red' | 'amber' | 'blue' | 'gray';

interface BadgeProps {
  color?: BadgeColor;
  children: React.ReactNode;
}

const badgeColors: Record<BadgeColor, { bg: string; text: string }> = {
  green: { bg: 'rgba(34,197,94,.15)', text: 'var(--green)' },
  red: { bg: 'rgba(239,68,68,.15)', text: 'var(--red)' },
  amber: { bg: 'rgba(245,158,11,.15)', text: 'var(--amber)' },
  blue: { bg: 'rgba(59,130,246,.15)', text: 'var(--blue)' },
  gray: { bg: 'var(--surface-2)', text: 'var(--text-3)' },
};

export function Badge({ color = 'gray', children }: BadgeProps) {
  const { bg, text } = badgeColors[color];
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center',
      padding: '2px 8px', borderRadius: 99,
      fontSize: 11, fontWeight: 600,
      background: bg, color: text,
    }}>
      {children}
    </span>
  );
}

// ============================================================================
// CARD
// ============================================================================

export function Card({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return (
    <div style={{
      background: 'var(--surface)',
      border: '1px solid var(--border)',
      borderRadius: 10,
      padding: 20,
      ...style,
    }}>
      {children}
    </div>
  );
}

// ============================================================================
// SPINNER
// ============================================================================

export function Spinner({ size = 20 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" style={{ animation: 'spin 1s linear infinite' }}>
      <circle cx="12" cy="12" r="10" fill="none" stroke="currentColor" strokeWidth="3" strokeDasharray="40" strokeDashoffset="15" />
    </svg>
  );
}

// ============================================================================
// EMPTY STATE
// ============================================================================

export function EmptyState({ icon, title, description }: { icon?: React.ReactNode; title: string; description?: string }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '48px 24px', gap: 8, color: 'var(--text-3)' }}>
      {icon && <div style={{ marginBottom: 8, opacity: 0.5 }}>{icon}</div>}
      <p style={{ margin: 0, fontWeight: 600, fontSize: 14, color: 'var(--text-2)' }}>{title}</p>
      {description && <p style={{ margin: 0, fontSize: 12 }}>{description}</p>}
    </div>
  );
}

// ============================================================================
// CONFIRM DIALOG
// ============================================================================

interface ConfirmProps {
  open: boolean;
  title: string;
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
  loading?: boolean;
}

export function ConfirmDialog({ open, title, message, onConfirm, onCancel, loading }: ConfirmProps) {
  return (
    <Modal open={open} onClose={onCancel} title={title} width={380}
      footer={
        <>
          <Button variant="secondary" size="sm" onClick={onCancel} disabled={loading}>Cancelar</Button>
          <Button variant="danger" size="sm" onClick={onConfirm} loading={loading}>Confirmar</Button>
        </>
      }
    >
      <p style={{ margin: 0, fontSize: 13, color: 'var(--text-2)' }}>{message}</p>
    </Modal>
  );
}
