import { Bot } from "../../client/Client";
import { RunFunction } from "../../interfaces/Event";

import { REST } from '@discordjs/rest';
import { Routes } from 'discord-api-types/v9';
import { version } from "process";

import { SlashCommandBuilder } from '@discordjs/builders';
import { Collection } from "discord.js";
import { Command } from "../../interfaces/Command";
import { Player } from "../../client/Player";

export const run: RunFunction = async (client: Bot, ...args: any[]): Promise<void> => {
    client.logger.info(`Logged in as ${client.user.tag}`);

    // Set the bot's status
    client.user.setStatus("online");

    const rest = new REST({version: "9"}).setToken(client.config.token);

    // Register slash commands
    //const commandsRoute = client.config.isDev ? Routes.applicationGuildCommands(client.user.id, client.config.devGuild) : Routes.applicationCommands(client.user.id);
    const commandsRoute = Routes.applicationGuildCommands(client.user.id, client.config.devGuild);
    const commands = client.commands.map(command => command.data);

    await rest.put(commandsRoute, {
        body: commands
    });

    // Register players
    client.guilds.cache.forEach(async (guild) => {
        client.logger.debug(`Registering player for guild ${guild.name}`);
        client.players.set(guild.id, new Player(client, guild));
    });
}

export const name: string = "ready";