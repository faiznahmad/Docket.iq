
export enum CourtType {
  CLERK = 'Clerk of Courts',
  COMMON_PLEAS = 'Common Pleas Court',
  COUNTY = 'County Court',
  PROBATE = 'Probate Court'
}

export interface CourtRecord {
  id: string;
  court_type: CourtType;
  county: string;
  case_number: string;
  party_name: string; // Keep for legacy/internal use
  plaintiff: string;
  defendant: string;
  filing_date: string;
  status: string;
  details: string;
  charges?: string;
  links?: string[];
}

export interface SearchFilters {
  name?: string;
  case_number?: string;
  start_date?: string;
  end_date?: string;
  court_type?: CourtType;
  county?: string;
  status?: string;
  page?: number;
  limit?: number;
}

export interface ScrapingLog {
  timestamp: string;
  message: string;
  type: 'info' | 'error' | 'success';
}
