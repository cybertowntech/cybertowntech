import { createFileRoute } from "@tanstack/react-router";
import { PolicyPage } from "@/components/PolicyPage";

export const Route = createFileRoute("/refunds")({
  head: () => ({ meta: [
    { title: "Refund Policy — CyberTown Tech" },
    { name: "description", content: "Contact CyberTown Tech about license issues, payment questions and refund requests. Draft pending owner review." },
    { property: "og:title", content: "Refund Policy — CyberTown Tech" },
    { property: "og:description", content: "Purchase support and refund enquiries at CyberTown Tech." },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary" },
  ] }),
  component: Refunds,
});
function Refunds() { return <PolicyPage title="Refund policy" intro="If something is wrong with your purchase, contact us with your order details so we can review the issue." sections={[
  { title: "Digital goods and license issues", text: "Include your order reference, product name and a description of the problem. Do not include a full license key in a public message. Our team can investigate delivery or activation issues." },
  { title: "Web development services", text: "Cancellation, revisions and any refund arrangements should be confirmed in the agreed project scope before work begins." },
  { title: "Terms awaiting confirmation", text: "Refund eligibility, request deadlines, replacement arrangements and processing times have not yet been finalized for this page. Please confirm them with us before purchasing. Nothing on this page limits your applicable consumer rights." },
]} />; }