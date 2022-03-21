import { SlashCommandBuilder } from "@discordjs/builders";
import { CommandInteraction } from "discord.js";
import Command from "./command";

export default class Clear extends Command {
    private client: any;

    constructor(client: any) {
        const command = new SlashCommandBuilder()
                        .setName("clear")
                        .setDescription("Clear the queue");
        super(command);
        this.client = client;
    }
    
    public async handler(interaction: CommandInteraction): Promise<void> {
        const { guild } = this.transformInteraction(interaction);

        this.client.player.getQueue(guild).skip();
        interaction.followUp("Queue cleared! :)")
    }
}