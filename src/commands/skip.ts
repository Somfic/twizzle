import { SlashCommandBuilder } from "@discordjs/builders";
import { CommandInteraction } from "discord.js";
// import { Voice } from "../voice";
import Command from "./command";

export default class Skip extends Command {
    private client: any;

    constructor(client: any) {
        const command = new SlashCommandBuilder()
                        .setName("skip")
                        .setDescription("Skup this song");
        super(command);
        this.client = client;
    }
    
    public async handler(interaction: CommandInteraction): Promise<void> {
        const { guild } = this.transformInteraction(interaction);

        this.client.player.getQueue(guild).skip();
        interaction.followUp("Skipping! :)")
    }
}