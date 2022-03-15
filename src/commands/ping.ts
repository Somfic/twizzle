import { SlashCommandBuilder } from "@discordjs/builders";
import { CommandInteraction } from "discord.js";

export default {
    command: new SlashCommandBuilder().setDescription("Pong"),

    handler: async (interaction: CommandInteraction) => {
        interaction.reply("Pong!");
    }
}