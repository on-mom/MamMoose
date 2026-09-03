import { supabase } from './supabase';
import { useAppStore } from '../store/useAppStore';
import { compressImage } from './image';

/**
 * 사진 첨부.
 * - 클라우드 로그인 상태: Supabase Storage(trip-photos)에 업로드 → 공개 URL 저장
 * - 로컬(PIN) 모드: 강하게 압축한 data URL 저장 (문서에 직접 들어가므로 작게)
 */
const BUCKET = 'trip-photos';
const rnd = () => Math.random().toString(36).slice(2, 12);

function dataUrlToBlob(dataUrl: string): Blob {
  const [head, b64] = dataUrl.split(',');
  const mime = head.match(/:(.*?);/)?.[1] || 'image/jpeg';
  const bin = atob(b64);
  const arr = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) arr[i] = bin.charCodeAt(i);
  return new Blob([arr], { type: mime });
}

/** 파일 1장 → 저장된 참조(URL 또는 data URL). Storage 실패 시 압축 data URL 로 폴백. */
export async function uploadPhoto(file: File): Promise<string> {
  const uid = useAppStore.getState().cloudUser?.id;

  if (supabase && uid) {
    try {
      const dataUrl = await compressImage(file, 1400, 0.78);
      const blob = dataUrlToBlob(dataUrl);
      const path = `${uid}/${Date.now()}-${rnd()}.jpg`;
      const { error } = await supabase.storage.from(BUCKET).upload(path, blob, {
        contentType: 'image/jpeg',
        upsert: false,
      });
      if (error) throw error;
      return supabase.storage.from(BUCKET).getPublicUrl(path).data.publicUrl;
    } catch (e) {
      // 버킷 미생성·정책 등 → 앱이 막히지 않게 작게 압축해 문서에 저장
      console.warn('[photos] Storage 업로드 실패, 로컬 저장으로 폴백', e);
    }
  }

  return compressImage(file, 900, 0.6);
}

/** 저장소 URL이면 실제 파일도 삭제 (data URL은 그냥 참조만 제거) */
export async function deletePhoto(ref: string) {
  if (!supabase || !ref.startsWith('http')) return;
  const m = ref.match(new RegExp(`/${BUCKET}/(.+)$`));
  if (m) await supabase.storage.from(BUCKET).remove([m[1]]).catch(() => {});
}

export const isCloudPhoto = (ref: string) => ref.startsWith('http');
