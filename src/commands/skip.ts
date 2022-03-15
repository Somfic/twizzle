import { SlashCommandBuilder } from "@discordjs/builders";
import { CommandInteraction } from "discord.js";
import { Voice } from "../voice";
import Command from "./command";

export default class Skip extends Command {
    constructor() {
        const command = new SlashCommandBuilder()
                        .setName("skip")
                        .setDescription("Skip this song");
        super(command);
    }
    
    public async handler(channel: CommandInteraction): Promise<void> {
        Voice.leaveVoiceChannel(channel);
        channel.followUp("Skipping song");
    }
}