/**
 * Generates a Google Maps URL for a given address and/or coordinates.
 * Prioritizes coordinates for precision if available.
 */
export const getGoogleMapsUrl = (address?: string, lat?: number, lng?: number) => {
  if (lat && lng) {
    return `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`;
  }
  if (address) {
    return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`;
  }
  return '#';
};

/**
 * Handles opening a map link, stopping event propagation if needed.
 * Useful for links nested inside clickable cards.
 */
export const openInMap = (e: React.MouseEvent | React.TouchEvent, address?: string, lat?: number, lng?: number) => {
  e.stopPropagation();
  const url = getGoogleMapsUrl(address, lat, lng);
  if (url !== '#') {
    window.open(url, '_blank', 'noopener,noreferrer');
  }
};
