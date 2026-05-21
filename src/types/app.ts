// ============================================================================
// TIPOS DE APLICAÇÃO
// ============================================================================

export type UserRole = 'admin' | 'paroquial' | 'ceb';

export interface AppUser {
  id: string;
  email: string;
  nome: string;
  role: UserRole;
  // Dados específicos por role
  paroquiaId?: string;
  cebId?: string;
}

export interface AuthState {
  user: AppUser | null;
  isAuthenticated: boolean;
  loading: boolean;
}

export interface ToastMessage {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message?: string;
}

export interface PaginationParams {
  page: number;
  pageSize: number;
}

export interface ServiceResponse<T> {
  data: T | null;
  error: string | null;
}
