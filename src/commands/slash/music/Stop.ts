import { BaseCommandInteraction, VoiceChannel } from 'discord.js';
import { Bot } from '../../../client/Client';

import { SlashCommandBuilder } from '@discordjs/builders';

export const run = async (client: Bot, interaction: BaseCommandInteraction): Promise<void> => {
    
    client.players.get(interaction.guildId).clearQueue();
    client.players.get(interaction.guildId).stop();

    await interaction.reply({
        embeds: [{
            title: ':stop_button:',
            description: 'Stopped the music'
        }]
    });
};

export const data = new SlashCommandBuilder()
	.setName('stop')
	.setDescription('Stops the music');
