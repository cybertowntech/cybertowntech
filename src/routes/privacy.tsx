import { createFileRoute } from "@tanstack/react-router";
import { PolicyPage } from "@/components/PolicyPage";

export const Route = createFileRoute("/privacy")({
  head: () => ({ meta: [
    { title: "Privacy Policy — CyberTown Tech" },
    { name: "description", content: "Privacy information and contact details for CyberTown Tech customers. Draft pending owner review." },
    { property: "og:title", content: "Privacy Policy — CyberTown Tech" },
    { property: "og:description", content: "How to ask about your customer information at CyberTown Tech." },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary" },
  ] }),
  component: Privacy,
});
function Privacy() { return <PolicyPage title="Privacy policy" intro="Your information deserves clear explanations. The following summarizes the website's customer-facing data flows while our full policy is being reviewed." sections={[
  { title: "Information used for orders", text: "Checkout collects contact and order information so purchases can be processed and associated with your customer dashboard. Account sign-in also uses your email address." },
  { title: "Payment processing", text: "Paid orders are directed to ToyyibPay for payment. Please review the payment provider's privacy information when completing your transaction." },
  { title: "Your dashboard and browser storage", text: "The website uses browser storage for cart and session features. Avoid sharing a device or your order access details with people you do not trust." },
  { title: "Privacy questions", text: "Contact us for questions about access, correction or deletion of your information. Retention periods and the full list of service providers will be confirmed in the finalized policy." },
]} />; }