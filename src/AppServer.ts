import * as dotenv from 'dotenv';
import dotenvExpand from 'dotenv-expand';
import {App} from '../dist/App.js';

const myEnv = dotenv.config();
dotenvExpand.expand(myEnv);

const port = process.env.PORT;
const openAIKey = process.env.OPENAI_SECRET_KEY || "";

let server: any = new App(openAIKey).express;
server.listen(port);
console.log("server running in port " + port);