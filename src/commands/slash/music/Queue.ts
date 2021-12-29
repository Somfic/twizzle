import { BaseCommandInteraction, ButtonInteraction, CommandInteraction, Guild, Message, MessageActionRow, MessageButton, MessageEmbed, VoiceChannel } from 'discord.js';
import { Bot } from '../../../client/Client';

import { getVoiceConnection, getVoiceConnections } from '@discordjs/voice';

import { SlashCommandBuilder } from '@discordjs/builders';

export const run = async (
	client: Bot,
	interaction: CommandInteraction
): Promise<void> => {

	//let embeds: MessageEmbed[] = [];

	// Show the first 10 songs in the queue
	// for (let i = 0; i < Math.min(queue.length, 10); i++) {
	// 	const song = queue[i];

	// 	const totalSeconds = song.duration;
   	// 	const minutes = Math.floor(totalSeconds / 60);
    // 	const seconds = totalSeconds % 60 < 10 ? `0${totalSeconds % 60}` : totalSeconds % 60;

	// 	embeds.push(
	// 		new MessageEmbed()
	// 			.setTitle(`${i + 1}. ${song.title}`)
	// 			.setURL(song.link)
	// 			.setDescription(song.description + ` (${minutes}:${seconds})`)
	// 			.setThumbnail(song.thumbnail)
	// 			.setFooter(song.channel.name, song.channel.thumbnail)
	// 			.setColor(0x00ae86)
	// 	);
	// }

	// if(embeds.length === 0) {
	// 	embeds = [
	// 		new MessageEmbed()
	// 			.setTitle('Queue')
	// 			.setDescription('There are no songs in the queue')
	// 			.setColor(0x00ae86)
	// 	];
	// }

	const { embeds, row} = buildQueue(client, interaction.guild);

	await interaction.reply("ok");
	await interaction.deleteReply();

	const reply = await interaction.channel.send({
		embeds: embeds,
		components: [row],
	});

	client.players.get(interaction.guildId).setQueueMessage(reply as Message);
};

export const data = new SlashCommandBuilder()
	.setName('queue')
	.setDescription('Displays the current queue');


export function buildQueue(client: Bot, guild: Guild) {
	const player = client.players.get(guild.id);
	const song = player.getCurrentSong();
	const queue = player.getQueuedSongs();

	const embeds: MessageEmbed[] = [];

	if(song != undefined) {
		embeds.push(new MessageEmbed().setTitle(song.title)
		.setDescription(song.channel.name)
		.setThumbnail(song.thumbnail)
		.setURL(song.link)
		.setFooter('Currently playing')
		.setColor(0x00ae86));
	} else {
		embeds.push(new MessageEmbed().setTitle('Currently playing')
		.setDescription('Nothing is playing')
		.setColor(0x00ae86));
	}

	if(queue.length > 0) {
		let totalSeconds = queue.reduce((acc, song) => acc + song.duration, 0);

		let queueEmbed = new MessageEmbed().setTitle('Queue')
		.setDescription(queue.length + ' songs in the queue')
		.setFooter(new Date(totalSeconds * 1000).toISOString().substr(11, 8)  + ' total')
		.setColor(0x00ae86);

		for (let i = 0; i < Math.min(queue.length, 12); i++) {
			const song = queue[i];

			if(song == undefined) {
				continue;
			}

			const totalSeconds = song.duration;
			const minutes = Math.floor(totalSeconds / 60);
			const seconds = totalSeconds % 60 < 10 ? `0${totalSeconds % 60}` : totalSeconds % 60;

			queueEmbed.addField(`${i + 1}. ${song.title}`, `${song.channel.name} (${minutes}:${seconds})`, true);
		}

		embeds.push(queueEmbed);
	} else {
		embeds.push(new MessageEmbed().setTitle('Queue')
		.setDescription('There are no songs in the queue')
		.setColor(0x00ae86));
	}

	const row = new MessageActionRow();
	const previous = new MessageButton()
		.setCustomId('queue-previous')
		.setLabel('⏮')
		.setDisabled(true)
		.setStyle('SUCCESS');

	const pause = new MessageButton()
		.setCustomId('queue-play')
		.setLabel(player.getIsPaused() ? '▶' : '⏸')
		.setDisabled(false)
		.setStyle('PRIMARY');

	const next = new MessageButton()
		.setCustomId('queue-next')
		.setLabel('⏭')
		.setDisabled(false)
		.setStyle('SUCCESS');

	const shuffle = new MessageButton()
		.setCustomId('queue-shuffle')
		.setLabel('⤮')
		.setDisabled(false)
		.setStyle('SUCCESS');

	const repeat = new MessageButton()
		.setCustomId('queue-repeat')
		.setLabel('⮒')
		.setDisabled(false)
		.setStyle('SUCCESS');

	const previousPage = new MessageButton()
		.setCustomId('queue-previous-page')
		.setLabel('🠄')
		.setDisabled(false)
		.setStyle('SECONDARY');

	const nextPage = new MessageButton()
		.setCustomId('queue-next-page')
		.setLabel('🠆')
		.setDisabled(false)
		.setStyle('SECONDARY');

	row.addComponents(pause, next, shuffle, previousPage, nextPage);

	return { row, embeds }
}