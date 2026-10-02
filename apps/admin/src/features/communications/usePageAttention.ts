import { useEffect, useState } from "react";

function attending() {
  return document.visibilityState === "visible" && document.hasFocus();
}

/** True while the tab is showing and focused, i.e. while someone can actually read. */
export function usePageAttention() {
  const [active, setActive] = useState(attending);

  useEffect(
    () => {
      const update = () => setActive(attending());
      document.addEventListener("visibilitychange", update);
      window.addEventListener("focus", update);
      window.addEventListener("blur", update);
      return () => {
        document.removeEventListener("visibilitychange", update);
        window.removeEventListener("focus", update);
        window.removeEventListener("blur", update);
      };
    },
    [],
  );

  return active;
}
