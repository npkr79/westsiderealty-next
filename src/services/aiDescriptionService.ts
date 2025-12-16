
import type { PropertyFormData } from "@/hooks/usePropertyForm";

class AIDescriptionService {
  generateDescription(formData: PropertyFormData): string {
    const {
      propertyType,
      title,
      bedrooms,
      area,
      microMarket,
      communityName,
      facing,
      furnishedStatus,
      amenities,
      uniqueUSPs,
      ageOfProperty,
      plotArea,
      landType,
      commercialSubtype
    } = formData;

    let description = "";

    switch (propertyType) {
      case 'Apartment':
        description = this.generateApartmentDescription(formData);
        break;
      case 'Villa':
        description = this.generateVillaDescription(formData);
        break;
      case 'Commercial Property':
        description = this.generateCommercialDescription(formData);
        break;
      case 'Plot':
        description = this.generatePlotDescription(formData);
        break;
      case 'Open Land':
        description = this.generateOpenLandDescription(formData);
        break;
      default:
        description = this.generateGenericDescription(formData);
    }

    return description;
  }

  private generateApartmentDescription(formData: PropertyFormData): string {
    const { bedrooms, area, microMarket, communityName, facing, furnishedStatus, amenities, ageOfProperty } = formData;
    
    let desc = `Spacious ${bedrooms} apartment with ${area} sq.ft of well-designed living space in the prime location of ${microMarket}.`;
    
    if (communityName) {
      desc += ` Located in ${communityName}, this property offers modern living with contemporary amenities.`;
    }
    
    if (facing) {
      desc += ` The apartment is ${facing.toLowerCase()}-facing, ensuring excellent natural light and ventilation.`;
    }
    
    if (furnishedStatus && furnishedStatus !== 'Unfurnished') {
      desc += ` This ${furnishedStatus.toLowerCase()} apartment is ready for immediate occupation.`;
    }
    
    if (amenities && amenities.length > 0) {
      desc += ` The property features premium amenities including ${amenities.slice(0, 3).join(', ')}${amenities.length > 3 ? ' and more' : ''}.`;
    }
    
    if (ageOfProperty && ageOfProperty !== 'Under Construction') {
      desc += ` This well-maintained property is ${ageOfProperty} old.`;
    }
    
    desc += ` Perfect for families and professionals seeking quality living in ${microMarket}'s vibrant community.`;
    
    return desc;
  }

  private generateVillaDescription(formData: PropertyFormData): string {
    const { bedrooms, area, plotArea, microMarket, villaType, hasGarden, isGatedCommunity, amenities } = formData;
    
    let desc = `Luxurious ${bedrooms} villa spanning ${area} sq.ft of built-up area`;
    
    if (plotArea) {
      desc += ` on a ${plotArea} sq.yds plot`;
    }
    
    desc += ` in the prestigious ${microMarket} locality.`;
    
    if (villaType) {
      desc += ` This elegant ${villaType.toLowerCase()} villa offers spacious living with modern architectural design.`;
    }
    
    if (hasGarden === 'Yes') {
      desc += ` The property features a beautiful landscaped garden, perfect for outdoor relaxation and entertainment.`;
    }
    
    if (isGatedCommunity === 'Yes') {
      desc += ` Located within a secure gated community with 24/7 security and premium facilities.`;
    }
    
    if (amenities && amenities.length > 0) {
      desc += ` Residents enjoy world-class amenities including ${amenities.slice(0, 3).join(', ')}${amenities.length > 3 ? ' and more' : ''}.`;
    }
    
    desc += ` Ideal for families seeking luxury, privacy, and convenience in ${microMarket}.`;
    
    return desc;
  }

  private generateCommercialDescription(formData: PropertyFormData): string {
    const { commercialSubtype, area, microMarket, floorNumber, hasCurrentTenant, monthlyRental, usageType } = formData;
    
    let desc = `Premium ${commercialSubtype?.toLowerCase()} space with ${area} sq.ft of built-up area strategically located in ${microMarket}.`;
    
    if (floorNumber) {
      desc += ` Situated on the ${floorNumber} floor with excellent visibility and accessibility.`;
    }
    
    if (usageType) {
      desc += ` Perfect for ${usageType.toLowerCase()} business operations with modern infrastructure.`;
    }
    
    if (hasCurrentTenant === 'Yes' && monthlyRental) {
      desc += ` Currently generating rental income of ₹${monthlyRental} per month with established tenant.`;
    }
    
    desc += ` The property offers excellent connectivity to major business hubs and transportation networks.`;
    desc += ` Ideal for businesses looking to establish presence in ${microMarket}'s thriving commercial landscape.`;
    
    return desc;
  }

  private generatePlotDescription(formData: PropertyFormData): string {
    const { area, microMarket, facing, isCornerPlot, isGatedLayout, approvalType, nearbyLandmarks } = formData;
    
    let desc = `Well-located residential plot measuring ${area} sq.yds in the developing area of ${microMarket}.`;
    
    if (facing) {
      desc += ` This ${facing.toLowerCase()}-facing plot offers excellent orientation for construction.`;
    }
    
    if (isCornerPlot === 'Yes') {
      desc += ` Being a corner plot, it provides additional space and better accessibility from two sides.`;
    }
    
    if (isGatedLayout === 'Yes') {
      desc += ` Located within a planned gated layout with organized infrastructure.`;
    }
    
    if (approvalType) {
      desc += ` The plot comes with ${approvalType} approval, ensuring clear title and legal compliance.`;
    }
    
    if (nearbyLandmarks) {
      desc += ` Conveniently located near ${nearbyLandmarks}.`;
    }
    
    desc += ` Perfect for building your dream home in ${microMarket} with excellent growth potential.`;
    
    return desc;
  }

  private generateOpenLandDescription(formData: PropertyFormData): string {
    const { area, landType, microMarket, hasBorewell, hasElectricity, nearbyVillages, approvalStatus } = formData;
    
    let desc = `Expansive ${landType?.toLowerCase()} land spanning ${area} acres in ${microMarket}.`;
    
    if (landType === 'Agricultural') {
      desc += ` This fertile agricultural land is perfect for farming activities and rural development.`;
    } else if (landType === 'Development Land') {
      desc += ` This development land offers excellent potential for future projects and construction.`;
    }
    
    if (hasBorewell === 'Yes') {
      desc += ` The property includes a functional borewell ensuring reliable water supply.`;
    }
    
    if (hasElectricity === 'Yes') {
      desc += ` Electricity connection is available, providing essential infrastructure.`;
    }
    
    if (nearbyVillages) {
      desc += ` Located near ${nearbyVillages} with good connectivity to rural and urban areas.`;
    }
    
    if (approvalStatus) {
      desc += ` The land comes with ${approvalStatus} ensuring proper documentation.`;
    }
    
    desc += ` Ideal for agriculture, farmhouse development, or long-term land appreciation.`;
    
    return desc;
  }

  private generateGenericDescription(formData: PropertyFormData): string {
    const { propertyType, area, microMarket, amenities } = formData;
    
    let desc = `Well-located ${propertyType.toLowerCase()} with ${area} sq.ft in ${microMarket}.`;
    desc += ` This property offers excellent potential with modern features and convenient location.`;
    
    if (amenities && amenities.length > 0) {
      desc += ` Features include ${amenities.slice(0, 3).join(', ')}${amenities.length > 3 ? ' and more' : ''}.`;
    }
    
    desc += ` Perfect for those seeking quality real estate in ${microMarket}.`;
    
    return desc;
  }
}

export const aiDescriptionService = new AIDescriptionService();
