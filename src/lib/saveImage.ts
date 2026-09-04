/** DOM 노드를 PNG 파일로 저장 (추억 카드·가계부 카드 공용). */
export async function saveNodeAsPng(node: HTMLElement, filename: string): Promise<void> {
  const html2canvas = (await import('html2canvas')).default;
  const canvas = await html2canvas(node, { backgroundColor: '#131019', scale: 2, logging: false });
  await new Promise<void>((resolve) => {
    canvas.toBlob((blob) => {
      if (blob) {
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = filename;
        a.click();
        setTimeout(() => URL.revokeObjectURL(a.href), 1000);
      }
      resolve();
    }, 'image/png');
  });
}
