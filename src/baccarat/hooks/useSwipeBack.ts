import { useEffect, useRef, useState } from 'react';

// 右方向へのスワイプで戻る。iOSは画面左端付近（だいたい20px以内）のタッチを
// システムのエッジジェスチャーとして横取りしてしまいJS側に届かないことが
// あるため、開始位置は画面左半分まで広く許容し、明確に横方向・右方向への
// 移動があった場合のみ発火させる（縦スクロールやタップとは区別する）。
// 指の動きに合わせて画面をリアルタイムに追従させ、離したときに戻る／
// 元の位置へ戻るをスムーズにアニメーションさせる。
const SWIPE_THRESHOLD = 80; // 戻る判定に必要な右方向の移動量
const HORIZONTAL_RATIO = 3; // 横方向の移動が縦方向の何倍以上あれば「横スワイプ」とみなすか（厳しめ）
const MAX_VERTICAL = 40; // これを超えて縦にずれたら、確定後でも横スワイプ扱いをやめる
const CONFIRM_DISTANCE = 10; // 横スワイプかどうかを確定させるまでの遊び（この間は追従しない）
const ANIM_MS = 220;

export function useSwipeBack(onBack: () => void) {
  const [dragX, setDragX] = useState(0);
  const [transitioning, setTransitioning] = useState(false);
  const onBackRef = useRef(onBack);
  useEffect(() => { onBackRef.current = onBack; });

  useEffect(() => {
    const width = () => window.innerWidth;
    const state = { startX: 0, startY: 0, tracking: false, confirmed: false, busy: false };

    const handleTouchStart = (e: TouchEvent) => {
      if (state.busy) return;
      const t = e.touches[0];
      state.tracking = t.clientX <= width() * 0.6;
      state.confirmed = false;
      state.startX = t.clientX;
      state.startY = t.clientY;
    };

    const cancelDrag = () => {
      state.tracking = false;
      state.confirmed = false;
      state.busy = true;
      setTransitioning(true);
      setDragX(0);
      setTimeout(() => { setTransitioning(false); state.busy = false; }, ANIM_MS);
    };

    const isHorizontal = (dx: number, dy: number) =>
      dx > 0 && Math.abs(dy) <= MAX_VERTICAL && dx > Math.abs(dy) * HORIZONTAL_RATIO;

    const handleTouchMove = (e: TouchEvent) => {
      if (!state.tracking) return;
      const t = e.touches[0];
      const dx = t.clientX - state.startX;
      const dy = t.clientY - state.startY;
      if (!state.confirmed) {
        if (Math.abs(dx) < CONFIRM_DISTANCE && Math.abs(dy) < CONFIRM_DISTANCE) return;
        if (!isHorizontal(dx, dy)) {
          state.tracking = false; // 縦方向優勢 → スクロールに譲る
          return;
        }
        state.confirmed = true;
      } else if (!isHorizontal(dx, dy)) {
        // 確定後に縦方向へそれたら、追従をやめて元の位置に戻す
        cancelDrag();
        return;
      }
      setDragX(Math.min(Math.max(0, dx), width()));
    };

    const release = (dx: number) => {
      if (!state.confirmed) { state.tracking = false; return; }
      state.tracking = false;
      state.confirmed = false;
      state.busy = true;
      setTransitioning(true);
      if (dx > SWIPE_THRESHOLD) {
        setDragX(width());
        setTimeout(() => onBackRef.current(), ANIM_MS);
      } else {
        setDragX(0);
        setTimeout(() => { setTransitioning(false); state.busy = false; }, ANIM_MS);
      }
    };

    const handleTouchEnd = (e: TouchEvent) => {
      const t = e.changedTouches[0];
      release(t.clientX - state.startX);
    };

    const handleTouchCancel = () => release(-1);

    document.addEventListener('touchstart', handleTouchStart, { passive: true });
    document.addEventListener('touchmove', handleTouchMove, { passive: true });
    document.addEventListener('touchend', handleTouchEnd, { passive: true });
    document.addEventListener('touchcancel', handleTouchCancel, { passive: true });
    return () => {
      document.removeEventListener('touchstart', handleTouchStart);
      document.removeEventListener('touchmove', handleTouchMove);
      document.removeEventListener('touchend', handleTouchEnd);
      document.removeEventListener('touchcancel', handleTouchCancel);
    };
  }, []);

  return {
    transform: dragX ? `translateX(${dragX}px)` : undefined,
    transition: transitioning ? `transform ${ANIM_MS}ms ease-out` : undefined,
    willChange: 'transform',
  } as const;
}
