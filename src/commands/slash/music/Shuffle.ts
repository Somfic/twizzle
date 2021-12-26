import { BaseCommandInteraction, VoiceChannel } from 'discord.js';
import { Bot } from '../../../client/Client';

import { getVoiceConnection, getVoiceConnections } from '@discordjs/voice';

import { SlashCommandBuilder } from '@discordjs/builders';


export const run = async (client: Bot, interaction: BaseCommandInteraction): Promise<void> => {
    
    client.players.get(interaction.guildId).shuffle();

    await interaction.reply({
        embeds: [{
            title: ':twisted_rightwards_arrows:',
            description: 'Shuffled queue'
        }]
    });
};

export const data = new SlashCommandBuilder()
	.setName('shuffle')
	.setDescription('Leaves the audio channel');
