import { SlashCommandBuilder } from "@discordjs/builders";
import { CommandInteraction } from "discord.js";
import { Voice } from "../voice";
import Command from "./command";

export default class Join extends Command {
    constructor() {
        const command = new SlashCommandBuilder()
                        .setName("join")
                        .setDescription("ADD the bot from ur channle");
        super(command);
    }
    
    public async handler(channel: CommandInteraction): Promise<void> {
        const voice = Voice.fromInteraction(channel);

        voice.connect();
        
        channel.followUp("hey ;)");
    }
}