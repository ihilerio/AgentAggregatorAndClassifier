PROJECT DESCRIPTION

This project provides a sample code for an Agentic Flow written in LangChain/LangGraph that aggregates financial information about a specific company and classifies the stability of a company. The goal is to show how agents can assist humans in their daily tasks.

TECHNOLOGIES USED

LLMs, LangChain, LangGraph, Ollama, NodeJS/Express, RAG (Retrieval‑Augmented Generation), OpenAI/GPT Model, Anthropic/Claude Model, Meta/Llama Model, and Zod.

PREREQUISITES

1. Install NodeJS
2. Install ollama and download the "Llama3.2" model or download a docker Ollama model. The project assumes that you are running a local copy.
3. Install Typescript compiler (tsc)
4. OpenAI Dev Account with a genreated OpenAI Secret Key (GPT Model: gpt-3.5-turbo)
5. Anthrophic Dev Account with a generated Claude Secret Key (Anthropic Model: claude-sonnet-4-20250514)

EXECUTION STEP

1. Run the ollama server on the same machine you are going to be executing the NodeJS/Express server
2. Execute "npm run build" to compile the Typescript files and generate a distribution "/dist" folder
3. Configure your OpenAI and Anthropic keys in the .env file
4. Execute "npm run start" to execute the server
5. Open the browser and navigate to "http://localhost:8181 to see the REACT Webapp associated with this sample. You can find the distribution code in the "/build" directory.

REACT APPLICATION

The source code for the REACT APP can be found under the "ReactApp/src" directory. To update it do the following:

1. Go to that directory
2. npm run build
3. Copy /build directory to the top level Agent directory under repo.

TEST INPUTS

You can use the following prompts to test the web app:

- What is the company that Jeff Bezos founded?
- What is the company that Bill Gates founded?
- Amazon
- MSFT
- Microsoft
