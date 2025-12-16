interface AgentAggregatorComponentProps {
    userInput: string;
}

interface CompanyInfo {
    companyName: string;
    founded: string;
    ticker: string;
    marketCap: string;
    employees: string;
    businessAreas: string[];
    competitors: string[];
}

interface AgentResponse {
    companyInfo: CompanyInfo;
    classification: string;
}

export { AgentAggregatorComponentProps, CompanyInfo, AgentResponse };