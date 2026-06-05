import { createFileRoute } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { ArrowDown, ArrowRight, Sparkles } from "lucide-react";
import Hero3D from "@/components/Hero3D";
import { Typewriter } from "@/components/Typewriter";
import SiteNav from "@/components/SiteNav";
import { Services, ProductsPreview, WhyUs, Testimonials, ContactCTA, SiteFooter } from "@/components/HomeSections";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "CyberTown Tech — Digital Goods & Web Solutions · Malaysia" },
      { name: "description", content: "CyberTown Tech: Malaysian digital goods, license keys, and custom web development services. Instant delivery, secure payments." },
      { property: "og:title", content: "CyberTown Tech — Digital Goods & Web Solutions" },
      { property: "og:description", content: "Premium digital goods and web development from Malaysia." },
    ],
  }),
  component: Home,
});

function Home() {
  return (
    <div className="relative min-h-screen bg-background text-foreground overflow-x-hidden">
      <SiteNav />

      {/* HERO */}
      <section className="relative min-h-screen flex items-center justify-center pt-16" style={{ background: "var(--gradient-hero)" }}>
        <div className="absolute inset-0 bg-grid opacity-[0.07]" />
        <div className="absolute inset-0">
          <Hero3D />
        </div>
        <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-b from-transparent to-background" />

        <div className="relative z-10 max-w-5xl mx-auto px-6 text-center pointer-events-none">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="inline-flex items-center gap-2 px-3 h-8 rounded-full border border-stone/30 bg-obsidian/50 backdrop-blur text-xs text-ash mb-8 pointer-events-auto"
          >
            <Sparkles className="w-3 h-3 text-stone" />
            <span className="font-mono">Now serving Malaysia · Instant delivery</span>
          </motion.div>

          <h1 className="text-5xl sm:text-7xl md:text-8xl font-display font-semibold tracking-tighter text-cream text-glow glitch">
            <Typewriter text="CyberTown Tech" speed={75} />
          </h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.4, duration: 0.8 }}
            className="mt-6 text-base md:text-xl font-mono tracking-wide text-stone"
          >
            Digital Goods · Web Solutions · Malaysia
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.7, duration: 0.8 }}
            className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-3 pointer-events-auto"
          >
            <a href="#products" className="group inline-flex items-center gap-2 px-7 h-12 rounded-lg bg-cream text-obsidian font-medium hover:bg-ash transition shadow-[0_0_40px_-10px_rgba(242,237,232,0.4)]">
              Browse Products <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition" />
            </a>
            <a href="#services" className="inline-flex items-center gap-2 px-7 h-12 rounded-lg border border-stone/40 text-cream hover:border-stone hover:bg-stone/5 transition">
              Our Services
            </a>
          </motion.div>
        </div>

        <motion.a
          href="#services"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1, y: [0, 8, 0] }}
          transition={{ opacity: { delay: 2.2 }, y: { duration: 2, repeat: Infinity, ease: "easeInOut" } }}
          className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 text-stone text-xs font-mono z-10"
        >
          <span>SCROLL</span>
          <ArrowDown className="w-4 h-4" />
        </motion.a>
      </section>

      <Services />
      <ProductsPreview />
      <WhyUs />
      <Testimonials />
      <ContactCTA />
      <SiteFooter />
    </div>
  );
}
