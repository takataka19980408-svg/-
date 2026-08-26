import { useEffect } from 'react';

// 画面左端付近から右方向へスワイプしたら戻る（iOSのエッジスワイプに近い操作）。
const EDGE_WIDTH = 40; // この範囲内で始まったタッチのみ対象にする
const SWIPE_THRESHOLD = 80; // 戻る判定に必要な右方向の移動量
const MAX_VERTICAL_DRIFT = 60; // 縦方向のブレの許容量（スクロールと区別する）

export function useSwipeBack(onBack: () => void) {
  useEffect(() => {
    let startX = 0;
    let startY = 0;
    let tracking = false;

    const handleTouchStart = (e: TouchEvent) => {
      const t = e.touches[0];
      tracking = t.clientX <= EDGE_WIDTH;
      startX = t.clientX;
      startY = t.clientY;
    };

    const handleTouchEnd = (e: TouchEvent) => {
      if (!tracking) return;
      tracking = false;
      const t = e.changedTouches[0];
      const dx = t.clientX - startX;
      const dy = Math.abs(t.clientY - startY);
      if (dx > SWIPE_THRESHOLD && dy < MAX_VERTICAL_DRIFT) onBack();
    };

    document.addEventListener('touchstart', handleTouchStart, { passive: true });
    document.addEventListener('touchend', handleTouchEnd, { passive: true });
    return () => {
      document.removeEventListener('touchstart', handleTouchStart);
      document.removeEventListener('touchend', handleTouchEnd);
    };
  }, [onBack]);
}
