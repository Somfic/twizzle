import { ButtonInteraction, MessageEmbed } from 'discord.js';
import { Bot } from '../../client/Client';
import { Song } from '../../client/Player';

export const id = 'play';

export const run = async (client: Bot, interaction: ButtonInteraction) => {
	const songs = client.fetchedSongs.get(interaction.channelId);
	const index = client.fetchedSongsIndex.get(interaction.channelId);

	const player = client.players.get(interaction.guildId);
	const song = songs[index];

	await interaction.deferReply();

	client.players.get(interaction.guildId).queueSong(song as Song);
	await client.players.get(interaction.guildId).play();

	const totalSeconds = song.duration;
	const minutes = Math.floor(totalSeconds / 60);
	const seconds = totalSeconds % 60 < 10 ? `0${totalSeconds % 60}` : totalSeconds % 60;

	await interaction.followUp({
		embeds: [
			new MessageEmbed()
				.setTitle(song.title)
				.setURL(song.link)
				.setDescription(`${song.description} (${minutes}:${seconds})`)
				.setImage(song.thumbnail)
				.setFooter(song.channel.name, song.channel.thumbnail)
				.setColor(0x00ae86),
		],
	});
};
