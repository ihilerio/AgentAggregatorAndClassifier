import express from "express";
import bodyParser from "body-parser";
import FormData from "form-data";
import OpenAI from "openai";
import { CompanyInfoGraph, log } from "../dist/agents/BusinessLookup.js";
import { ICompanyInfoGraphState } from "../dist/interfaces/ICompanyInfoGraphState.js";

// Creates and configures an ExpressJS web server.
class App {
  // ref to Express instance
  public express: express.Application;
  public openai: any;
  public upload: any;

  //Run configuration methods on the Express instance.
  constructor(openAIKey: string) {
    this.express = express();
    this.initOpenAI(openAIKey);
    this.middleware();
    this.routes();
  }

  // Configure Express middleware.
  private middleware(): void {
    this.express.use(bodyParser.json());
    this.express.use(bodyParser.urlencoded({ extended: false }));
    this.express.use(async (req, res, next) => {
      res.header("Access-Control-Allow-Origin", "*");
      res.header(
        "Access-Control-Allow-Headers",
        "Origin, X-Requested-With, Content-Type, Accept",
      );
      next();
    });
  }

  private initOpenAI(openAIKey): void {
    this.openai = new OpenAI({
      apiKey: openAIKey,
    });
  }

  //If this was a production app, you would want to:
  // 1. Add proper error handling and authentication
  // 2. Validate and sanitize input data
  // 3. Use HTTPS and other security best practices
  // 4. Implement rate limiting and logging
  // 5. Structure the project for scalability and maintainability by moving these routes into their own modules

  // Configure API endpoints.
  private routes(): void {
    let router = express.Router();

    // Defines a POST endpoint for the agent Business Lookup
    router.post("/agent/aggregator", async (req, res, next) => {
      try {
        let payload: { userInput: string } = req.body;
        let userInputPayload = payload.userInput;
        log("REST API userInput Request: " + userInputPayload);

        const result: ICompanyInfoGraphState = await CompanyInfoGraph.invoke({
          userInput: userInputPayload,
        });

        log("=====BEGIN RESULTS======");
        log("userInput: " + result.userInput);
        log("companyName: " + result.companyName);
        log("companyInfoOpenAI: " + JSON.stringify(result.companyInfoOpenAI));
        log("companyInfoClaude: " + JSON.stringify(result.companyInfoClaude));
        log("mergedResult: " + JSON.stringify(result.mergedResult));
        log("classification: " + result.classification);
        log("=====END RESULTS========");
        res.json({
          companyInfo: result.mergedResult,
          classification: result.classification,
        });
      } catch (error) {
        log(error);
      }
    });

    // Defines a POST endpoint for the classification of the business based on market cap and employees
    router.post("/company/classification", async (req, res, next) => {
      try {
        let payload: { marketCap: string; employees: string } = req.body;
        let marketcapValue = payload.marketCap;
        let employeesValue = payload.employees;
        log("market cap value: " + marketcapValue);
        log("number of employees value: " + employeesValue);

        if (marketcapValue == null || employeesValue == null) {
          log("Market Cap or number of Employees value is null");
          log("Returning classification as Unknown");
          res.json({ classification: "Unknown" });
          return;
        } else if (marketcapValue.includes("trillion")) {
          log("Returning classification as High");
          res.json({ classification: "High" });
        } else if (marketcapValue.includes("billion")) {
          log("Returning classification as Medium");
          res.json({ classification: "Medium" });
        } else if (marketcapValue.includes("million")) {
          log("Returning classification as Low");
          res.json({ classification: "Low" });
        } else {
          log("Returning classification as Not Sure");
          res.json({ classification: "Not Sure" });
        }
      } catch (error) {
        log(error);
      }
    });

    this.express.use("/", router);
    this.express.use("/", express.static("./build"));
  }
}

export { App };
