import { SlashCommandBuilder } from "@discordjs/builders";
import { CommandInteraction } from "discord.js";
import Command from "./command";

export default class Shuffle extends Command {
    private client: any;

    constructor(client: any) {
        const command = new SlashCommandBuilder()
                        .setName("shuffle")
                        .setDescription("Shuffle the songs in the queue");
        super(command);
        this.client = client;
    }
    
    public async handler(interaction: CommandInteraction): Promise<void> {
        const { guild } = this.transformInteraction(interaction);

        this.client.player.getQueue(guild).shuffle();
        interaction.followUp("Shuffled songs! :)")
    }
}