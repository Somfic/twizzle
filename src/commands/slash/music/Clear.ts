import { BaseCommandInteraction, VoiceChannel } from 'discord.js';
import { Bot } from '../../../client/Client';

import { SlashCommandBuilder } from '@discordjs/builders';

export const run = async (client: Bot, interaction: BaseCommandInteraction): Promise<void> => {
    client.players.get(interaction.guildId).clearQueue();
    
    await interaction.reply({
        embeds: [{
            title: ':pause_button:',
            description: 'Cleared the queue'
        }]
    });
};

export const data = new SlashCommandBuilder()
	.setName('clear')
	.setDescription('Clears the queue');
