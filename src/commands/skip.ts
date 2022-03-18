import { SlashCommandBuilder } from "@discordjs/builders";
import { CommandInteraction } from "discord.js";
import { Voice } from "../voice";
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
    
    public async handler(channel: CommandInteraction): Promise<void> {
        const guild = channel?.client?.guilds?.cache.get(channel?.guildId ?? "0")
        const member = guild?.members?.cache.get(channel?.member?.user?.id ?? "0");
        const _channel = member?.voice?.channel;

        this.client.player.getQueue(guild).skip();
        channel.followUp("Skipping! :)")
    }
}