export const amenityIcons: Record<string, string> = {
  "swimming pool": "🏊",
  "pool": "🏊",
  "gym": "💪",
  "gymnasium": "💪",
  "fitness": "💪",
  "parking": "🅿️",
  "garden": "🌳",
  "landscaped garden": "🌳",
  "clubhouse": "🏠",
  "club house": "🏠",
  "security": "🔒",
  "24/7 security": "🔒",
  "cctv": "📹",
  "power backup": "🔋",
  "lift": "🛗",
  "elevator": "🛗",
  "children's play area": "🎢",
  "play area": "🎢",
  "tennis": "🎾",
  "basketball": "🏀",
  "badminton": "🏸",
  "jogging track": "🏃",
  "spa": "💆",
  "sauna": "🧖",
  "wifi": "📶",
  "intercom": "📞",
  "fire safety": "🧯",
  "water supply": "💧",
  "rainwater harvesting": "🌧️",
  "solar": "☀️",
  "terrace": "🏗️",
  "balcony": "🏠",
  "modular kitchen": "🍳",
  "air conditioning": "❄️",
  "ac": "❄️",
  "gas pipeline": "🔥",
  "meditation": "🧘",
  "yoga": "🧘",
  "amphitheatre": "🎭",
  "library": "📚",
  "pet friendly": "🐕",
  "ev charging": "🔌",
  "concierge": "🛎️",
  "default": "✓"
};

export function getAmenityIcon(amenity: string): string {
  const lowerAmenity = amenity.toLowerCase();
  for (const [key, icon] of Object.entries(amenityIcons)) {
    if (lowerAmenity.includes(key)) return icon;
  }
  return amenityIcons.default;
}

