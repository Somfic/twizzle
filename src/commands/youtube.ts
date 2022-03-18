import { SlashCommandBuilder, SlashCommandStringOption } from "@discordjs/builders";
import { AudioPlayerPlayingState } from "@discordjs/voice/dist";
import { CommandInteraction } from "discord.js";
import { Voice } from "../voice";
import Command from "./command";

export default class YouTube extends Command {
    constructor(client: any) {
        super(new SlashCommandBuilder()
            .setName("youtube")
            .setDescription("Play audio from YouTube")
            .addStringOption(new SlashCommandStringOption()
                .setName("url")
                .setRequired(true)
                .setDescription("The video url")
            ));
    }
    
    public async handler(interaction: CommandInteraction): Promise<void> {
        const url = interaction.options.getString("url", true);

        const voice = Voice.fromInteraction(interaction);

        voice.connect();
        voice.player.addToQueue(url);
        
        if(voice.player.getQueueSize() == 1) {
            // voice.player.addToQueue(url);
            voice.player.playNext();
        }

        interaction.followUp(`Playing now biatch ${voice.player.getQueueSize()}`);
    }
}