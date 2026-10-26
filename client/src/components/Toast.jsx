import { useEffect } from "react";

export const TOAST_DURATION_MS = 5000;

// 001/RF-2.4
// Temporary message: it calls onClose after 5 seconds.
export default function Toast({ message, onClose, durationMs = TOAST_DURATION_MS }) {
  useEffect(() => {
    const timer = setTimeout(onClose, durationMs);
    return () => clearTimeout(timer);
  }, [onClose, durationMs]);

  return (
    <p className="toast" role="status">
      {message}
    </p>
  );
}
