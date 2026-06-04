import { useEffect, useState } from "react";

export function Typewriter({ text, speed = 90, className = "" }: { text: string; speed?: number; className?: string }) {
  const [i, setI] = useState(0);
  useEffect(() => {
    if (i >= text.length) return;
    const t = setTimeout(() => setI(i + 1), speed);
    return () => clearTimeout(t);
  }, [i, text, speed]);
  return <span className={`${className} ${i < text.length ? "caret" : ""}`}>{text.slice(0, i)}</span>;
}
