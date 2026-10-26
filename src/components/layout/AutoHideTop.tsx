import type { ReactNode } from "react";

import {
  motion,
  useReducedMotion,
} from "motion/react";

import { useAutoHideTop } from "../../hooks/useAutoHideTop";

// ------------------------------------
// TYPES
// ------------------------------------

interface AutoHideTopProps {
  children: ReactNode;
}

// ------------------------------------
// COMPONENT
// ------------------------------------

export default function AutoHideTop({
  children,
}: AutoHideTopProps) {
  const hidden = useAutoHideTop();

  const reducedMotion = useReducedMotion();

  return (
    <motion.div
      className="w-full min-w-0"

      // Без анимации при первой загрузке.
      initial={false}

      // Плавное исчезновение и появление.
      animate={{
        height: hidden ? 0 : "auto",
        opacity: hidden ? 0 : 1,
        y: hidden ? -18 : 0,
      }}

      // Настройки анимации.
      transition={{
        duration: reducedMotion ? 0 : 0.42,
        ease: [0.22, 1, 0.36, 1],
      }}

      // Скрытые элементы не должны
      // реагировать на клики мышью.
      aria-hidden={hidden}

      style={{
        overflow: "hidden",
        pointerEvents: hidden ? "none" : "auto",
      }}
    >
      {children}
    </motion.div>
  );
}
