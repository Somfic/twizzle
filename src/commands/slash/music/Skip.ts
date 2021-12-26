import { BaseCommandInteraction, MessageEmbed, VoiceChannel } from 'discord.js';
import { Bot } from '../../../client/Client';

import { SlashCommandBuilder } from '@discordjs/builders';

export const run = async (
	client: Bot,
	interaction: BaseCommandInteraction
): Promise<void> => {
	const queue = client.players.get(interaction.guildId).getQueuedSongs();
    client.players.get(interaction.guildId).skip();

	if (queue.length === 0) {
		await interaction.reply({
			embeds: [
				{
					title: ':x:',
					description: 'There is nothing in the queue',
				},
			],
		});
	} else {
		const nextSong = queue[0];

		const totalSeconds = nextSong.duration;
		const minutes = Math.floor(totalSeconds / 60);
		const seconds =
			totalSeconds % 60 < 10 ? `0${totalSeconds % 60}` : totalSeconds % 60;

		await interaction.reply({
			embeds: [
				new MessageEmbed()
					.setTitle(nextSong.title)
					.setURL(nextSong.link)
					.setDescription(`${nextSong.description} (${minutes}:${seconds})`)
					.setImage(nextSong.thumbnail)
					.setFooter(nextSong.channel.name, nextSong.channel.thumbnail)
					.setColor(0x00ae86),
			],
		});
	}
};

export const data = new SlashCommandBuilder()
	.setName('skip')
	.setDescription('Skips the song');
