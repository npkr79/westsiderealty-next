
export interface Testimonial {
  id: string;
  name: string;
  location: string;
  text: string;
  rating: number;
}

// Default sample testimonials (only set if explicitly reset by admin)
const defaultTestimonials: Testimonial[] = [
  {
    id: '1',
    name: 'Arvind & Neha',
    location: 'Narsingi Villa Purchase',
    text: 'Thanks to RE/MAX Westside Realty, we found a beautiful villa in Narsingi within 10 days. Truly professional and responsive team!',
    rating: 5
  },
  {
    id: '2',
    name: 'Priya M.',
    location: 'Goa Investment Property',
    text: 'My Goa property is now generating 8% annual rental returns. Great guidance from the Westside Realty team.',
    rating: 5
  },
  {
    id: '3',
    name: 'Rajesh K.',
    location: 'Dubai Investment',
    text: 'Invested in a Dubai off-plan project through their advisory. The process was transparent and well-guided throughout.',
    rating: 5
  }
];

class TestimonialService {
  private static instance: TestimonialService;
  public static getInstance(): TestimonialService {
    if (!TestimonialService.instance) {
      TestimonialService.instance = new TestimonialService();
    }
    return TestimonialService.instance;
  }

  // Only returns array or empty array
  getTestimonials(): Testimonial[] {
    try {
      const testimonialsJson = localStorage.getItem('testimonials');
      if (!testimonialsJson) {
        // Do not write sample data by default, just return empty
        return [];
      }
      const parsed = JSON.parse(testimonialsJson);
      if (Array.isArray(parsed)) return parsed;
      return [];
    } catch (err) {
      console.error("[testimonialService] Error reading testimonials from LS:", err);
      return [];
    }
  }

  saveTestimonials(testimonials: Testimonial[]): void {
    localStorage.setItem('testimonials', JSON.stringify(testimonials));
  }

  addTestimonial(testimonial: Omit<Testimonial, 'id'>): void {
    const testimonials = this.getTestimonials();
    const newTestimonial = {
      ...testimonial,
      id: Date.now().toString()
    };
    testimonials.push(newTestimonial);
    this.saveTestimonials(testimonials);
  }

  updateTestimonial(id: string, testimonial: Omit<Testimonial, 'id'>): void {
    const testimonials = this.getTestimonials();
    const index = testimonials.findIndex(t => t.id === id);
    if (index !== -1) {
      testimonials[index] = { ...testimonial, id };
      this.saveTestimonials(testimonials);
    }
  }

  deleteTestimonial(id: string): void {
    const testimonials = this.getTestimonials();
    const filtered = testimonials.filter(t => t.id !== id);
    this.saveTestimonials(filtered);
  }

  // Manual admin reset to sample testimonials (for debug/console use/etc)
  resetToDefaultTestimonials(): void {
    this.saveTestimonials(defaultTestimonials.map(t => ({
      ...t,
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
    })));
    console.warn("[testimonialService] All testimonials reset to default sample data.");
  }
}

export const testimonialService = TestimonialService.getInstance();
