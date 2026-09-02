import { useEffect } from 'react';
import { useAppStore } from '../store/useAppStore';

/** Cmd/Ctrl+Z = undo, Cmd/Ctrl+Shift+Z = redo */
export function useUndoRedoHotkeys() {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const mod = e.metaKey || e.ctrlKey;
      if (!mod || e.key.toLowerCase() !== 'z') return;
      e.preventDefault();
      const { undo, redo } = useAppStore.getState();
      e.shiftKey ? redo() : undo();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);
}
