import { BaseCommandInteraction, VoiceChannel } from 'discord.js';
import { Bot } from '../../../client/Client';

import { createAudioPlayer, getVoiceConnection, joinVoiceChannel, VoiceConnectionStatus } from '@discordjs/voice';

import { SlashCommandBuilder } from '@discordjs/builders';
import { Player } from '../../../client/Player';

export const run = async (client: Bot, interaction: BaseCommandInteraction): Promise<void> => {
    const channel = interaction.options.get('channel').channel as VoiceChannel;

    client.players.get(interaction.guildId).joinChannel(channel);

    interaction.reply(`Joined ${channel.name}`);
};

export const data = new SlashCommandBuilder()
	.setName('join')
	.setDescription('Joins the audio channel')
	.addChannelOption(o =>
		o.setName('channel')
        .setDescription('The audio channel to join')
        .addChannelType(2)
        .setRequired(true)
	);
