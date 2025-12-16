
import { LandingPageLead } from '@/types/landingPageLead';

export class LandingPageLeadsExport {
  exportToCsv(leads: LandingPageLead[]): void {
    if (!leads || leads.length === 0) {
      alert('No leads to export');
      return;
    }

    // Define CSV headers
    const headers = [
      'Name',
      'Phone',
      'Email',
      'Message',
      'Source Page URL',
      'Landing Page ID',
      'Created At',
      'Updated At'
    ];

    // Convert leads to CSV rows
    const csvData = leads.map(lead => [
      lead.name || '',
      lead.phone || '',
      lead.email || '',
      lead.message || '',
      lead.source_page_url || '',
      lead.landing_page_id || '',
      lead.created_at || '',
      lead.updated_at || ''
    ]);

    // Combine headers and data
    const csvContent = [
      headers.join(','),
      ...csvData.map(row => 
        row.map(cell => 
          typeof cell === 'string' && cell.includes(',') 
            ? `"${cell.replace(/"/g, '""')}"` 
            : cell
        ).join(',')
      )
    ].join('\n');

    // Create and download the file
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    
    link.setAttribute('href', url);
    link.setAttribute('download', `landing_page_leads_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
}
