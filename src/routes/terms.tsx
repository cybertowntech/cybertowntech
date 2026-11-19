import { createFileRoute } from "@tanstack/react-router";
import { PolicyPage } from "@/components/PolicyPage";

export const Route = createFileRoute("/terms")({
  head: () => ({ meta: [
    { title: "Terms & Conditions — CyberTown Tech" },
    { name: "description", content: "Purchase and project information for CyberTown Tech digital goods and web services. Draft pending owner review." },
    { property: "og:title", content: "Terms & Conditions — CyberTown Tech" },
    { property: "og:description", content: "Digital purchases, website projects and support at CyberTown Tech." },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary" },
  ] }),
  component: Terms,
});
function Terms() { return <PolicyPage title="Terms & conditions" intro="CyberTown Tech provides digital goods and web services from Malaysia. Review the product details and confirm any project-specific arrangements before making a purchase." sections={[
  { title: "Product details and payment", text: "Check the selected product, variant and cart total before completing checkout. Paid purchases are processed through ToyyibPay." },
  { title: "License delivery", text: "License keys are delivered through the website and customer dashboard after successful payment confirmation, rather than by email. Product-specific activation conditions should be checked before purchase." },
  { title: "Web projects", text: "Scope, deliverables, milestones, revisions, ownership and maintenance arrangements should be agreed in writing for each project." },
  { title: "Final terms", text: "The full legal terms, dispute process and project conditions are pending owner review. Contact us to confirm the terms applicable to your order; this draft does not replace your statutory rights." },
]} />; }