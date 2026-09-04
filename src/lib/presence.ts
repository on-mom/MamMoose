import { useEffect, useRef, useState } from 'react';
import type { RealtimeChannel } from '@supabase/supabase-js';
import { supabase } from './supabase';
import { useAppStore } from '../store/useAppStore';
import { getMyName } from './members';

export interface Peer { userId: string; name: string; editing: boolean }

const isCloudId = (id: string) => /^[0-9a-f]{8}-[0-9a-f]{4}-/.test(id);

/**
 * 이 여행을 지금 함께 보고 있는 다른 사람들 (Supabase Realtime Presence).
 * @param editing 내가 편집 모드인지 — 상대 화면에 "편집 중" 으로 표시됨
 */
export function useTripPresence(editing: boolean): Peer[] {
  const tripId = useAppStore((s) => s.activeProjectId);
  const myId = useAppStore((s) => s.cloudUser?.id);
  const [peers, setPeers] = useState<Peer[]>([]);
  const chRef = useRef<RealtimeChannel | null>(null);
  const editingRef = useRef(editing);

  useEffect(() => {
    const sb = supabase;
    if (!sb || !myId || !isCloudId(tripId)) { setPeers([]); return; }
    const ch = sb.channel(`presence:trip:${tripId}`, { config: { presence: { key: myId } } });
    chRef.current = ch;

    const sync = () => {
      const state = ch.presenceState() as Record<string, Array<{ name?: string; editing?: boolean }>>;
      const list: Peer[] = [];
      for (const [uid, metas] of Object.entries(state)) {
        if (uid === myId) continue;
        const m = metas[metas.length - 1] ?? {};
        list.push({ userId: uid, name: m.name || '동행자', editing: !!m.editing });
      }
      setPeers(list);
    };

    ch.on('presence', { event: 'sync' }, sync)
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') ch.track({ name: getMyName(), editing: editingRef.current });
      });

    return () => { chRef.current = null; sb.removeChannel(ch); };
  }, [tripId, myId]);

  // 편집 모드 토글 시 내 presence 갱신
  useEffect(() => {
    editingRef.current = editing;
    chRef.current?.track({ name: getMyName(), editing });
  }, [editing]);

  return peers;
}
