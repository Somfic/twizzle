import { SlashCommandBuilder } from "@discordjs/builders";
import { CommandInteraction } from "discord.js";
import { Voice } from "../voice";
import Command from "./command";

export default class Skip extends Command {
    constructor() {
        const command = new SlashCommandBuilder()
                        .setName("skip")
                        .setDescription("Skup this song");
        super(command);
    }
    
    public async handler(channel: CommandInteraction): Promise<void> {
        Voice.getPlayer(channel).queue.removeCurrent();
        Voice.getPlayer(channel).playNext();
        channel.followUp("Skipping song");
    }
}