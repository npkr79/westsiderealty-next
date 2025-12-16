
export interface ServiceOverlays {
  hyderabadOverlay: {
    title: string;
    description: string;
  };
  goaOverlay: {
    title: string;
    description: string;
  };
  dubaiOverlay: {
    title: string;
    description: string;
  };
}

class ServiceOverlaysService {
  private static instance: ServiceOverlaysService;
  public static getInstance(): ServiceOverlaysService {
    if (!ServiceOverlaysService.instance) {
      ServiceOverlaysService.instance = new ServiceOverlaysService();
    }
    return ServiceOverlaysService.instance;
  }

  getServiceOverlays(): ServiceOverlays {
    const overlays = localStorage.getItem('serviceOverlays');
    if (!overlays) {
      const defaultOverlays: ServiceOverlays = {
        hyderabadOverlay: {
          title: 'Premium Properties',
          description: 'Trusted expertise in every transaction'
        },
        goaOverlay: {
          title: 'Holiday Investments',
          description: 'Your gateway to coastal lifestyle'
        },
        dubaiOverlay: {
          title: 'Global Opportunities',
          description: 'International real estate excellence'
        }
      };
      this.saveServiceOverlays(defaultOverlays);
      return defaultOverlays;
    }
    return JSON.parse(overlays);
  }

  saveServiceOverlays(overlays: ServiceOverlays): void {
    localStorage.setItem('serviceOverlays', JSON.stringify(overlays));
  }
}

export const serviceOverlaysService = ServiceOverlaysService.getInstance();
