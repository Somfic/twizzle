import { BaseCommandInteraction, MessageEmbed, VoiceChannel } from 'discord.js';
import { Bot } from '../../../client/Client';

import { getVoiceConnection, getVoiceConnections } from '@discordjs/voice';

import { SlashCommandBuilder } from '@discordjs/builders';

export const run = async (
	client: Bot,
	interaction: BaseCommandInteraction
): Promise<void> => {
	const queue = client.players.get(interaction.guildId).getQueuedSongs();

	let embeds: MessageEmbed[] = [];

	// Show the first 10 songs in the queue
	for (let i = 0; i < Math.min(queue.length, 10); i++) {
		const song = queue[i];

		const totalSeconds = song.duration;
   		const minutes = Math.floor(totalSeconds / 60);
    	const seconds = totalSeconds % 60 < 10 ? `0${totalSeconds % 60}` : totalSeconds % 60;

		embeds.push(
			new MessageEmbed()
				.setTitle(`${i + 1}. ${song.title}`)
				.setURL(song.link)
				.setDescription(song.description + ` (${minutes}:${seconds})`)
				.setThumbnail(song.thumbnail)
				.setFooter(song.channel.name, song.channel.thumbnail)
				.setColor(0x00ae86)
		);
	}

	if(embeds.length === 0) {
		embeds = [
			new MessageEmbed()
				.setTitle('Queue')
				.setDescription('There are no songs in the queue')
				.setColor(0x00ae86)
		];
	}

	await interaction.reply({
		embeds: embeds,
	});
};

export const data = new SlashCommandBuilder()
	.setName('queue')
	.setDescription('Displays the current queue');
