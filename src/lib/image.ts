/**
 * 이미지 파일 → 압축된 JPEG data URL.
 * localStorage/문서에 원본을 넣으면 quota(≈5MB)를 넘겨 저장이 통째로 실패한다.
 * (예: 채팅 배경 사진 → "exceeded the quota" 에러) → 반드시 압축해서 저장.
 */
export async function compressImage(file: File, maxDim: number, quality = 0.72): Promise<string> {
  if (!file.type.startsWith('image/')) throw new Error('이미지 파일만 올릴 수 있어요');
  if (file.size > 30 * 1024 * 1024) throw new Error('30MB 이하 이미지만 가능해요');

  const bitmap = await createImageBitmap(file).catch(() => null);
  if (!bitmap) {
    // createImageBitmap 미지원 브라우저 폴백: 원본 그대로 (작으면 통과)
    return await fileToDataUrl(file);
  }
  const scale = Math.min(1, maxDim / Math.max(bitmap.width, bitmap.height));
  const w = Math.max(1, Math.round(bitmap.width * scale));
  const h = Math.max(1, Math.round(bitmap.height * scale));
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d');
  if (!ctx) return await fileToDataUrl(file);
  ctx.drawImage(bitmap, 0, 0, w, h);
  bitmap.close?.();
  return canvas.toDataURL('image/jpeg', quality);
}

function fileToDataUrl(file: File): Promise<string> {
  return new Promise((res, rej) => {
    const r = new FileReader();
    r.onload = () => res(String(r.result));
    r.onerror = rej;
    r.readAsDataURL(file);
  });
}

/** data URL 대략 바이트 수 */
export const dataUrlBytes = (s: string) => Math.ceil((s.length - (s.indexOf(',') + 1)) * 0.75);
