import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, Code2, Palette, Package, Wrench, Globe2, Check, Mail, MessageCircle, ArrowUpRight } from "lucide-react";
import SiteNav from "@/components/SiteNav";
import { SiteFooter } from "@/components/HomeSections";
import { Button } from "@/components/ui/button";
import founder from "@/assets/luqman-founder.jpeg.asset.json";

export const Route = createFileRoute("/about")({
  head: () => ({ meta: [
    { title: "About Us — CyberTown Tech" },
    { name: "description", content: "Meet the people behind CyberTown Tech: a student-founded Malaysian digital business building websites and supporting creators since 2020." },
    { property: "og:title", content: "About Us — CyberTown Tech" },
    { property: "og:description", content: "Built by a builder. Meet Luqman Al Hakim and the Malaysian team behind CyberTown Tech." },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary_large_image" },
  ] }),
  component: About,
});

const pillars = [
  { icon: Code2, title: "Web Development", text: "Websites and web applications shaped around your business, not a one-size-fits-all template.", action: "Explore web solutions" },
  { icon: Palette, title: "UI/UX Design", text: "Thoughtful layouts, clear journeys and interfaces that put your customers first.", action: "Discuss your design", service: true },
  { icon: Package, title: "Digital Goods", text: "Software licenses and digital essentials for your next project, all in one place.", action: "Browse digital goods" },
  { icon: Wrench, title: "Maintenance", text: "Updates, troubleshooting and ongoing care to keep your website moving forward.", action: "Talk about support", service: true },
];
const steps = [
  ["Brief", "We listen to your idea, audience and budget, then agree on the scope."],
  ["Design", "We map the experience and review the visual direction with you."],
  ["Build", "We turn the agreed design into a working website and test the details."],
  ["Launch", "We prepare the handover and bring your website online."],
  ["Support", "We help with the next steps and any agreed ongoing maintenance."],
];
const examples = [
  { kind: "Web Development", name: "A small shop, ready for online orders", before: "Products scattered across messages, with no single place to browse.", after: "A clear catalogue, product pages and a connected checkout journey." },
  { kind: "UI/UX Design", name: "A clearer first impression", before: "A crowded services page made it difficult to find the right next step.", after: "A focused layout with readable service details and direct enquiry links." },
  { kind: "Maintenance", name: "A website that stays cared for", before: "Updates and small issues were left until they became disruptive.", after: "An agreed maintenance scope with regular checks and a human point of contact." },
];

function About() {
  return <div className="min-h-screen bg-background text-foreground">
    <SiteNav />
    <main>
      <section className="about-hero relative isolate flex items-center px-6 pt-28 pb-16 overflow-hidden">
        <img src={founder.url} alt="Luqman Al Hakim in the mountains" className="absolute inset-0 -z-20 h-full w-full object-cover object-[50%_38%]" />
        <div className="about-hero-shade absolute inset-0 -z-10" />
        <div className="w-full max-w-7xl mx-auto">
          <p className="text-sm text-ash mb-5 font-mono">ABOUT US / EST. 2020</p>
          <h1 className="text-4xl sm:text-6xl lg:text-7xl font-semibold max-w-3xl leading-[1.08]">CyberTown Tech</h1>
          <p className="mt-6 max-w-xl text-xl sm:text-2xl leading-relaxed text-cream">We help small builders turn big ideas into digital realities.</p>
          <Button asChild size="lg" className="mt-8 h-12"><Link to="/products">Explore what we do <ArrowRight /></Link></Button>
          <div className="mt-14 flex flex-wrap gap-x-8 gap-y-3 text-sm text-ash"><span>Student-founded</span><span>Built in Malaysia</span><span>Working beyond borders</span></div>
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-6 py-20 md:py-28">
        <div className="grid lg:grid-cols-[1fr_1.5fr] gap-10 lg:gap-24">
          <div><p className="about-eyebrow">01 / Our story</p><h2 className="about-heading">Built by a builder.<br /><span className="text-stone">For people like you.</span></h2></div>
          <div className="space-y-5 text-base sm:text-lg leading-relaxed text-muted-foreground">
            <p>CyberTown Tech began with a student, a curiosity for the web and the determination to build something of his own. Luqman Al Hakim started doing business in 2020 while creating his own web projects — learning by making, testing and trying again.</p>
            <p>That experience still shapes us. We know what it feels like to start small, work with a limited budget and need tools that actually help. CyberTown Tech exists to make web development and digital essentials more approachable for independent builders, creators and growing businesses.</p>
            <p>Our roots are in Malaysia, but our business has reached China, the USA, Pakistan and India. Wherever a project starts, our approach stays personal: understand the idea, keep things clear and build with care.</p>
          </div>
        </div>
        <div className="mt-12 pt-7 border-t border-border flex flex-wrap items-center gap-x-8 gap-y-4 text-sm text-ash"><Globe2 className="w-5 h-5 text-stone" />{["Malaysia", "China", "USA", "Pakistan", "India"].map(country => <span key={country}>{country}</span>)}</div>
      </section>

      <section className="border-y border-border bg-card/30 px-6 py-20">
        <div className="max-w-7xl mx-auto grid md:grid-cols-2 gap-10 lg:gap-20 items-center">
          <img src={founder.url} alt="Luqman Al Hakim, founder and owner of CyberTown Tech" loading="lazy" className="w-full aspect-[4/5] max-h-[600px] rounded-lg object-cover object-center" />
          <div><p className="about-eyebrow">02 / The people behind the work</p><h2 className="about-heading">Luqman Al Hakim</h2><p className="mt-3 text-stone">Founder & Owner · Student & Web Builder</p>
            <blockquote className="mt-8 text-2xl sm:text-3xl leading-snug">“I build with the same care I would want for my own first project.”</blockquote>
            <p className="mt-5 text-muted-foreground leading-relaxed">A small business with a real person behind it. From the first idea to the finishing details, our work starts with understanding what you are trying to build.</p>
            <div className="mt-9 pt-6 border-t border-border"><p className="text-lg font-medium">Daniel Nicole</p><p className="text-sm text-stone mt-1">Manager</p></div>
          </div>
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-6 py-20 md:py-28"><p className="about-eyebrow">03 / What we do</p><h2 className="about-heading">Four pillars. One thoughtful team.</h2>
        <div className="mt-10 grid sm:grid-cols-2 lg:grid-cols-4 gap-4">{pillars.map(p => <article key={p.title} className="flex flex-col rounded-lg border border-border bg-card/60 backdrop-blur-md p-6"><p.icon className="w-6 h-6 text-stone mb-7" /><h3 className="text-xl font-medium">{p.title}</h3><p className="mt-3 text-sm text-muted-foreground leading-relaxed flex-1">{p.text}</p><Button asChild variant="link" className="mt-6 h-auto p-0 justify-start whitespace-normal text-left">{p.service ? <a href={`mailto:businesswithluc.hq@gmail.com?subject=${encodeURIComponent(p.title + " enquiry")}`}>{p.action}<ArrowUpRight /></a> : <Link to="/products">{p.action}<ArrowUpRight /></Link>}</Button></article>)}</div>
      </section>

      <section className="border-y border-border px-6 py-20 bg-card/20"><div className="max-w-7xl mx-auto"><p className="about-eyebrow">04 / How we work</p><h2 className="about-heading">From the first conversation<br />to what comes next.</h2><ol className="mt-12 grid md:grid-cols-5 gap-8">{steps.map(([name, text], i) => <li key={name} className="border-t border-stone/40 pt-5"><div className="flex items-center justify-between"><span className="font-mono text-sm text-stone">0{i + 1}</span>{i < 4 && <ArrowRight className="w-4 h-4 text-stone" />}</div><h3 className="mt-5 text-xl font-medium">{name}</h3><p className="mt-3 text-sm text-muted-foreground leading-relaxed">{text}</p></li>)}</ol></div></section>

      <section className="max-w-7xl mx-auto px-6 py-20 md:py-28"><div className="grid lg:grid-cols-2 gap-12 lg:gap-24"><div><p className="about-eyebrow">05 / Our promises</p><h2 className="about-heading">Clear expectations.<br />Real people.</h2></div><div className="space-y-7">{[
        ["Your keys, on your dashboard", "License delivery is automatic after successful payment confirmation. If processing takes longer, check your dashboard after 5–60 minutes."],
        ["Human support", "Your questions are handled by people who can listen and help — not just an automated reply."],
        ["A clear price before you commit", "Review your cart total before paying. For web projects, we agree on scope and pricing before work starts."],
        ["No silent changes to your project", "If a request changes the agreed scope, we discuss the work and cost with you first."],
      ].map(([title, text]) => <div key={title} className="flex gap-4"><Check className="w-5 h-5 shrink-0 mt-1 text-stone" /><div><h3 className="text-lg font-medium">{title}</h3><p className="mt-2 text-sm leading-relaxed text-muted-foreground">{text}</p></div></div>)}</div></div></section>

      <section className="border-y border-border bg-card/20 px-6 py-20"><div className="max-w-7xl mx-auto"><p className="about-eyebrow">06 / Project possibilities</p><h2 className="about-heading">Small changes. Better experiences.</h2><p className="mt-4 text-sm text-stone max-w-2xl">Illustrative case studies — fictional examples of our approach, not completed client projects or verified results.</p><div className="grid md:grid-cols-3 gap-5 mt-10">{examples.map(e => <article key={e.name} className="rounded-lg border border-border bg-card/60 p-6"><p className="text-xs font-mono text-stone">{e.kind} / CONCEPT</p><h3 className="mt-5 text-xl leading-snug font-medium">{e.name}</h3><div className="mt-6 space-y-5"><div><p className="text-xs text-stone mb-2">BEFORE</p><p className="text-sm text-muted-foreground leading-relaxed">{e.before}</p></div><div className="pt-5 border-t border-border"><p className="text-xs text-ash mb-2">AFTER</p><p className="text-sm text-ash leading-relaxed">{e.after}</p></div></div></article>)}</div><div className="mt-10 border-t border-border pt-8"><h3 className="text-xl font-medium">Customer voices</h3><p className="mt-3 text-sm text-muted-foreground">Verified customer testimonials will be shared here with their permission.</p></div></div></section>

      <section className="max-w-7xl mx-auto px-6 py-20"><p className="about-eyebrow">07 / Business details</p><h2 className="about-heading">Know who you are buying from.</h2><dl className="mt-10 grid sm:grid-cols-2 lg:grid-cols-4 gap-8"><div><dt className="text-sm text-stone">Registered business</dt><dd className="mt-3 font-medium">CyberTown Tech<br /><span className="font-mono text-sm text-ash">003838483-K</span></dd></div><div><dt className="text-sm text-stone">Country of operation</dt><dd className="mt-3 font-medium">Malaysia</dd></div><div><dt className="text-sm text-stone">Payments</dt><dd className="mt-3 font-medium">ToyyibPay</dd><dd className="mt-2 text-sm text-muted-foreground">Available methods are shown at checkout.</dd></div><div><dt className="text-sm text-stone">Policies</dt><dd className="mt-3 flex flex-col items-start gap-2"><Link to="/refunds" className="underline underline-offset-4 text-sm">Refund policy</Link><Link to="/privacy" className="underline underline-offset-4 text-sm">Privacy policy</Link><Link to="/terms" className="underline underline-offset-4 text-sm">Terms & conditions</Link></dd></div></dl></section>

      <section className="border-t border-border px-6 py-20 md:py-28"><div className="max-w-7xl mx-auto"><p className="about-eyebrow">Let's talk</p><h2 className="text-4xl sm:text-5xl lg:text-6xl font-semibold">Have a project?<br /><span className="text-stone">Tell us about it.</span></h2><div className="mt-8 flex flex-wrap gap-3"><span title="Our WhatsApp contact number will be available soon."><Button size="lg" disabled><MessageCircle />WhatsApp · Coming soon</Button></span><Button asChild size="lg" variant="outline"><a href="mailto:businesswithluc.hq@gmail.com?subject=Project%20enquiry"><Mail />Email us<ArrowUpRight /></a></Button></div><p className="mt-5 text-sm text-stone break-all">businesswithluc.hq@gmail.com</p></div></section>
    </main>
    <SiteFooter />
  </div>;
}