import { SlashCommandBuilder } from "@discordjs/builders";
import { CommandInteraction } from "discord.js";
import { RESTPostAPIApplicationCommandsJSONBody } from "discord.js/node_modules/discord-api-types";

export default class Command {
    private command: Omit<SlashCommandBuilder, "addSubcommand" | "addSubcommandGroup">;

    constructor(command: Omit<SlashCommandBuilder, "addSubcommand" | "addSubcommandGroup">) {
        this.command = command;
    }

    public async handler(interaction: CommandInteraction): Promise<void> {}

    public getCommandJSON(): RESTPostAPIApplicationCommandsJSONBody {
        return this.command.toJSON();
    }
}