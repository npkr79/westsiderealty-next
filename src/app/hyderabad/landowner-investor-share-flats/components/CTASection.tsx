import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Phone, MessageCircle, ArrowRight } from "lucide-react";
import Link from "next/link";

export function CTASection() {
  return (
    <section className="container mx-auto px-4 py-16">
      <div className="max-w-4xl mx-auto">
        <Card className="bg-gradient-to-br from-primary/10 to-secondary/10 border-2 border-primary/20">
          <CardContent className="p-12 text-center">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              Find Your Perfect Landowner Share Flat Today
            </h2>
            <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto">
              Get exclusive access to verified landowner and investor share units. Our experts will help you find the
              best deals across Hyderabad.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button asChild size="lg" className="bg-slate-900 hover:bg-slate-800 text-white">
                <Link href="tel:+919866085831">
                  <Phone className="mr-2 h-5 w-5" />
                  Call: +91 9866085831
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline">
                <Link href="https://wa.me/919866085831" target="_blank" rel="noopener noreferrer">
                  <MessageCircle className="mr-2 h-5 w-5" />
                  WhatsApp Us
                </Link>
              </Button>
              <Button asChild size="lg" variant="default">
                <Link href="/contact">
                  Get Expert Advice
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </section>
  );
}

