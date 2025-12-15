// Company Information to retrieve from LLM queries
export interface ICompanyInfo {
  companyName: string;
  founded: string;
  ticker: string;
  marketCap: string;
  employees: string;
  businessAreas: string[];
  competitors: string[];
}
