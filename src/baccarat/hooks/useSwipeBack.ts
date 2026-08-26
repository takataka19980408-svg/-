import { useEffect } from 'react';

// 右方向へのスワイプで戻る。iOSは画面左端付近（だいたい20px以内）のタッチを
// システムのエッジジェスチャーとして横取りしてしまいJS側に届かないことが
// あるため、開始位置は画面左半分まで広く許容し、明確に横方向・右方向への
// 移動があった場合のみ発火させる（縦スクロールやタップとは区別する）。
const SWIPE_THRESHOLD = 80; // 戻る判定に必要な右方向の移動量
const HORIZONTAL_RATIO = 1.5; // 横方向の移動が縦方向の何倍以上あれば「横スワイプ」とみなすか

export function useSwipeBack(onBack: () => void) {
  useEffect(() => {
    let startX = 0;
    let startY = 0;
    let tracking = false;

    const handleTouchStart = (e: TouchEvent) => {
      const t = e.touches[0];
      tracking = t.clientX <= window.innerWidth * 0.6;
      startX = t.clientX;
      startY = t.clientY;
    };

    const handleTouchEnd = (e: TouchEvent) => {
      if (!tracking) return;
      tracking = false;
      const t = e.changedTouches[0];
      const dx = t.clientX - startX;
      const dy = Math.abs(t.clientY - startY);
      if (dx > SWIPE_THRESHOLD && dx > dy * HORIZONTAL_RATIO) onBack();
    };

    const handleTouchCancel = () => { tracking = false; };

    document.addEventListener('touchstart', handleTouchStart, { passive: true });
    document.addEventListener('touchend', handleTouchEnd, { passive: true });
    document.addEventListener('touchcancel', handleTouchCancel, { passive: true });
    return () => {
      document.removeEventListener('touchstart', handleTouchStart);
      document.removeEventListener('touchend', handleTouchEnd);
      document.removeEventListener('touchcancel', handleTouchCancel);
    };
  }, [onBack]);
}
