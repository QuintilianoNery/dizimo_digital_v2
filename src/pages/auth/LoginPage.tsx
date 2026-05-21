import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Church, Eye, EyeOff, ShieldCheck } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import type { UserRole } from '@/types';

interface LoginFormProps {
  expectedRole?: UserRole | UserRole[];
  title: string;
  subtitle: string;
  redirectPath: string;
  isAdmin?: boolean;
}

function LoginForm({ expectedRole, title, subtitle, redirectPath, isAdmin }: LoginFormProps) {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Preencha e-mail e senha.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      await login(email, password, expectedRole);
      navigate(redirectPath);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Erro ao entrar.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'var(--bg)',
      padding: 16,
    }}>
      <div style={{
        width: '100%',
        maxWidth: 380,
        background: 'var(--surface)',
        borderRadius: 12,
        border: '1px solid var(--border)',
        padding: 32,
        boxShadow: '0 4px 24px rgba(0,0,0,.08)',
      }}>
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <div style={{
            width: 56, height: 56, borderRadius: 14,
            background: isAdmin ? 'var(--brand-dark)' : 'var(--brand)',
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
            marginBottom: 12,
          }}>
            {isAdmin ? <ShieldCheck size={28} color="#fff" /> : <Church size={28} color="#fff" />}
          </div>
          <h1 style={{ margin: 0, fontSize: 20, fontWeight: 700, color: 'var(--text-1)' }}>{title}</h1>
          <p style={{ margin: '4px 0 0', fontSize: 13, color: 'var(--text-3)' }}>{subtitle}</p>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Email */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-2)' }}>E-mail</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="seu@email.com"
              autoComplete="email"
              disabled={loading}
              style={{
                height: 40, padding: '0 12px', borderRadius: 6,
                border: '1px solid var(--border)',
                background: 'var(--surface)', color: 'var(--text-1)', fontSize: 14,
                outline: 'none',
              }}
            />
          </div>

          {/* Password */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-2)' }}>Senha</label>
            <div style={{ position: 'relative' }}>
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                autoComplete="current-password"
                disabled={loading}
                style={{
                  height: 40, padding: '0 40px 0 12px', borderRadius: 6,
                  border: '1px solid var(--border)', width: '100%',
                  background: 'var(--surface)', color: 'var(--text-1)', fontSize: 14,
                  outline: 'none', boxSizing: 'border-box',
                }}
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                style={{
                  position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)',
                  background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-3)',
                  padding: 4,
                }}
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          {/* Error */}
          {error && (
            <div style={{
              padding: '10px 14px', borderRadius: 6,
              background: 'rgba(239,68,68,.1)', border: '1px solid rgba(239,68,68,.3)',
              color: 'var(--red)', fontSize: 13,
            }}>
              {error}
            </div>
          )}

          {/* Submit */}
          <button
            type="submit"
            disabled={loading}
            style={{
              height: 40, borderRadius: 6, border: 'none',
              background: isAdmin ? 'var(--brand-dark)' : 'var(--brand)',
              color: '#fff', fontSize: 14, fontWeight: 600,
              cursor: loading ? 'not-allowed' : 'pointer',
              opacity: loading ? 0.7 : 1,
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
            }}
          >
            {loading ? 'Entrando...' : 'Entrar'}
          </button>
        </form>

        {/* Switch login type */}
        <div style={{ marginTop: 20, textAlign: 'center' }}>
          {isAdmin ? (
            <a href="/login" style={{ fontSize: 12, color: 'var(--brand)', textDecoration: 'none' }}>
              ← Acesso para Paróquias / CEBs
            </a>
          ) : (
            <a href="/admin/login" style={{ fontSize: 12, color: 'var(--text-3)', textDecoration: 'none' }}>
              Acesso Administrativo
            </a>
          )}
        </div>
      </div>
    </div>
  );
}

export function LoginPage() {
  return (
    <LoginForm
      expectedRole={['paroquial', 'ceb']}
      title="Dízimo Digital"
      subtitle="Paróquias e Comunidades (CEBs)"
      redirectPath="/paroquial/dashboard"
    />
  );
}

export function AdminLoginPage() {
  return (
    <LoginForm
      expectedRole="admin"
      title="Administração"
      subtitle="Acesso restrito ao administrador do sistema"
      redirectPath="/admin/dashboard"
      isAdmin
    />
  );
}
