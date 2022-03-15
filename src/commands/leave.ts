import { SlashCommandBuilder } from "@discordjs/builders";
import { CommandInteraction } from "discord.js";
import { Voice } from "../voice";
import Command from "./command";

export default class Leave extends Command {
    constructor() {
        const command = new SlashCommandBuilder()
                        .setName("leave")
                        .setDescription("Remove the bot from ur channle");
        super(command);
    }
    
    public async handler(channel: CommandInteraction): Promise<void> {
        Voice.leaveVoiceChannel(channel);
        channel.followUp("Goodbye:(");
    }
}