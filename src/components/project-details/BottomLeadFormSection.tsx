import LeadForm from "@/components/property/ContactForm"; // reuse existing lead/contact form if available
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface BottomLeadFormSectionProps {
  projectName?: string;
}

export default function BottomLeadFormSection({
  projectName,
}: BottomLeadFormSectionProps) {
  return (
    <section className="mt-12 mb-8">
      <Card>
        <CardHeader>
          <CardTitle>
            Interested in {projectName || "this project"}?
          </CardTitle>
        </CardHeader>
        <CardContent>
          {/* This assumes ContactForm is a generic lead form component */}
          <LeadForm />
        </CardContent>
      </Card>
    </section>
  );
}


