require('dotenv').config();

import { Config } from "./interfaces/Config";
import { Bot } from "./client/Client";
import consola, { LogLevel } from "consola";

const config = new Config();
config.id = process.env.BOT_ID;
config.token = process.env.BOT_TOKEN;
config.youtubeToken = process.env.YOUTUBE_TOKEN;

consola.level = LogLevel.Debug;

if(!config.id || !config.token) {
    consola.error("Missing bot id or token");
    process.exit(1);
}

if(config.isDev) {
    consola.info("Running in development mode");
} else {
    consola.info("Running in production mode");
}

new Bot().start(config);