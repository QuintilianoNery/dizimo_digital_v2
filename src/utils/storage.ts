const PREFIX = 'dizimo_digital_';

export function storageGet<T>(key: string): T[] {
  try {
    const raw = localStorage.getItem(PREFIX + key);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function storageGetOne<T>(key: string): T | null {
  try {
    const raw = localStorage.getItem(PREFIX + key);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function storageSet<T>(key: string, data: T): void {
  localStorage.setItem(PREFIX + key, JSON.stringify(data));
}

export function storageSave<T extends { id: string }>(key: string, item: T): void {
  const items = storageGet<T>(key);
  const idx = items.findIndex((i) => i.id === item.id);
  if (idx >= 0) {
    items[idx] = item;
  } else {
    items.push(item);
  }
  storageSet(key, items);
}

export function storageDelete(key: string, id: string): void {
  const items = storageGet<{ id: string }>(key);
  storageSet(key, items.filter((i) => i.id !== id));
}

export function storageFind<T extends { id: string }>(key: string, id: string): T | null {
  const items = storageGet<T>(key);
  return items.find((i) => i.id === id) ?? null;
}

export function storageFilter<T>(key: string, predicate: (item: T) => boolean): T[] {
  return storageGet<T>(key).filter(predicate);
}

export const KEYS = {
  ADMIN: 'admin',
  PAROQUIAS: 'paroquias',
  CONFIGURACOES: 'configuracoes',
  CEBS: 'cebs',
  PASTORAIS: 'pastorais',
  CONSELHEIROS: 'conselheiros',
  DIZIMISTAS: 'dizimistas',
  DOACOES: 'doacoes',
  ALERTAS: 'alertas',
  AUTH_SESSION: 'auth_session',
  REMEMBER_LOGIN: 'remember_login',
} as const;
