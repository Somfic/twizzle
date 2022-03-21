import { SlashCommandBuilder } from "@discordjs/builders";
import { CommandInteraction } from "discord.js";
import { Client } from "../client";
import Command from "./command";

export default class Leave extends Command {
    private client: Client;
    constructor(client: any) {
        const command = new SlashCommandBuilder()
                        .setName("leave")
                        .setDescription("Remove the bot from ur channle");
        super(command);
        this.client = client;
    }
    
    public async handler(interaction: CommandInteraction): Promise<void> {
        const { guild } = this.transformInteraction(interaction);
        try {
            this.client.player.getQueue((guild as any))?.destroy(true);
        
            interaction.followUp("Goodbye:(");
        } catch(e) {

        }
        
    }
}