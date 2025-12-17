import type { ContactInfo } from '@/services/admin/contactService';

// Stub for jsPDF - lightweight placeholder
class jsPDFStub {
  internal: {
    pageSize: {
      getWidth: () => number;
      getHeight: () => number;
    };
  };
  
  constructor(orientation?: string, unit?: string, format?: string) {
    this.internal = {
      pageSize: {
        getWidth: () => 210, // A4 width in mm
        getHeight: () => 297, // A4 height in mm
      },
    };
  }
  text(text: string, x: number, y: number): void {}
  setFontSize(size: number): void {}
  setTextColor(r: number, g?: number, b?: number): void {}
  rect(x: number, y: number, w: number, h: number): void {}
  save(filename: string): void {}
  addImage(imgData: string, format: string, x: number, y: number, w: number, h: number): void {}
  setFont(family: string, style?: string): void {}
  getTextWidth(text: string): number { return 0; }
  getFontSize(): number { return 12; }
  getLineHeight(): number { return 5; }
  splitTextToSize(text: string, maxWidth: number): string[] { return [text]; }
  setPage(pageNumber: number): void {}
  getNumberOfPages(): number { return 1; }
  addPage(): void {}
  setDrawColor(r: number, g?: number, b?: number): void {}
  setFillColor(r: number, g?: number, b?: number): void {}
  line(x1: number, y1: number, x2: number, y2: number): void {}
}

const jsPDF = jsPDFStub as any;

// Property-specific types for different locations
export interface HyderabadProperty {
  id: string;
  title: string;
  property_type: string;
  bhk_config?: string;
  bedrooms?: number;
  area_sqft?: number;
  floor_number?: string;
  total_floors?: string;
  facing?: string;
  parking_spaces?: number;
  micro_market?: string;
  location?: string;
  community?: string;
  amenities: string[];
  unique_features: string[];
  main_image_url?: string;
  image_gallery: string[];
}

export interface GoaProperty {
  id: string;
  title: string;
  property_type: string;
  bedrooms?: number;
  area_sqft?: number;
  facing?: string;
  parking_spaces?: number;
  location?: string;
  beach_proximity?: string;
  amenities: string[];
  unique_features: string[];
  main_image_url?: string;
  image_gallery: string[];
}

export interface DubaiProperty {
  id: string;
  title: string;
  property_type: string;
  bedrooms?: number;
  area_sqft?: number;
  facing?: string;
  parking_spaces?: number;
  community?: string;
  amenities: string[];
  unique_features: string[];
  main_image_url?: string;
  image_gallery: string[];
}

export interface PropertyPDFData {
  projectName: string;
  location: string;
  areaSize: string;
  bhkType: string;
  unitNumber?: string;
  floorRange?: string;
  facing?: string;
  parking?: string;
  layoutHighlight?: string;
  communityHighlight?: string;
  keyAmenities: string[];
  locationBenefit?: string;
  heroImage: string;
  officeAddress: string;
  officePhone: string;
  officeEmail: string;
  officeHours: string;
}

export class PDFService {
  static transformPropertyDataForPDF(
    property: HyderabadProperty | GoaProperty | DubaiProperty,
    location: 'hyderabad' | 'goa' | 'dubai',
    officeInfo: ContactInfo
  ): PropertyPDFData {
    // Extract project name from title
    let projectName = property.title;
    let bhkType = '';
    
    const projectMatch = property.title.match(/in\s+([^,]+)/i) || 
                        property.title.match(/at\s+([^,]+)/i) ||
                        property.title.match(/-\s+([^,]+)/i);
    if (projectMatch) {
      projectName = projectMatch[1].trim();
    }
    
    // Extract BHK type
    if ('bhk_config' in property && property.bhk_config) {
      bhkType = `${property.bhk_config} Premium Flat`;
    } else if ('bedrooms' in property && property.bedrooms) {
      bhkType = `${property.bedrooms}BHK Apartment`;
    }
    
    // Build area size string
    const areaSize = property.area_sqft ? `${property.area_sqft} SFT` : 'N/A';
    
    // Extract location
    const propertyLocation = 'location' in property 
      ? property.location || ''
      : 'community' in property 
      ? property.community || ''
      : '';
    
    // Build floor range
    let floorRange = '';
    if ('floor_number' in property && 'total_floors' in property) {
      if (property.floor_number && property.total_floors) {
        floorRange = `${property.floor_number}–${property.total_floors} Floor`;
      }
    }
    
    // Build facing
    const facing = 'facing' in property && property.facing 
      ? `${property.facing} Facing` 
      : undefined;
    
    // Build parking
    const parking = 'parking_spaces' in property && property.parking_spaces
      ? `${property.parking_spaces} Car Parking`
      : undefined;
    
    // Extract key amenities (max 6)
    const keyAmenities = property.amenities.slice(0, 6);
    
    // Build location benefit
    let locationBenefit = '';
    if (location === 'hyderabad' && 'micro_market' in property && property.micro_market) {
      locationBenefit = `Prime location in ${property.micro_market} – Easy access to ORR & IT hubs`;
    } else if (location === 'goa' && 'beach_proximity' in property && property.beach_proximity) {
      locationBenefit = `${property.beach_proximity} from beach – Perfect holiday home`;
    } else if (location === 'dubai' && 'community' in property && property.community) {
      locationBenefit = `Prestigious ${property.community} community – World-class amenities`;
    }
    
    // Get selling points from unique features or defaults
    const layoutHighlight = property.unique_features[0] || 'Spacious layout | Great ventilation';
    const communityHighlight = property.unique_features[1] || 'Premium community with modern amenities';
    
    // Get absolute image URL
    const heroImage = this.getAbsoluteImageUrl(
      property.main_image_url || property.image_gallery[0] || ''
    );
    
    return {
      projectName,
      location: propertyLocation,
      areaSize,
      bhkType,
      floorRange: floorRange || undefined,
      facing,
      parking,
      layoutHighlight,
      communityHighlight,
      keyAmenities,
      locationBenefit: locationBenefit || undefined,
      heroImage,
      officeAddress: officeInfo.address,
      officePhone: officeInfo.phone,
      officeEmail: officeInfo.email,
      officeHours: officeInfo.businessHours
    };
  }

  private static getAbsoluteImageUrl(imageUrl: string): string {
    if (!imageUrl) return '/placeholder.svg';
    if (imageUrl.startsWith('http')) return imageUrl;
    if (imageUrl.startsWith('/')) return `${window.location.origin}${imageUrl}`;
    return `${window.location.origin}/${imageUrl}`;
  }

  static async generatePropertyDetailsPDF(data: PropertyPDFData): Promise<void> {
    const pdf = new jsPDF('p', 'mm', 'a4');
    let yPosition = 0;

    try {
      // 1. Add Hero Image Cover
      yPosition = await this.addHeroImageCover(pdf, data.heroImage);
      
      // 2. Add Structured Content with Emojis
      yPosition = await this.addStructuredContent(pdf, data, yPosition);
      
      // 3. Add Office Footer
      this.addOfficeFooter(pdf, data);
      
      // 4. Save with proper filename
      const fileName = `${data.projectName.replace(/[^a-z0-9]/gi, '_')}_${data.bhkType.replace(/[^a-z0-9]/gi, '_')}_Details.pdf`;
      pdf.save(fileName);
      
    } catch (error) {
      console.error('Error generating PDF:', error);
      throw new Error('Failed to generate property details PDF');
    }
  }

  private static async addHeroImageCover(pdf: InstanceType<typeof jsPDF>, imageUrl: string): Promise<number> {
    const pageWidth = pdf.internal.pageSize.getWidth();
    const coverHeight = 100;
    
    try {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      
      await new Promise((resolve, reject) => {
        img.onload = resolve;
        img.onerror = reject;
        img.src = imageUrl;
      });

      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      canvas.width = 800;
      canvas.height = 500;
      
      if (ctx) {
        ctx.drawImage(img, 0, 0, 800, 500);
        const imgData = canvas.toDataURL('image/jpeg', 0.9);
        
        pdf.addImage(imgData, 'JPEG', 0, 0, pageWidth, coverHeight);
      }
    } catch (error) {
      console.warn('Failed to load hero image:', error);
      // Add placeholder
      pdf.setFillColor(220, 220, 220);
      pdf.rect(0, 0, pageWidth, coverHeight, 'F');
      pdf.setFontSize(16);
      pdf.setTextColor(100, 100, 100);
      pdf.text('Property Image', pageWidth / 2, coverHeight / 2, { align: 'center' });
    }
    
    return coverHeight + 15;
  }

  private static async addStructuredContent(pdf: InstanceType<typeof jsPDF>, data: PropertyPDFData, startY: number): Promise<number> {
    const margin = 20;
    const pageWidth = pdf.internal.pageSize.getWidth();
    let yPosition = startY;
    
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(12);
    pdf.setTextColor(0, 0, 0);
    
    const lineHeight = 10;
    const lines = [];
    
    // Build content lines with emojis
    lines.push({
      emoji: '🏢',
      text: `${data.projectName} – ${data.location}`,
      bold: true
    });
    
    lines.push({
      emoji: '✨',
      text: `${data.areaSize} | ${data.bhkType}`,
      bold: false
    });
    
    if (data.unitNumber && data.floorRange) {
      lines.push({
        emoji: '📍',
        text: `${data.unitNumber} | ${data.floorRange}`,
        bold: false
      });
    } else if (data.floorRange) {
      lines.push({
        emoji: '📍',
        text: data.floorRange,
        bold: false
      });
    }
    
    if (data.facing) {
      lines.push({
        emoji: '🧭',
        text: data.facing,
        bold: false
      });
    }
    
    if (data.parking) {
      lines.push({
        emoji: '🚗',
        text: data.parking,
        bold: false
      });
    }
    
    if (data.layoutHighlight) {
      lines.push({
        emoji: '🏡',
        text: data.layoutHighlight,
        bold: false
      });
    }
    
    if (data.communityHighlight) {
      lines.push({
        emoji: '🌳',
        text: data.communityHighlight,
        bold: false
      });
    }
    
    if (data.keyAmenities.length > 0) {
      lines.push({
        emoji: '⚡',
        text: data.keyAmenities.join(' | '),
        bold: false
      });
    }
    
    if (data.locationBenefit) {
      lines.push({
        emoji: '🎯',
        text: data.locationBenefit,
        bold: false
      });
    }
    
    // Render lines
    lines.forEach(line => {
      if (yPosition > pdf.internal.pageSize.getHeight() - 30) {
        pdf.addPage();
        yPosition = 20;
      }
      
      // Emoji
      pdf.setFontSize(14);
      pdf.text(line.emoji, margin, yPosition);
      
      // Text
      pdf.setFontSize(12);
      pdf.setFont('helvetica', line.bold ? 'bold' : 'normal');
      
      const textContent = line.text;
      const maxWidth = pageWidth - margin - 30;
      const splitText = pdf.splitTextToSize(textContent, maxWidth);
      
      pdf.text(splitText, margin + 12, yPosition);
      yPosition += splitText.length * 7 + 5;
    });
    
    return yPosition;
  }

  private static addOfficeFooter(pdf: InstanceType<typeof jsPDF>, data: PropertyPDFData): void {
    const pageHeight = pdf.internal.pageSize.getHeight();
    const pageWidth = pdf.internal.pageSize.getWidth();
    const margin = 20;
    const footerY = pageHeight - 35;
    
    // Footer background
    pdf.setFillColor(245, 245, 245);
    pdf.rect(0, footerY - 5, pageWidth, 40, 'F');
    
    // Office Details Title
    pdf.setFontSize(10);
    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(0, 0, 0);
    pdf.text('Office Details', margin, footerY);
    
    // Office Address
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(9);
    const addressLines = pdf.splitTextToSize(data.officeAddress, pageWidth - 2 * margin);
    pdf.text(addressLines, margin, footerY + 5);
    
    // Office Contact
    const contactY = footerY + 5 + (addressLines.length * 4);
    pdf.text(`📞 ${data.officePhone} | ✉️ ${data.officeEmail}`, margin, contactY);
    
    // Business Hours
    const hoursLines = pdf.splitTextToSize(`⏰ ${data.officeHours}`, pageWidth - 2 * margin);
    pdf.text(hoursLines, margin, contactY + 5);
  }
}
