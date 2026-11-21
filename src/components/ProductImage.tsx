import { useEffect, useState } from "react";
import { Package } from "lucide-react";

export function ProductImage({ src, alt, className = "" }: { src?: string | null; alt: string; className?: string }) {
  const [failed, setFailed] = useState(false);
  useEffect(() => setFailed(false), [src]);
  if (!src || failed) return <div role="img" aria-label={`${alt} — image unavailable`} className="w-full h-full flex items-center justify-center"><Package className="w-10 h-10 text-muted-foreground" /></div>;
  return <img src={src} alt={alt} className={`w-full h-full object-cover ${className}`} onError={() => setFailed(true)} />;
}