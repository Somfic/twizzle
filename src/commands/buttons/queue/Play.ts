import { AudioPlayerStatus } from "@discordjs/voice";
import { ButtonInteraction, Message } from "discord.js";
import { Bot } from "../../../client/Client";
import { buildSongSelectionUi } from "../../slash/music/Play";
import { buildQueue } from "../../slash/music/Queue";

export const id = "queue-play";

export const run = async (client: Bot, interaction: ButtonInteraction) => {
    
	await interaction.reply("ok");
    await interaction.deleteReply();

    if(client.players.get(interaction.guildId).getIsPaused()) {
        await client.players.get(interaction.guildId).resume();
    } else {
        await client.players.get(interaction.guildId).pause();
    }
};
