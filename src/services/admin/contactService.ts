
export interface ContactInfo {
  address: string;
  phone: string;
  email: string;
  businessHours: string;
}

class ContactService {
  private static instance: ContactService;
  public static getInstance(): ContactService {
    if (!ContactService.instance) {
      ContactService.instance = new ContactService();
    }
    return ContactService.instance;
  }

  getContactInfo(): ContactInfo {
    const contactInfo = localStorage.getItem('contactInfo');
    if (!contactInfo) {
      const defaultContactInfo: ContactInfo = {
        address: '415, 4th Floor, Kokapet Terminal\nKokapet, Hyderabad – 500075',
        phone: '+91 9866085831',
        email: 'info@westsiderealty.in',
        businessHours: 'Monday - Saturday\n9:00 AM - 7:00 PM'
      };
      this.saveContactInfo(defaultContactInfo);
      return defaultContactInfo;
    }
    return JSON.parse(contactInfo);
  }

  saveContactInfo(contactInfo: ContactInfo): void {
    localStorage.setItem('contactInfo', JSON.stringify(contactInfo));
  }
}

export const contactService = ContactService.getInstance();
