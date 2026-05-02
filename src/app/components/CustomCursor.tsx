import { useEffect, useRef } from "react";

export function CustomCursor() {
  const ringRef = useRef<HTMLDivElement>(null);
  const dotRef = useRef<HTMLDivElement>(null);
  const pos = useRef({ x: 0, y: 0 });
  const smoothPos = useRef({ x: 0, y: 0 });
  const rafRef = useRef<number>(0);
  const isHovering = useRef(false);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      pos.current = { x: e.clientX, y: e.clientY };
      if (dotRef.current) {
        dotRef.current.style.transform = `translate(${e.clientX - 4}px, ${e.clientY - 4}px)`;
        dotRef.current.style.opacity = "1";
      }
    };

    const handleMouseEnterInteractive = () => {
      isHovering.current = true;
      if (ringRef.current) {
        ringRef.current.style.width = "48px";
        ringRef.current.style.height = "48px";
        ringRef.current.style.borderColor = "rgba(34, 211, 238, 0.8)";
        ringRef.current.style.background = "rgba(34, 211, 238, 0.06)";
      }
    };

    const handleMouseLeaveInteractive = () => {
      isHovering.current = false;
      if (ringRef.current) {
        ringRef.current.style.width = "36px";
        ringRef.current.style.height = "36px";
        ringRef.current.style.borderColor = "rgba(34, 211, 238, 0.4)";
        ringRef.current.style.background = "transparent";
      }
    };

    const animate = () => {
      smoothPos.current.x += (pos.current.x - smoothPos.current.x) * 0.12;
      smoothPos.current.y += (pos.current.y - smoothPos.current.y) * 0.12;

      if (ringRef.current) {
        const w = parseInt(ringRef.current.style.width || "36");
        ringRef.current.style.transform = `translate(${smoothPos.current.x - w / 2}px, ${smoothPos.current.y - w / 2}px)`;
        ringRef.current.style.opacity = "1";
      }

      rafRef.current = requestAnimationFrame(animate);
    };
    rafRef.current = requestAnimationFrame(animate);

    // Add listeners for interactive elements
    const addListeners = () => {
      const interactives = document.querySelectorAll(
        "button, a, input, [data-interactive]"
      );
      interactives.forEach((el) => {
        el.addEventListener("mouseenter", handleMouseEnterInteractive);
        el.addEventListener("mouseleave", handleMouseLeaveInteractive);
      });
    };

    // Use MutationObserver to catch dynamically added elements
    const observer = new MutationObserver(addListeners);
    observer.observe(document.body, { childList: true, subtree: true });
    addListeners();

    window.addEventListener("mousemove", handleMouseMove);

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      cancelAnimationFrame(rafRef.current);
      observer.disconnect();
    };
  }, []);

  return (
    <>
      {/* Lagged ring */}
      <div
        ref={ringRef}
        className="fixed top-0 left-0 pointer-events-none z-[99999] rounded-full border opacity-0"
        style={{
          width: "36px",
          height: "36px",
          borderColor: "rgba(34, 211, 238, 0.4)",
          transition: "width 0.2s, height 0.2s, border-color 0.2s, background 0.2s, opacity 0.3s",
          willChange: "transform",
          mixBlendMode: "normal",
        }}
      />
      {/* Instant dot */}
      <div
        ref={dotRef}
        className="fixed top-0 left-0 pointer-events-none z-[99999] rounded-full opacity-0"
        style={{
          width: "8px",
          height: "8px",
          background: "rgba(34, 211, 238, 0.9)",
          boxShadow: "0 0 10px rgba(34, 211, 238, 0.6)",
          transition: "opacity 0.3s",
          willChange: "transform",
        }}
      />
    </>
  );
}
