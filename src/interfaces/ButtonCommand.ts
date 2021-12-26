import { Bot } from "../client/Client";
import { ButtonInteraction } from "discord.js";

export interface RunFunction {
    (client: Bot, message: ButtonInteraction): Promise<void>;
}

export interface ButtonCommand {
    run: RunFunction;
    id: string
}