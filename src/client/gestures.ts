"use client";

import { useRouter } from "next/navigation";
import { type PointerEvent, type MouseEvent, useEffect, useRef } from "react";
import { type BusinessDate, shiftDate } from "@/lib/dates";

const HOLD_MS = 550;
/** A finger that moves this far is scrolling, not holding. */
const MOVE_PX = 10;

/**
 * Press and hold. Returns handlers for the element; the tap that ends a hold is
 * swallowed, so holding a link does not also open it.
 */
export function useLongPress(onHold: () => void) {
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const start = useRef<{ x: number; y: number } | null>(null);
  const held = useRef(false);

  const cancel = () => {
    if (timer.current) clearTimeout(timer.current);
    timer.current = null;
    start.current = null;
  };

  return {
    onPointerDown(e: PointerEvent) {
      if (e.button !== 0) return;
      held.current = false;
      start.current = { x: e.clientX, y: e.clientY };
      timer.current = setTimeout(() => {
        held.current = true;
        cancel();
        navigator.vibrate?.(30);
        onHold();
      }, HOLD_MS);
    },
    onPointerMove(e: PointerEvent) {
      const from = start.current;
      if (from && Math.hypot(e.clientX - from.x, e.clientY - from.y) > MOVE_PX) cancel();
    },
    onPointerUp: cancel,
    onPointerCancel: cancel,
    onPointerLeave: cancel,
    onClickCapture(e: MouseEvent) {
      if (!held.current) return;
      held.current = false;
      e.preventDefault();
      e.stopPropagation();
    },
    // Phones open their own menu on a long press of a link.
    onContextMenu(e: MouseEvent) {
      e.preventDefault();
    },
  };
}

const SWIPE_PX = 80;

/**
 * Swipe sideways on a day's screen to go to the day before (finger moves right)
 * or after (finger moves left), never past today. Ignores swipes that start in a
 * text box or a sideways-scrolling row, and mostly-vertical moves (scrolling).
 */
export function useDaySwipe(date: BusinessDate | null, today: BusinessDate | null) {
  const router = useRouter();
  useEffect(() => {
    if (!date || !today) return;
    let from: { x: number; y: number; at: number } | null = null;

    const onStart = (e: TouchEvent) => {
      const target = e.target instanceof Element ? e.target : null;
      if (e.touches.length !== 1 || target?.closest("input, textarea, select, [data-no-swipe]")) {
        from = null;
        return;
      }
      const touch = e.touches[0];
      from = { x: touch.clientX, y: touch.clientY, at: Date.now() };
    };
    const onEnd = (e: TouchEvent) => {
      if (!from) return;
      const touch = e.changedTouches[0];
      const dx = touch.clientX - from.x;
      const dy = touch.clientY - from.y;
      const quick = Date.now() - from.at < 700;
      from = null;
      if (!quick || Math.abs(dx) < SWIPE_PX || Math.abs(dy) > Math.abs(dx) / 2) return;
      const next = shiftDate(date, dx > 0 ? -1 : 1);
      if (next > today) return;
      router.push(next === today ? "/" : `/day/${next}`);
    };

    window.addEventListener("touchstart", onStart, { passive: true });
    window.addEventListener("touchend", onEnd, { passive: true });
    return () => {
      window.removeEventListener("touchstart", onStart);
      window.removeEventListener("touchend", onEnd);
    };
  }, [date, today, router]);
}
