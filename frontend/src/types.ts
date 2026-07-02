export interface CaseFile {
  reference_number: string;
  title: string;
  registry: 'CRIMINAL' | 'CIVIL' | 'SUCCESSION';
  status: 'ACTIVE' | 'CLOSED' | 'ARCHIVED';
  current_location: string | null;
  created_at: string;
}
