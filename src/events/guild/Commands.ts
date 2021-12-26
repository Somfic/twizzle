import { Interaction, Message } from "discord.js";
import { Bot } from "../../client/Client";
import { Player } from "../../client/Player";
import { Command } from "../../interfaces/Command";
import { RunFunction } from "../../interfaces/Event";

export const run: RunFunction = async (client: Bot, interaction: Interaction): Promise<void> => {
    if(client.players.get(interaction.guildId) == undefined) {
        client.logger.debug(`Registering player for guild ${interaction.guild.name}`);
        client.players.set(interaction.guildId, new Player(client, interaction.guild))
    }
    
    if(!interaction.isApplicationCommand())
        return;

    const cmd = interaction.commandName.toLowerCase();

    const command: Command = client.commands.get(cmd);

    if(!command)  {
        return;
    }

    command.run(client, interaction).catch(error => {
        interaction.reply(`An error occurred while running the command ${command.data.name}`);
        client.logger.error(error);
    });
}

export const name: string = "interactionCreate";