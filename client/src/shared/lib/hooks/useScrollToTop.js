import { useEffect } from "react";

export function useScrollToTop(dependencies = []) {
  useEffect(() => {
    window.scrollTo({
      top: 0,
      left: 0,
      behavior: "instant",
    });
  }, [dependencies]);
}
