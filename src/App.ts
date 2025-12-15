import express from 'express';
import bodyParser from 'body-parser';
import multer from 'multer';
import FormData from 'form-data';
import OpenAI from 'openai';
import { CompanyInfoGraph, log } from '../dist/BusinessLookup.js';

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
    this.upload = multer();
    this.express.use(bodyParser.json());
    this.express.use(bodyParser.urlencoded({ extended: false }));
    this.express.use(async (req, res, next) => {
      res.header("Access-Control-Allow-Origin", "*");
      res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
      next();
    });
  }

  private initOpenAI(openAIKey): void {
    this.openai = new OpenAI({
      apiKey: openAIKey,
    });
  }

  // Configure API endpoints.
  private routes(): void {
    let router = express.Router();

    router.post("/api/transcribe", this.upload.single("file"), async (req, res) => {
      try {
          if (!req.file) {
            return res.status(400).json({ error: "No file uploaded" });
          }
          const file:any = req.file;

          // Create a File object from the buffer
          const audioFile = new File(
            [file.buffer], 
            file.originalname || 'audio.webm',
            { type: file.mimetype }
          );

          // Call OpenAI transcription API
          const result = await this.openai.audio.transcriptions.create({
            file: audioFile,
            model: "whisper-1",
          });

          res.json(result);
      } catch (err) {
        console.error("Transcription error:", err);
        res.status(500).json({ error: "Transcription failed", details: err.message });
      }
    });


    router.post('/agent/aggregator', async (req, res, next) => {
      try {
        let payload:any = req.body;
        let userInputPayload = payload.userInput;
        log('REST API userInput Request: '+ userInputPayload);
  
        const result = await CompanyInfoGraph.invoke({
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
        res.json({companyInfo: JSON.parse(result.mergedResult), classification: result.classification});
      } catch (error) {
        log(error);
      }
    });

    router.post('/company/classification', async (req, res, next) => {
      try {
        let payload:any = req.body;
        let marketcapValue = payload.marketcap;
        let employeesValue = payload.employees;
        log('market cap value: ' + marketcapValue);
        log('number of employees value: ' + employeesValue);

        if (marketcapValue == null || employeesValue == null) {
          log('Market Cap or number of Employees value is null');
          log('Returning classification as Unknown');
          res.json({classification: "Unknown"});
          return;
        }
        else if (marketcapValue.includes("trillion")) {
          log('Returning classification as High');
          res.json({classification: "High"});           
        }
        else if (marketcapValue.includes("billion")) {
          log('Returning classification as Medium');
          res.json({classification: "Medium"});
        }
        else if (marketcapValue.includes("million")) {
          log('Returning classification as Low');
          res.json({classification: "Low"});
        }
        else {
          log('Returning classification as Not Sure');
          res.json({classification: "Not Sure"}); 
        }

      } catch (error) {
        log(error);
      }
    });


    this.express.use('/', router);
    this.express.use('/', express.static('./build'));
  }

}

export {App};