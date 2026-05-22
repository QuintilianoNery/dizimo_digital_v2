import { useEffect, useRef, useState } from 'react';

type StoredDraft<TForm, TTarget> = {
  modalOpen: boolean;
  editTarget: TTarget | null;
  form: TForm;
};

function readStoredDraft<TForm, TTarget>(storageKey: string, initialForm: TForm): StoredDraft<TForm, TTarget> | null {
  try {
    const raw = sessionStorage.getItem(storageKey);
    if (!raw) return null;

    const parsed = JSON.parse(raw) as Partial<StoredDraft<TForm, TTarget>>;
    if (typeof parsed.modalOpen !== 'boolean') return null;
    if (!('form' in parsed)) return null;

    return {
      modalOpen: parsed.modalOpen,
      editTarget: (parsed.editTarget ?? null) as TTarget | null,
      form: (parsed.form ?? initialForm) as TForm,
    };
  } catch {
    return null;
  }
}

export function usePersistentModalDraft<TForm, TTarget>(storageKey: string, initialForm: TForm) {
  const initialFormRef = useRef(initialForm);
  const [modalOpen, setModalOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<TTarget | null>(null);
  const [form, setForm] = useState<TForm>(initialForm);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    initialFormRef.current = initialForm;
  }, [initialForm]);

  useEffect(() => {
    const stored = readStoredDraft<TForm, TTarget>(storageKey, initialFormRef.current);
    if (stored) {
      setModalOpen(stored.modalOpen);
      setEditTarget(stored.editTarget);
      setForm(stored.form);
    }
    setHydrated(true);
  }, [storageKey]);

  useEffect(() => {
    if (!hydrated) return;

    try {
      if (modalOpen) {
        sessionStorage.setItem(storageKey, JSON.stringify({ modalOpen, editTarget, form }));
      } else {
        sessionStorage.removeItem(storageKey);
      }
    } catch {
      // If storage is unavailable, the modal still works without persistence.
    }
  }, [modalOpen, editTarget, form, hydrated, storageKey]);

  const clearDraft = () => {
    setModalOpen(false);
    setEditTarget(null);
    setForm(initialFormRef.current);

    try {
      sessionStorage.removeItem(storageKey);
    } catch {
      // Ignore storage errors.
    }
  };

  return {
    modalOpen,
    setModalOpen,
    editTarget,
    setEditTarget,
    form,
    setForm,
    clearDraft,
  };
}