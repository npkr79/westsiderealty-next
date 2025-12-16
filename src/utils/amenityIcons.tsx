import { 
  Waves, Dumbbell, Home, Baby, Trees, Shield, Zap, Car, 
  Footprints, Gamepad2, ArrowUpDown, Wifi, Camera, Users,
  Store, Heart, Droplets, Wind, Flame, Play, Music, Book,
  Coffee, ShoppingCart, Bike, Bus, Plane, Building, 
  CircleParking, Sun, Moon, Trophy, CheckCircle, Sparkles,
  Flower2, Phone, LucideIcon
} from "lucide-react";

// Comprehensive mapping of amenity keywords to Lucide icons
const amenityKeywordMap: Record<string, LucideIcon> = {
  // Water & Pool
  'swimming': Waves,
  'pool': Waves,
  'water': Droplets,
  
  // Fitness & Sports
  'gym': Dumbbell,
  'fitness': Dumbbell,
  'yoga': Heart,
  'sports': Trophy,
  'tennis': Play,
  'badminton': Play,
  'basketball': Play,
  'cricket': Play,
  'jogging': Footprints,
  'track': Footprints,
  
  // Social & Community
  'clubhouse': Home,
  'club': Home,
  'community': Users,
  'hall': Users,
  'party': Music,
  'banquet': Users,
  'multipurpose': Users,
  
  // Children
  'children': Baby,
  'kids': Baby,
  'play area': Baby,
  'playground': Baby,
  'school': Book,
  'creche': Baby,
  'daycare': Baby,
  
  // Garden & Nature
  'garden': Trees,
  'landscap': Trees,
  'green': Trees,
  'park': Trees,
  'terrace': Flower2,
  'lawn': Trees,
  
  // Security
  'security': Shield,
  'cctv': Camera,
  'surveillance': Camera,
  'guard': Shield,
  'gated': Shield,
  
  // Utilities
  'power': Zap,
  'backup': Zap,
  'generator': Zap,
  'electricity': Zap,
  'lift': ArrowUpDown,
  'elevator': ArrowUpDown,
  'wifi': Wifi,
  'internet': Wifi,
  'broadband': Wifi,
  
  // Parking
  'parking': Car,
  'garage': Car,
  'car': Car,
  'vehicle': Car,
  'covered parking': CircleParking,
  
  // Entertainment
  'indoor games': Gamepad2,
  'games': Gamepad2,
  'theatre': Play,
  'cinema': Play,
  'home theater': Play,
  'library': Book,
  'reading': Book,
  'meditation': Heart,
  
  // Shopping & Dining
  'shopping': ShoppingCart,
  'store': Store,
  'supermarket': Store,
  'cafe': Coffee,
  'restaurant': Coffee,
  'food court': Coffee,
  
  // Transportation
  'cycle': Bike,
  'bicycle': Bike,
  'bus': Bus,
  'shuttle': Bus,
  'airport': Plane,
  
  // Building Features
  'air conditioning': Wind,
  'ac': Wind,
  'central ac': Wind,
  'heating': Flame,
  'hvac': Wind,
  'ventilation': Wind,
  'solar': Sun,
  'rainwater': Droplets,
  'intercom': Phone,
  'fire': Flame,
  'fire safety': Flame,
  'emergency': Shield,
  
  // Luxury Amenities
  'spa': Sparkles,
  'sauna': Flame,
  'jacuzzi': Droplets,
  'steam': Droplets,
  'bar': Coffee,
  'lounge': Home,
  'concierge': Users,
  'valet': Car,
  'doorman': Users,
  'business': Building,
  'conference': Users,
  'coworking': Building,
};

/**
 * Get the most appropriate icon for an amenity
 * Uses keyword matching to find relevant icons
 */
export const getAmenityIcon = (amenity: string): LucideIcon => {
  const lowercaseAmenity = amenity.toLowerCase();
  
  // Check for exact or partial keyword matches
  for (const [keyword, Icon] of Object.entries(amenityKeywordMap)) {
    if (lowercaseAmenity.includes(keyword)) {
      return Icon;
    }
  }
  
  // Default fallback icon
  return CheckCircle;
};
