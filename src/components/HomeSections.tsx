import { motion, useInView, useMotionValue, useSpring, useTransform } from "framer-motion";
import { useEffect, useRef } from "react";
import { Code2, Palette, Package, Wrench, ShieldCheck, Zap, Globe2, ArrowRight } from "lucide-react";
import mascot from "@/assets/mascot.jpg";

const services = [
  { icon: Code2, title: "Web Development", desc: "Custom websites, web apps, and full-stack builds with modern stacks." },
  { icon: Palette, title: "UI / UX Design", desc: "Interfaces that feel inevitable — researched, prototyped, polished." },
  { icon: Package, title: "Digital Goods", desc: "License keys, templates, plugins and ready-to-deploy assets." },
  { icon: Wrench, title: "Maintenance", desc: "Ongoing support, performance audits and security hardening." },
];

const products = [
  { name: "Premium WordPress Pack", price: "RM 49", tag: "Bestseller" },
  { name: "SaaS Starter Kit", price: "RM 129", tag: "New" },
  { name: "Streaming License — 1Y", price: "RM 35", tag: "Limited" },
  { name: "Landing Page Bundle", price: "RM 79", tag: "Popular" },
  { name: "Admin Dashboard UI", price: "RM 99", tag: "Pro" },
  { name: "AI Tools Subscription", price: "RM 25", tag: "Trending" },
];

function Counter({ to, suffix = "" }: { to: number; suffix?: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: "-50px" });
  const mv = useMotionValue(0);
  const spring = useSpring(mv, { duration: 1800, bounce: 0 });
  const display = useTransform(spring, (v) => Math.floor(v).toLocaleString() + suffix);
  useEffect(() => { if (inView) mv.set(to); }, [inView, to, mv]);
  return <motion.span ref={ref}>{display}</motion.span>;
}

const fade = {
  hidden: { opacity: 0, y: 30 },
  show: (i = 0) => ({ opacity: 1, y: 0, transition: { delay: i * 0.08, duration: 0.6, ease: [0.22, 1, 0.36, 1] as const } }),
};

export function Services() {
  return (
    <section id="services" className="relative py-32 px-6">
      <div className="max-w-7xl mx-auto">
        <motion.div initial="hidden" whileInView="show" viewport={{ once: true }} variants={fade}>
          <p className="text-xs tracking-[0.3em] text-stone uppercase mb-4">What we do</p>
          <h2 className="text-4xl md:text-6xl font-display font-semibold tracking-tight max-w-3xl">
            Services built for <span className="text-stone">builders</span>, founders & creators.
          </h2>
        </motion.div>
        <div className="mt-16 grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {services.map((s, i) => (
            <motion.div
              key={s.title}
              custom={i}
              initial="hidden"
              whileInView="show"
              viewport={{ once: true }}
              variants={fade}
              className="group relative p-7 rounded-2xl bg-card border border-border hover:border-stone/60 transition-all hover:-translate-y-1 hover:shadow-[0_30px_60px_-30px_rgba(176,168,159,0.4)]"
            >
              <div className="w-12 h-12 rounded-xl bg-obsidian border border-border flex items-center justify-center mb-5 group-hover:bg-stone/10 transition">
                <s.icon className="w-5 h-5 text-stone group-hover:text-cream transition" />
              </div>
              <h3 className="text-lg font-medium text-cream mb-2">{s.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{s.desc}</p>
              <div className="mt-6 flex items-center gap-2 text-xs text-stone opacity-0 group-hover:opacity-100 transition">
                Learn more <ArrowRight className="w-3 h-3" />
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

export function ProductsPreview() {
  return (
    <section id="products" className="relative py-32 overflow-hidden">
      <div className="max-w-7xl mx-auto px-6 flex items-end justify-between gap-6 mb-12">
        <div>
          <p className="text-xs tracking-[0.3em] text-stone uppercase mb-4">Featured</p>
          <h2 className="text-4xl md:text-6xl font-display font-semibold tracking-tight">Digital goods, delivered instantly.</h2>
        </div>
        <a href="#" className="hidden md:inline-flex items-center gap-2 text-sm text-ash hover:text-cream transition shrink-0">
          View all <ArrowRight className="w-4 h-4" />
        </a>
      </div>
      <div className="overflow-x-auto scrollbar-none pb-6">
        <div className="flex gap-5 px-6 min-w-max">
          {products.map((p, i) => (
            <motion.article
              key={p.name}
              initial={{ opacity: 0, x: 40 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.06, duration: 0.6 }}
              className="w-80 shrink-0 rounded-2xl bg-card border border-border overflow-hidden group hover:border-stone/60 transition"
            >
              <div className="aspect-[4/3] relative bg-gradient-to-br from-charcoal to-obsidian flex items-center justify-center overflow-hidden">
                <div className="absolute inset-0 bg-grid opacity-30" />
                <div className="absolute -inset-10 opacity-30 group-hover:opacity-60 transition" style={{ background: "var(--gradient-glow)" }} />
                <span className="relative font-mono text-xs text-stone">{p.tag}</span>
              </div>
              <div className="p-5">
                <h3 className="text-cream font-medium">{p.name}</h3>
                <div className="mt-4 flex items-center justify-between">
                  <span className="text-stone font-mono">{p.price}</span>
                  <button className="text-xs px-3 h-8 rounded-md bg-cream text-obsidian font-medium hover:bg-ash transition">Buy</button>
                </div>
              </div>
            </motion.article>
          ))}
        </div>
      </div>
    </section>
  );
}

export function WhyUs() {
  const stats = [
    { v: 1200, s: "+", l: "Orders delivered" },
    { v: 98, s: "%", l: "Customer satisfaction" },
    { v: 24, s: "/7", l: "Support availability" },
    { v: 5, s: "min", l: "Avg. license delivery" },
  ];
  const badges = [
    { icon: ShieldCheck, t: "Secure payments" },
    { icon: Zap, t: "Instant delivery" },
    { icon: Globe2, t: "Trusted MY-wide" },
  ];
  return (
    <section id="why" className="relative py-32 px-6">
      <div className="max-w-7xl mx-auto">
        <div className="grid lg:grid-cols-12 gap-16 items-center">
          <motion.div initial="hidden" whileInView="show" viewport={{ once: true }} variants={fade} className="lg:col-span-5">
            <p className="text-xs tracking-[0.3em] text-stone uppercase mb-4">Why CyberTown</p>
            <h2 className="text-4xl md:text-5xl font-display font-semibold tracking-tight">
              A small Malaysian team obsessed with <span className="text-stone">craft</span>.
            </h2>
            <p className="mt-6 text-muted-foreground leading-relaxed">
              We ship licenses in minutes, build sites that load in milliseconds, and answer support like humans — because we are.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              {badges.map((b) => (
                <div key={b.t} className="inline-flex items-center gap-2 px-3 h-9 rounded-full border border-border bg-card text-xs text-ash">
                  <b.icon className="w-3.5 h-3.5 text-stone" /> {b.t}
                </div>
              ))}
            </div>
          </motion.div>
          <div className="lg:col-span-7 grid grid-cols-2 gap-4">
            {stats.map((st, i) => (
              <motion.div
                key={st.l}
                custom={i}
                initial="hidden"
                whileInView="show"
                viewport={{ once: true }}
                variants={fade}
                className="p-8 rounded-2xl bg-card border border-border"
              >
                <div className="text-4xl md:text-5xl font-display font-semibold text-cream">
                  <Counter to={st.v} suffix={st.s} />
                </div>
                <div className="mt-2 text-sm text-muted-foreground">{st.l}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

export function Testimonials() {
  const items = [
    { q: "Got my license in under 2 minutes. Insanely smooth.", a: "— Aisyah, KL" },
    { q: "They rebuilt our site and conversions jumped 3x.", a: "— Daniel, Penang" },
    { q: "Support replied within minutes on a Sunday. Wild.", a: "— Mei Ling, JB" },
  ];
  return (
    <section className="relative py-32 px-6 overflow-hidden">
      <motion.div
        aria-hidden
        animate={{ y: [0, -30, 0] }}
        transition={{ duration: 14, repeat: Infinity, ease: "easeInOut" }}
        className="absolute inset-0 bg-grid opacity-[0.06]"
      />
      <div className="relative max-w-7xl mx-auto">
        <motion.div initial="hidden" whileInView="show" viewport={{ once: true }} variants={fade}>
          <p className="text-xs tracking-[0.3em] text-stone uppercase mb-4">Words from customers</p>
          <h2 className="text-4xl md:text-5xl font-display font-semibold tracking-tight max-w-2xl">
            Trusted by hundreds across Malaysia.
          </h2>
        </motion.div>
        <div className="mt-14 grid md:grid-cols-3 gap-5">
          {items.map((t, i) => (
            <motion.blockquote
              key={i}
              custom={i}
              initial="hidden"
              whileInView="show"
              viewport={{ once: true }}
              variants={fade}
              className="p-8 rounded-2xl bg-card border border-border"
            >
              <p className="text-lg text-cream leading-relaxed">"{t.q}"</p>
              <footer className="mt-6 text-sm text-stone font-mono">{t.a}</footer>
            </motion.blockquote>
          ))}
        </div>
      </div>
    </section>
  );
}

export function ContactCTA() {
  return (
    <section id="contact" className="relative py-32 px-6">
      <div className="max-w-5xl mx-auto rounded-3xl border border-border bg-card p-10 md:p-16 relative overflow-hidden">
        <div className="absolute -top-20 -right-20 w-80 h-80 rounded-full" style={{ background: "var(--gradient-glow)" }} />
        <div className="relative grid md:grid-cols-2 gap-10 items-center">
          <div>
            <img src={mascot} alt="CyberTown mascot" className="w-24 h-24 rounded-2xl float-slow mb-6 ring-1 ring-border" />
            <h2 className="text-3xl md:text-4xl font-display font-semibold tracking-tight">Let's build something.</h2>
            <p className="mt-3 text-muted-foreground">Tell us what you need — we usually reply within a few hours.</p>
            <p className="mt-6 font-mono text-sm text-stone">businesswithluc.hq@gmail.com</p>
          </div>
          <form className="space-y-3" onSubmit={(e) => e.preventDefault()}>
            <input className="w-full h-12 px-4 rounded-lg bg-obsidian border border-border focus:border-stone outline-none text-cream placeholder:text-stone/50" placeholder="Your name" />
            <input type="email" className="w-full h-12 px-4 rounded-lg bg-obsidian border border-border focus:border-stone outline-none text-cream placeholder:text-stone/50" placeholder="Email address" />
            <textarea rows={4} className="w-full p-4 rounded-lg bg-obsidian border border-border focus:border-stone outline-none text-cream placeholder:text-stone/50 resize-none" placeholder="What can we help with?" />
            <button className="w-full h-12 rounded-lg bg-cream text-obsidian font-medium hover:bg-ash transition">Send message</button>
          </form>
        </div>
      </div>
    </section>
  );
}

export function SiteFooter() {
  return (
    <footer className="border-t border-border/60 py-12 px-6">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-muted-foreground">
        <div className="font-mono">© {new Date().getFullYear()} CyberTown Tech · Made in Malaysia 🇲🇾</div>
        <div className="flex gap-6">
          <a href="#" className="hover:text-cream transition">Privacy</a>
          <a href="#" className="hover:text-cream transition">Terms</a>
          <a href="#" className="hover:text-cream transition">Refunds</a>
        </div>
      </div>
    </footer>
  );
}
