import { Bot } from "../client/Client";
import { BaseCommandInteraction } from "discord.js";

import { SlashCommandBuilder } from '@discordjs/builders';

export interface RunFunction {
    (client: Bot, message: BaseCommandInteraction): Promise<void>;
}

export interface Command {
    run: RunFunction;
    data: SlashCommandBuilder;
}