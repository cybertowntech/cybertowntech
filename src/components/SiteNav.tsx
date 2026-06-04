import { Link } from "@tanstack/react-router";
import logo from "@/assets/logo.jpg";

export default function SiteNav() {
  return (
    <header className="fixed top-0 left-0 right-0 z-50 backdrop-blur-md bg-background/60 border-b border-border/50">
      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-3 group">
          <img src={logo} alt="CyberTown" className="w-9 h-9 rounded-full ring-1 ring-stone/40 group-hover:ring-stone transition" />
          <span className="font-display font-semibold tracking-tight text-cream">
            CyberTown<span className="text-stone"> · Store</span>
          </span>
        </Link>
        <nav className="hidden md:flex items-center gap-8 text-sm text-ash/80">
          <a href="#services" className="hover:text-cream transition">Services</a>
          <a href="#products" className="hover:text-cream transition">Products</a>
          <a href="#why" className="hover:text-cream transition">Why us</a>
          <a href="#contact" className="hover:text-cream transition">Contact</a>
        </nav>
        <div className="flex items-center gap-2">
          <Link to="/" className="hidden sm:inline-flex items-center px-4 h-9 rounded-md text-sm text-ash hover:text-cream transition">
            Sign in
          </Link>
          <a href="#products" className="inline-flex items-center px-4 h-9 rounded-md text-sm bg-cream text-obsidian font-medium hover:bg-ash transition">
            Browse
          </a>
        </div>
      </div>
    </header>
  );
}
