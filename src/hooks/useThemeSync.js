import { useEffect } from "react";

export default function useThemeSync(iframeRef, currentTheme) {
  useEffect(() => {
    if (!iframeRef.current) return;
    // Send theme message to iframe
    iframeRef.current.contentWindow?.postMessage(
      { type: "theme-change", theme: currentTheme },
      "*"
    );
  }, [currentTheme, iframeRef]);
}
