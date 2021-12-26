import { BaseCommandInteraction, VoiceChannel } from 'discord.js';
import { Bot } from '../../../client/Client';

import { getVoiceConnection, getVoiceConnections } from '@discordjs/voice';

import { SlashCommandBuilder } from '@discordjs/builders';


export const run = async (client: Bot, interaction: BaseCommandInteraction): Promise<void> => {
    
    client.players.get(interaction.guildId).leaveChannel();

    await interaction.reply(`Bye :wave:`);
};

export const data = new SlashCommandBuilder()
	.setName('leave')
	.setDescription('Leaves the audio channel');
