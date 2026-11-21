import type { RefObject } from "react";
import {
  useEffect, useState,
} from "react";

type HorizontalOverflow = {
  /** The content is wider than its scroll container. */
  overflows: boolean;
  /** Scrolled all the way right (or nothing to scroll). */
  atEnd: boolean;
};

/**
 * Tracks whether the element's scroll container overflows sideways, at any
 * viewport width. Pass a ref to the scrolled content: for the shadcn `Table`
 * that is the `<table>` itself, since the primitive wraps it in its own
 * `overflow-auto` div, which is the element that actually scrolls.
 */
export function useHorizontalOverflow(contentRef: RefObject<HTMLElement | null>): HorizontalOverflow {
  const [
    state,
    setState,
  ] = useState<HorizontalOverflow>({
    overflows: false, atEnd: true,
  });

  useEffect(
    () => {
      const content = contentRef.current;
      const scroller = content?.parentElement;
      if (!content || !scroller)
        return;

      const update = () => {
        const overflows = scroller.scrollWidth - scroller.clientWidth > 1;
        const atEnd = !overflows || scroller.scrollLeft + scroller.clientWidth >= scroller.scrollWidth - 1;
        setState(prev => (prev.overflows === overflows && prev.atEnd === atEnd ? prev : {
          overflows, atEnd,
        }));
      };

      // No synchronous first measure: ResizeObserver reports once as soon as
      // it starts observing, which covers the initial state.
      scroller.addEventListener(
        "scroll",
        update,
        { passive: true },
      );
      const observer = typeof ResizeObserver === "undefined" ? null : new ResizeObserver(update);
      observer?.observe(scroller);
      observer?.observe(content);
      return () => {
        scroller.removeEventListener(
          "scroll",
          update,
        );
        observer?.disconnect();
      };
    },
    [contentRef],
  );

  return state;
}
