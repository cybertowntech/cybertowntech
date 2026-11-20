export const WHATSAPP_NUMBER = "+601128043301";
export function whatsappUrl(message = "Hi CyberTown Tech, I'd like to discuss a project.") {
  return `https://wa.me/${WHATSAPP_NUMBER.replace(/\D/g, "")}?text=${encodeURIComponent(message)}`;
}