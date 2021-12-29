import { AudioPlayerStatus } from "@discordjs/voice";
import { ButtonInteraction } from "discord.js";
import { Bot } from "../../../client/Client";
import { buildSongSelectionUi } from "../../slash/music/Play";

export const id = "search-previous";

export const run = async (client: Bot, interaction: ButtonInteraction) => {
    const songs = client.fetchedSongs.get(interaction.channelId);
    let index = client.fetchedSongsIndex.get(interaction.channelId);

    if(index > 0) {
        index--;
        client.fetchedSongsIndex.set(interaction.channelId, index);
    }

    const firstInQueue = client.players.get(interaction.guildId).hasNothingToDo();

    const {embed, row} = buildSongSelectionUi(songs, index, firstInQueue);
    await interaction.update({ embeds: [embed], components: [row] });
};
