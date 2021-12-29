import { AudioPlayerStatus } from "@discordjs/voice";
import { ButtonInteraction, Message } from "discord.js";
import { Bot } from "../../../client/Client";
import { buildSongSelectionUi } from "../../slash/music/Play";
import { buildQueue } from "../../slash/music/Queue";

export const id = "queue-next";

export const run = async (client: Bot, interaction: ButtonInteraction) => {
    
	await interaction.reply("ok");
    await interaction.deleteReply();

    await client.players.get(interaction.guildId).skip();
};
