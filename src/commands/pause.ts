import { SlashCommandBuilder } from "@discordjs/builders";
import { CommandInteraction } from "discord.js";
import Command from "./command";

export default class Pause extends Command {
    private client: any;

    constructor(client: any) {
        const command = new SlashCommandBuilder()
                        .setName("pause")
                        .setDescription("Pause the playing musek!");
        super(command);
        this.client = client;
    }
    
    public async handler(interaction: CommandInteraction): Promise<void> {
        const { guild } = this.transformInteraction(interaction);

        this.client.player.getQueue(guild).setPaused(true);
        interaction.followUp("Paused ur precious songs! :)")
    }
}