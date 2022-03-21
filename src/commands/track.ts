import { SlashCommandBuilder, SlashCommandStringOption } from "@discordjs/builders";
import { Song, Utils } from "discord-music-player";
import { CommandInteraction } from "discord.js";
import Command from "./command";

export default class Track extends Command {
    private client: any;
    constructor(client: any) {
        const command = new SlashCommandBuilder()
                        .setName("track")
                        .setDescription("Add a track from Apple Music, Spotify or YouTube")
                        .addStringOption(new SlashCommandStringOption()
                            .setName("url")
                            .setRequired(true)
                            .setDescription("The track url or a search query")
                        );
        super(command);
        this.client = client;
    }
    
    public async handler(interaction: CommandInteraction): Promise<void> {
        const { guild, channel } = this.transformInteraction(interaction);

        let queue = this.client.player.createQueue(guild);
        await queue.join(channel);

        const url = interaction.options.getString("url", true);

        let song = await queue.play(url).catch(() => {
            if(!this.client.player.getQueue(guild))
                queue.stop();
        });

        interaction.followUp(`Added ${song.name} to the queue!`);
    }
}