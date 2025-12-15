import { StateGraph, START, END, Annotation } from "@langchain/langgraph";
import { ChatOpenAI } from "@langchain/openai";
import { ChatAnthropic } from "@langchain/anthropic";
import { ChatOllama } from "@langchain/ollama";
import { ChatPromptTemplate } from "@langchain/core/prompts";
import { z } from "zod";

// GRAPH State

// Define state interface explicitly
interface CompanyInfoGraphState {
    userInput: string;
    companyName: string;
    companyInfoOpenAI: string;
    companyInfoClaude: string;
    mergedResult: string;
    classification: string;
}

// Define state using Annotation API
const CompanyInfoGraphAnnotation = Annotation.Root({
    userInput: Annotation<string>,
    companyName: Annotation<string>,
    companyInfoOpenAI: Annotation<string>,
    companyInfoClaude: Annotation<string>,
    mergedResult: Annotation<string>,
    classification: Annotation<string>,
});

// JSON Return Schemas

// Remove type assertions - keep schemas simple
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

// Type for the structured output
type CompanyInfo = z.infer<typeof CompanyInfoSchema>;
type CompanyName = z.infer<typeof CompanyNameSchema>;

//PROMPT Definitions

// Define the prompt template to retrieve the company information
const prompt = ChatPromptTemplate.fromMessages([
    ["system", "always return a JSON and make sure Business Areas and Competitors are arrays."],
    ["user", "Provide information about {companyName} including: Founded, Ticker, MarketCap, Employees, BusinessAreas, and Competitors."]
]);

// Define the prompt template to extract the company name from user input
const companyPrompt = ChatPromptTemplate.fromMessages([
    ["system", "Always return a JSON with a company_name field and the answer as the value. If the company name is a stock ticker, return the full company name. Just answer the question and DON'T REPEAT THE QUESTION IN THE RESULT. If the result is a stock ticker, replace it with the full company name."],
    ["user", "{userInput}"]
]);

// Define the prompt template to merge the results from OpenAI and Claude
const mergePrompt = ChatPromptTemplate.fromMessages([
    ["system", "Always return a JSON output with the same format as the input JSON. If there are fields with the same name that have the same values, only use one of those values. If there are fields with different values, include both values and separate them by a dash. When the same fields contains an array value, merge the two array values associated with the same field into a single array value, DON'T REMOVE ANY VALUES FROM THE ARRAY. Don't repeat the question. JUST RETURN THE AGGREGATED INFORMATION AS A JSON and DON'T ADD ANY ADDITIONAL INFORMATION."],
    ["user", "Combine INPUT1 and INPUT2 into a single JSON result. INPUT1:{input1} INPUT2:{input2}<|endofprompt|>"],
]);

// Define the function to query company information from OpenAI
async function queryCompanyInfoOpenAI(state: CompanyInfoGraphState) {

    try {
        // Define the model to use for querying company information from OpenAI
        const openAiModel = new ChatOpenAI({
            apiKey: process.env.OPENAI_SECRET_KEY,
            model: "gpt-3.5-turbo",
            temperature: 0,
            maxTokens: 512,
        })

        // @ts-ignore - Bypass deep type instantiation error
        const structuredModel = openAiModel.withStructuredOutput(CompanyInfoSchema);

        const chain = prompt.pipe(structuredModel);
        const response: CompanyInfo = await chain.invoke({
            companyName: state.companyName
        })

        log('GPT Company Info result:' + JSON.stringify(response).toLowerCase());

        //set state in graph
        return {
            companyInfoOpenAI: JSON.stringify(response).toLowerCase(),
        };
    } catch (e) {
        log(e);
        throw e;
    }
}

// Define the function to query company information from Claude
async function queryCompanyInfoClaude(state: CompanyInfoGraphState) {

    try {
        // Define the model to use for querying company information from Claude
        const claudeModel = new ChatAnthropic({
            apiKey: process.env.ANTHROPIC_SECRET_KEY,
            model: "claude-sonnet-4-20250514",
            temperature: 0,
            maxTokens: 512,
        })

        // @ts-ignore - Bypass deep type instantiation error
        const structuredModel: any = claudeModel.withStructuredOutput(CompanyInfoSchema);

        const chain = prompt.pipe(structuredModel);
        const response: CompanyInfo = await chain.invoke({
            companyName: state.companyName
        })

        log('Claude Company Info result:' + JSON.stringify(response).toLowerCase());

        //set state in graph
        return {
            companyInfoClaude: JSON.stringify(response).toLowerCase(),
        };

    } catch (e) {
        log(e);
        throw e;
    }
}

// Define the function to extract company name from user input
async function getCompanyName(state: CompanyInfoGraphState) {

    try {
        // Define the model to use for extracting the company name
        const llama3_2Model = new ChatOllama({ 
            model: "llama3.2",
            temperature: 0,
            numPredict: 256,
            format: "json",
        })

        let userInputPrompt: string = state.userInput;

        // Simple check to see if user input is just a company name (no spaces) 
        if (!state.userInput.trim().includes(" ")) {
            userInputPrompt = "What is the full company name for this value: " + state.userInput + "?";
            log("New user input prompt for company name extraction: " + userInputPrompt);
        }

        // @ts-ignore - Bypass deep type instantiation error
        const structuredModel: any = llama3_2Model.withStructuredOutput(CompanyNameSchema);

        const chain = companyPrompt.pipe(structuredModel);
        const response: CompanyName = await chain.invoke({
            userInput: userInputPrompt,
        })

        log('Responce for Ollama Company Name:' + response.company_name);

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
async function mergeResults(state: CompanyInfoGraphState) {
    log("Company Info from OpenAI: " + state.companyInfoOpenAI);
    log("Company Info from Claude: " + state.companyInfoClaude);

    try {
        // Define the model to merge the results
        const llama3_2Model = new ChatOllama({ 
            model: "llama3.2",
            temperature: 0,
            numPredict: 512,
            format: "json",
        })

        // @ts-ignore - Bypass deep type instantiation error
        // const structuredModel: any = llama3_2Model.withStructuredOutput(CompanyInfoSchema);
        // const chain = mergePrompt.pipe(structuredModel);
        const chain = mergePrompt.pipe(llama3_2Model);

        const response = await chain.invoke({
            input1: state.companyInfoOpenAI,
            input2: state.companyInfoClaude,
        })

        const mergedResponse:string = response.content.toString().replace("\n", "");;

        log('Merged Company Information:' + mergedResponse);

        //set state in graph
        return {
            mergedResult: mergedResponse,
        };

    } catch (e) {
        log(e);
        throw e;
    }
}

// Define the function to classify the merged result
async function classifyResult(state: CompanyInfoGraphState) {
    try {
        const mergedResultsObj:any = JSON.parse(state.mergedResult);

        const classifierURL = process.env.CLASSIFIER_ENDPOINT;

        // Call the classifier API with the number of employees and market cap information
        const resp = await fetch(classifierURL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({"employees" : mergedResultsObj.employees, "marketcap" : mergedResultsObj.marketcap}),
        });
        const classificationValue = await resp.json();

        log("Returned Classification Value:" + classificationValue.classification);

        //set state in graph
        return {
            classification: classificationValue.classification,
        };
    }
    catch(e) {
        log(e);
        throw e;
    }
}

function log(message):void {
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

export {CompanyInfoGraph, log};