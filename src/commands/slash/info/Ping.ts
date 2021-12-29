import { ApplicationCommand, BaseCommandInteraction } from "discord.js";
import { Bot } from "../../../client/Client";

import { SlashCommandBuilder } from '@discordjs/builders';

export const run = async (client: Bot, interaction: BaseCommandInteraction): Promise<void> => {
    const pingMessage = await interaction.reply(`Pong!`);
};

export const data = new SlashCommandBuilder()
    .setName("ping")
    .setDescription("Pings the bot");