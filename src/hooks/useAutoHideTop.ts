import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";

// ------------------------------------
// SETTINGS
// ------------------------------------

// Работаем только на небольших экранах
// с мышью или тачпадом.
const COMPACT_SCREEN = `
  (min-width: 768px)
  and (max-width: 1800px)
  and (hover: hover)
  and (pointer: fine)
`;

// Насколько близко к верхнему краю
// нужно подвести курсор, чтобы
// вернуть Header и календарь.
const SHOW_TOP_PX = 14;

// ------------------------------------
// HOOK
// ------------------------------------

export function useAutoHideTop() {
  const { pathname } = useLocation();

  const [hidden, setHidden] = useState(false);

  useEffect(() => {
    const media = window.matchMedia(COMPACT_SCREEN);

    let hideTimeout: ReturnType<typeof setTimeout> | null = null;

    // Отменяем запланированное скрытие
    function clearHideTimeout() {
      if (hideTimeout !== null) {
        clearTimeout(hideTimeout);
        hideTimeout = null;
      }
    }

    // Показываем верхнюю часть сайта
    function showTop() {
      clearHideTimeout();
      setHidden(false);
    }

    function handlePointerMove(event: PointerEvent) {
      // Не используем скрытие:
      // - на больших мониторах
      // - на устройствах без мыши
      // - на других страницах
      if (
        !media.matches ||
        event.pointerType !== "mouse" ||
        (pathname !== "/" && pathname !== "/statistics")
      ) {
        showTop();
        return;
      }

      // Не меняем интерфейс во время
      // работы с модальными окнами.
      const modalOpen = document.querySelector(
        '[role="dialog"][aria-modal="true"]'
      );

      if (modalOpen) {
        clearHideTimeout();
        return;
      }

      const cursorY = event.clientY;

      // ------------------------------------
      // SHOW: только у самого верха
      // ------------------------------------

      if (cursorY <= SHOW_TOP_PX) {
        showTop();
        return;
      }

      // ------------------------------------
      // HIDE: курсор в нижней части
      // ------------------------------------

      const hideFromY = Math.max(
        280,
        window.innerHeight * 0.46
      );

      if (cursorY >= hideFromY) {
        // Небольшая задержка защищает
        // от случайного скрытия.
        if (hideTimeout === null) {
          hideTimeout = setTimeout(() => {
            setHidden(true);
            hideTimeout = null;
          }, 120);
        }
      } else {
        clearHideTimeout();
      }
    }

    // При изменении размера экрана
    // возвращаем обычный интерфейс.
    function handleMediaChange() {
      showTop();
    }

    window.addEventListener(
      "pointermove",
      handlePointerMove,
      { passive: true }
    );

    media.addEventListener(
      "change",
      handleMediaChange
    );

    return () => {
      clearHideTimeout();

      window.removeEventListener(
        "pointermove",
        handlePointerMove
      );

      media.removeEventListener(
        "change",
        handleMediaChange
      );
    };
  }, [pathname]);

  return (
    (pathname === "/" ||
      pathname === "/statistics") &&
    hidden
  );
}