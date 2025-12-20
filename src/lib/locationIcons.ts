export const locationIcons: Record<string, string> = {
  "airport": "✈️",
  "rgia": "✈️",
  "railway": "🚂",
  "train": "🚂",
  "metro": "🚇",
  "bus": "🚌",
  "hospital": "🏥",
  "school": "🏫",
  "college": "🎓",
  "university": "🎓",
  "mall": "🛍️",
  "shopping": "🛍️",
  "it park": "🏢",
  "tech park": "🏢",
  "financial district": "🏦",
  "highway": "🛣️",
  "orr": "🛣️",
  "ring road": "🛣️",
  "temple": "🛕",
  "church": "⛪",
  "mosque": "🕌",
  "park": "🌳",
  "lake": "🌊",
  "restaurant": "🍽️",
  "hotel": "🏨",
  "cinema": "🎬",
  "pharmacy": "💊",
  "bank": "🏦",
  "atm": "💳",
  "golf": "⛳",
  "beach": "🏖️",
  "default": "📍"
};

export function getLocationIcon(text: string): string {
  const lowerText = text.toLowerCase();
  for (const [key, icon] of Object.entries(locationIcons)) {
    if (lowerText.includes(key)) return icon;
  }
  return locationIcons.default;
}

