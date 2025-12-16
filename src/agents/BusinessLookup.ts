import { StateGraph, START, END, Annotation } from "@langchain/langgraph";
import { ChatOpenAI } from "@langchain/openai";
import { ChatAnthropic } from "@langchain/anthropic";
import { ChatOllama } from "@langchain/ollama";
import { ChatPromptTemplate } from "@langchain/core/prompts";
import { ICompanyInfoGraphState } from "../interfaces/ICompanyInfoGraphState.js";
import { ICompanyInfo } from "../interfaces/ICompanyInfo.js";
import { z } from "zod";

// Define state using Annotation API
const CompanyInfoGraphAnnotation = Annotation.Root({
  userInput: Annotation<string>,
  companyName: Annotation<string>,
  companyInfoOpenAI: Annotation<ICompanyInfo>,
  companyInfoClaude: Annotation<ICompanyInfo>,
  mergedResult: Annotation<ICompanyInfo>,
  classification: Annotation<string>,
});

// JSON Return Schemas

// Schema for extracting company information
const CompanyInfoSchema = z.object({
  companyName: z.string(),
  founded: z.string(),
  ticker: z.string(),
  marketCap: z.string(),
  employees: z.string(),
  businessAreas: z.array(z.string()),
  competitors: z.array(z.string()),
});

// Schema for extracting company name
const CompanyNameSchema = z.object({
  company_name: z.string(),
});

//PROMPT Definitions

// Define the prompt template to retrieve the company information
const prompt = ChatPromptTemplate.fromMessages([
  [
    "system",
    "always return a JSON and make sure Business Areas and Competitors are arrays.",
  ],
  [
    "user",
    "Provide information about {companyName} including: Founded, Ticker, MarketCap, Employees, BusinessAreas, and Competitors.",
  ],
]);

// Define the prompt template to extract the company name from user input
const companyPrompt = ChatPromptTemplate.fromMessages([
  [
    "system",
    "Always return a JSON with a company_name field and the answer as the value. If the company name is a stock ticker, return the full company name. Just answer the question and DON'T REPEAT THE QUESTION IN THE RESULT. If the result is a stock ticker, replace it with the full company name.",
  ],
  ["user", "{userInput}"],
]);

// Define the prompt template to merge the results from OpenAI and Claude
const mergePrompt = ChatPromptTemplate.fromMessages([
  [
    "system",
    `Always return a JSON output and follow these instructions: \n
        1. For companyName, founded, ticker, marketCap, and employees properties follow these rules: If there are fields with the same name that have the same values, only use one of those values. If there are fields with different values, include both values and separate them by a dash.\n
        2. For businessAreas and competitors, If the array values are duplicated, merge them into a single value. If array values contains different values, make sure both values are added to the list as individual entries and don't combine them with dashes.\n 
        3. Ensure businessAreas and competitors are arrays in the final output.\n
        4. Don't repeat the question. JUST RETURN THE AGGREGATED INFORMATION AS A JSON.`,
  ],
  [
    "user",
    "Combine INPUT1 and INPUT2 into a single JSON result. INPUT1:{input1} INPUT2:{input2}<|endofprompt|>",
  ],
]);

// Define the function to query company information from OpenAI
async function queryCompanyInfoOpenAI(state: ICompanyInfoGraphState) {
  try {
    // Define the model to use for querying company information from OpenAI
    const openAiModel = new ChatOpenAI({
      apiKey: process.env.OPENAI_SECRET_KEY,
      model: "gpt-3.5-turbo",
      temperature: 0,
      maxTokens: 512,
    });

    // @ts-ignore - Bypass deep type instantiation error
    const structuredModel = openAiModel.withStructuredOutput(CompanyInfoSchema);

    const chain = prompt.pipe(structuredModel);
    const response = await chain.invoke({
      companyName: state.companyName,
    });

    log("GPT Company Info result:" + JSON.stringify(response).toLowerCase());

    //set state in graph
    return {
      companyInfoOpenAI: response as ICompanyInfo,
    };
  } catch (e) {
    log(e);
    throw e;
  }
}

// Define the function to query company information from Claude
async function queryCompanyInfoClaude(state: ICompanyInfoGraphState) {
  try {
    // Define the model to use for querying company information from Claude
    const claudeModel = new ChatAnthropic({
      apiKey: process.env.ANTHROPIC_SECRET_KEY,
      model: "claude-sonnet-4-20250514",
      temperature: 0,
      maxTokens: 512,
    });

    // @ts-ignore - Bypass deep type instantiation error
    const structuredModel: any =
      claudeModel.withStructuredOutput(CompanyInfoSchema);

    const chain = prompt.pipe(structuredModel);
    const response = await chain.invoke({
      companyName: state.companyName,
    });

    log("Claude Company Info result:" + JSON.stringify(response).toLowerCase());

    //set state in graph
    return {
      companyInfoClaude: response as ICompanyInfo,
    };
  } catch (e) {
    log(e);
    throw e;
  }
}

// Define the function to extract company name from user input
async function getCompanyName(state: ICompanyInfoGraphState) {
  try {
    // Define the model to use for extracting the company name
    const llama3_2Model = new ChatOllama({
      model: "llama3.2",
      temperature: 0,
      numPredict: 256,
      format: "json",
    });

    let userInputPrompt: string = state.userInput;

    // Simple check to see if user input is just a company name (no spaces)
    if (!state.userInput.trim().includes(" ")) {
      userInputPrompt =
        "What is the full company name for this value: " +
        state.userInput +
        "?";
      log(
        "New user input prompt for company name extraction: " + userInputPrompt,
      );
    }

    // @ts-ignore - Bypass deep type instantiation error
    const structuredModel: any =
      llama3_2Model.withStructuredOutput(CompanyNameSchema);

    const chain = companyPrompt.pipe(structuredModel);
    const response: any = await chain.invoke({
      userInput: userInputPrompt,
    });

    log("Response for Ollama Company Name:" + response.company_name);

    //set state in graph
    return {
      companyName: response.company_name,
    };
  } catch (e) {
    log(e);
    throw e;
  }
}

// Define the function to merge the results from OpenAI and Claude
async function mergeResults(state: ICompanyInfoGraphState) {
  log("Company Info from OpenAI: " + JSON.stringify(state.companyInfoOpenAI));
  log("Company Info from Claude: " + JSON.stringify(state.companyInfoClaude));

  try {
    // Define the model to merge the results
    const llama3_2Model = new ChatOllama({
      model: "llama3.2",
      temperature: 0,
      numPredict: 512,
      format: "json",
    });

    //@ts-ignore - Bypass deep type instantiation error
    const chain = mergePrompt.pipe(llama3_2Model);

    const response: any = await chain.invoke({
      input1: JSON.stringify(state.companyInfoOpenAI),
      input2: JSON.stringify(state.companyInfoClaude),
    });

    const mergedContent: ICompanyInfo = JSON.parse(
      response.content,
    ) as ICompanyInfo;

    log("Merged Company Information:" + mergedContent);

    //set state in graph
    return {
      mergedResult: mergedContent,
    };
  } catch (e) {
    log(e);
    throw e;
  }
}

// Define the function to classify the merged result
async function classifyResult(state: ICompanyInfoGraphState) {
  try {
    const mergedResultsObj: ICompanyInfo = state.mergedResult;

    const classifierURL = process.env.CLASSIFIER_ENDPOINT;

    // Call the classifier API with the number of employees and market cap information
    const resp = await fetch(classifierURL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        employees: mergedResultsObj.employees,
        marketCap: mergedResultsObj.marketCap,
      }),
    });
    const classificationValue = await resp.json();

    log("Returned Classification Value:" + classificationValue.classification);

    //set state in graph
    return {
      classification: classificationValue.classification,
    };
  } catch (e) {
    log(e);
    throw e;
  }
}

function log(message): void {
  console.log("\n" + message);
}

// Build the state graph using the Annotation API
const graphBuilder = new StateGraph(CompanyInfoGraphAnnotation)
  // Define the nodes of the graph
  .addNode("getCompanyName", getCompanyName)
  .addNode("queryCompanyInfoClaude", queryCompanyInfoClaude)
  .addNode("queryCompanyInfoOpenAI", queryCompanyInfoOpenAI)
  .addNode("mergeResults", mergeResults)
  .addNode("classifyResult", classifyResult)
  // Define the edges of the graph
  .addEdge(START, "getCompanyName")
  .addEdge("getCompanyName", "queryCompanyInfoClaude")
  .addEdge("getCompanyName", "queryCompanyInfoOpenAI")
  .addEdge("queryCompanyInfoClaude", "mergeResults")
  .addEdge("queryCompanyInfoOpenAI", "mergeResults")
  .addEdge("mergeResults", "classifyResult")
  .addEdge("classifyResult", END);

// Compile the agent graph
const CompanyInfoGraph = graphBuilder.compile();

export { CompanyInfoGraph, log };
