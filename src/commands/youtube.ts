import { SlashCommandBuilder, SlashCommandStringOption } from "@discordjs/builders";
import { CommandInteraction } from "discord.js";
import { Voice } from "../voice";
import Command from "./command";

export default class YouTube extends Command {
    constructor() {
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
    
        const { generateDependencyReport } = require('@discordjs/voice');
        console.log(generateDependencyReport());

        const url = interaction.options.getString("url", true);
    
        let voice = Voice.joinVoiceChannel(interaction);
        voice.queue(url);

        interaction.followUp("Playing now biatch");
    }
}