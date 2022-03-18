import { SlashCommandBuilder } from "@discordjs/builders";
import { CommandInteraction } from "discord.js";
import Command from "./command";

export default class Ping extends Command {
    constructor(client: any) {
        super(new SlashCommandBuilder().setName("ping").setDescription("Pong"));
    }
    
    public async handler(interaction: CommandInteraction): Promise<void> {
        interaction.followUp("Pong!");
    }
}