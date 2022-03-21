import { SlashCommandBuilder } from "@discordjs/builders";
import { CommandInteraction } from "discord.js";
import Command from "./command";

export default class Play extends Command {
    private client: any;

    constructor(client: any) {
        const command = new SlashCommandBuilder()
                        .setName("play")
                        .setDescription("Resume the musek!");
        super(command);
        this.client = client;
    }
    
    public async handler(interaction: CommandInteraction): Promise<void> {
        const { guild } = this.transformInteraction(interaction);

        this.client.player.getQueue(guild).setPaused(false);
        interaction.followUp("Playing again! :)")
    }
}