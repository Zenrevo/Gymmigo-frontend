import { CONTACT_EMAIL, WHATSAPP_PHONE } from './publicSiteContent';

export const buildWhatsappUrl = (message: string) => `https://wa.me/${WHATSAPP_PHONE}?text=${encodeURIComponent(message)}`;
export const buildEmailUrl = (subject: string, body = '') =>
  `mailto:${CONTACT_EMAIL}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
