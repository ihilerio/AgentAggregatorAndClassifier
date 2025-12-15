import { ICompanyInfo } from "./ICompanyInfo";

// GRAPH State Definition
export interface ICompanyInfoGraphState {
  userInput: string;
  companyName: string;
  companyInfoOpenAI: ICompanyInfo;
  companyInfoClaude: ICompanyInfo;
  mergedResult: ICompanyInfo;
  classification: string;
}
