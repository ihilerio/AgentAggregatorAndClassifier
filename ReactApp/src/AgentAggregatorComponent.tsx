import React from "react";
import Button from "react-bootstrap/Button";
import Container from "react-bootstrap/Container";
import Row from "react-bootstrap/Row";
import Col from "react-bootstrap/Col";

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

const AgentAggregatorComponent: React.FC<AgentAggregatorComponentProps> = ({
  userInput,
}) => {
  // State for user input
  const [userPrompt, setUserPrompt] = React.useState("");

  // State for the API response - THIS WAS MISSING!
  const [response, setResponse] = React.useState<AgentResponse>({
    companyInfo: {
      companyName: "",
      founded: "",
      ticker: "",
      marketCap: "",
      employees: "",
      businessAreas: [],
      competitors: [],
    },
    classification: "",
  });

  // Loading state (optional but recommended)
  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  async function handleSubmit() {
    const agentURL = "/agent/aggregator";

    console.log("User Prompt: " + userPrompt);
    const payload = { userInput: userPrompt };
    console.log("Payload: " + JSON.stringify(payload));

    try {
      setIsLoading(true);
      setError(null);

      // Trigger the Agent Execution
      const resp = await fetch(agentURL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (!resp.ok) {
        throw new Error(`HTTP error! status: ${resp.status}`);
      }

      const agentResult = await resp.json();
      console.log("Agent Result: " + JSON.stringify(agentResult));

      setResponse(agentResult);
    } catch (err) {
      console.error("Error fetching data:", err);
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <>
      <Container className="bg-body-secondary">
        <Row style={{ height: "60px" }}></Row>
        <Row>
          <Col className="col-12">
            <h2 className="text-center">Agent Aggregator Application</h2>
          </Col>
        </Row>
        <Row style={{ height: "60px" }}></Row>
        <Row className="bg-body-secondary">
          <Col className="col-1"></Col>
          <Col className="col-10 text-start">
            <label htmlFor="userInput">
              Enter the name of the company you would like to get financial
              information from? If you don't know the name, provide us a fact
              about the company so we can deduce it.
            </label>
          </Col>
          <Col className="col-1"></Col>
        </Row>
        <Row style={{ height: "20px" }}></Row>
        <Row>
          <Col className="col-1"></Col>
          <Col className="col-8">
            <input
              type="text"
              id="userInput"
              name="userInput"
              placeholder={userInput}
              value={userPrompt}
              onChange={(e) => setUserPrompt(e.target.value)}
              style={{
                width: "100%",
                padding: "8px",
                boxSizing: "border-box",
                color: "gray",
              }}
              disabled={isLoading}
            />
          </Col>
          <Col className="col-2">
            <Button
              className="bg-secondary"
              onClick={handleSubmit}
              disabled={isLoading || !userPrompt.trim()}
            >
              {isLoading ? "Loading..." : "Submit"}
            </Button>
          </Col>
        </Row>

        {/* Error display */}
        {error && (
          <Row style={{ marginTop: "20px" }}>
            <Col className="col-1"></Col>
            <Col className="col-10">
              <div className="alert alert-danger" role="alert">
                Error: {error}
              </div>
            </Col>
            <Col className="col-1"></Col>
          </Row>
        )}

        <Row style={{ height: "60px" }}></Row>

        {/* Loading indicator */}
        {isLoading && (
          <Row>
            <Col className="col-12 text-center">
              <div
                className="spinner-border text-primary"
                role="status"
                style={{ width: "3rem", height: "3rem" }}
              >
                <span className="visually-hidden">Loading...</span>
              </div>
              <p className="mt-3 text-muted">Fetching company information...</p>
            </Col>
          </Row>
        )}

        {/* Results - only show when not loading */}
        {!isLoading && (
          <Row>
            <Col className="col-1"></Col>
            <Col className="col-10">
              <Container style={{ marginTop: "20px" }}>
                <Row
                  className="gy-3 bg-secondary"
                  style={{ minHeight: "80px" }}
                >
                  <Col className="col-1"></Col>
                  <Col className="col-3">
                    <h4 className="text-white text-start">Category</h4>
                  </Col>
                  <Col className="col-8">
                    <h4 className="text-white text-start">Information</h4>
                  </Col>
                </Row>
                <Row
                  className="bg-dark-subtle gy-3"
                  style={{ minHeight: "80px" }}
                >
                  <Col className="col-1"></Col>
                  <Col className="col-3">
                    <div className="fw-bold text-start">Company Name</div>
                  </Col>
                  <Col className="col-8">
                    <div className="text-muted text-start">
                      {response.companyInfo.companyName || "N/A"}
                    </div>
                  </Col>
                </Row>
                <Row className="bg-light gy-3" style={{ minHeight: "80px" }}>
                  <Col className="col-1"></Col>
                  <Col className="col-3">
                    <div className="fw-bold text-start">Founded</div>
                  </Col>
                  <Col className="col-8">
                    <div className="text-muted text-start">
                      {response.companyInfo.founded || "N/A"}
                    </div>
                  </Col>
                </Row>
                <Row
                  className="bg-dark-subtle gy-3"
                  style={{ minHeight: "80px" }}
                >
                  <Col className="col-1"></Col>
                  <Col className="col-3">
                    <div className="fw-bold text-start">Stock Ticker</div>
                  </Col>
                  <Col className="col-8">
                    <div className="text-muted text-start">
                      {response.companyInfo.ticker || "N/A"}
                    </div>
                  </Col>
                </Row>
                <Row className="bg-light gy-3" style={{ minHeight: "80px" }}>
                  <Col className="col-1"></Col>
                  <Col className="col-3">
                    <div className="fw-bold text-start">Market Cap</div>
                  </Col>
                  <Col className="col-8">
                    <div className="text-muted text-start">
                      {response.companyInfo.marketCap || "N/A"}
                    </div>
                  </Col>
                </Row>
                <Row
                  className="bg-dark-subtle gy-3"
                  style={{ minHeight: "80px" }}
                >
                  <Col className="col-1"></Col>
                  <Col className="col-3">
                    <div className="fw-bold text-start">Employees</div>
                  </Col>
                  <Col className="col-8">
                    <div className="text-muted text-start">
                      {response.companyInfo.employees || "N/A"}
                    </div>
                  </Col>
                </Row>
                <Row className="bg-light" style={{ minHeight: "80px" }}>
                  <Col className="col-1"></Col>
                  <Col className="col-3 gy-3">
                    <div className="fw-bold text-start">Business Areas</div>
                  </Col>
                  <Col className="col-8">
                    <div className="text-muted text-start">
                      {response.companyInfo.businessAreas.length > 0
                        ? response.companyInfo.businessAreas.map(
                            (item, index) => (
                              <span key={index}>
                                {item}
                                {index <
                                response.companyInfo.businessAreas.length - 1
                                  ? ", "
                                  : ""}
                              </span>
                            ),
                          )
                        : "N/A"}
                    </div>
                  </Col>
                </Row>
                <Row className="bg-dark-subtle" style={{ minHeight: "80px" }}>
                  <Col className="col-1"></Col>
                  <Col className="col-3 gy-3">
                    <div className="fw-bold text-start">Competitors</div>
                  </Col>
                  <Col className="col-8">
                    <div className="text-muted text-start">
                      {response.companyInfo.competitors.length > 0
                        ? response.companyInfo.competitors.map(
                            (item, index) => (
                              <span key={index}>
                                {item}
                                {index <
                                response.companyInfo.competitors.length - 1
                                  ? ", "
                                  : ""}
                              </span>
                            ),
                          )
                        : "N/A"}
                    </div>
                  </Col>
                </Row>

                {/* Classification display */}
                {response.classification && (
                  <Row className="bg-light gy-3" style={{ minHeight: "60px" }}>
                    <Col className="col-1"></Col>
                    <Col className="col-3">
                      <div className="fw-bold text-start">Classification</div>
                    </Col>
                    <Col className="col-8">
                      <div className="text-muted text-start">
                        {response.classification}
                      </div>
                    </Col>
                  </Row>
                )}
              </Container>
            </Col>
            <Col className="col-1"></Col>
          </Row>
        )}
        <Row style={{ height: "80px" }}></Row>
      </Container>
    </>
  );
};

export default AgentAggregatorComponent;
