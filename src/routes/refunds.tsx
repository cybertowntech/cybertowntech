import { createFileRoute } from "@tanstack/react-router";
import { PolicyPage } from "@/components/PolicyPage";

export const Route = createFileRoute("/refunds")({
  head: () => ({ meta: [
    { title: "Refund & Cancellation Policy — CyberTown Tech" },
    { name: "description", content: "Official refund and cancellation policy for CyberTown Tech digital licenses and web development services. Last updated 21 November 2026." },
    { property: "og:title", content: "Refund & Cancellation Policy — CyberTown Tech" },
    { property: "og:description", content: "Refund eligibility, cancellations and processing for CyberTown Tech purchases." },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary" },
  ] }),
  component: Refunds,
});
function Refunds() { return <PolicyPage draft={false} title="Refund & cancellation policy" intro="At CyberTown Tech, we strive to provide reliable digital products and professional web development services. Please read our Refund & Cancellation Policy carefully before making any purchase. Last updated: 21 November 2026." sections={[
  { title: "1. Digital products & software licenses", text: "Due to the nature of digital products, all purchases are generally non-refundable once the license has been activated, delivered, or used. However, refunds or replacements may be considered when: the purchased license is invalid or defective; the license cannot be activated due to an issue attributable to CyberTown Tech or its supplier; the purchased product was not delivered after successful payment; or the product received is significantly different from its advertised description. Customers must submit a refund request within seven (7) days of purchase, together with valid proof of payment and relevant evidence." },
  { title: "2. Website development services", text: "Refunds for website development services are assessed based on the project's progress and completed work. Before work begins, a full refund may be provided. After work begins, refunds are calculated based on the remaining unfinished work. After project completion, refunds are generally not available for changes of mind or personal preferences. Technical errors caused by CyberTown Tech will be corrected without additional charges. Any completed work, approved milestones, and documented non-refundable third-party expenses may be deducted from the refund amount." },
  { title: "3. Order cancellation", text: "Customers may request cancellation before work begins or before a digital license is activated. Once a digital license has been activated or a service has commenced, cancellation requests will be reviewed individually based on the circumstances and work already performed." },
  { title: "4. Refund eligibility", text: "To request a refund, customers must provide: the order ID or transaction reference; proof of payment; the reason for the refund request; and relevant screenshots or supporting evidence, where applicable. CyberTown Tech reserves the right to investigate each request before making a decision." },
  { title: "5. Refund processing", text: "Approved refunds will be processed through the original payment method where reasonably possible. Refund processing may take between seven (7) and fourteen (14) business days, depending on the payment provider and banking institution." },
  { title: "6. Important notice", text: "This policy does not exclude or limit any rights available to consumers under applicable Malaysian laws. CyberTown Tech reserves the right to update this policy when necessary; any changes will be published on our official website. For refund enquiries, contact CyberTown Tech Support through our official website." },
]} />; }
