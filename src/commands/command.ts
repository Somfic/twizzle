import { SlashCommandBuilder } from "@discordjs/builders";
import { CommandInteraction } from "discord.js";
import { RESTPostAPIApplicationCommandsJSONBody } from "discord.js/node_modules/discord-api-types";

export default class Command {
    private command: Omit<SlashCommandBuilder, "addSubcommand" | "addSubcommandGroup">;

    constructor(command: Omit<SlashCommandBuilder, "addSubcommand" | "addSubcommandGroup">) {
        this.command = command;
    }

    protected transformInteraction(interaction: CommandInteraction) {
        const guild = interaction?.client?.guilds?.cache.get(interaction?.guildId ?? "0")
        const member = guild?.members?.cache.get(interaction?.member?.user?.id ?? "0");
        const channel = member?.voice?.channel;

        return {
            guild, member, channel
        };
        
    }

    public async handler(interaction: CommandInteraction): Promise<void> {}

    public getCommandJSON(): RESTPostAPIApplicationCommandsJSONBody {
        return this.command.toJSON();
    }
}