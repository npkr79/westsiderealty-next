import { SampleResponseGenerator } from '@/components/admin/SampleResponseGenerator';

export default function SampleResponsesPage() {
  return (
    <div className="container mx-auto py-8 px-4">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Sample Response Generator</h1>
        <p className="text-muted-foreground mt-2">
          Generate sample text responses for real estate content with customizable context and tone.
        </p>
      </div>
      
      <SampleResponseGenerator 
        showAdvancedOptions={true}
        enableSaveToHistory={true}
        onGenerate={(response) => {
          console.log('Generated response:', response);
        }}
        onError={(error) => {
          console.error('Generation error:', error);
        }}
      />
    </div>
  );
}