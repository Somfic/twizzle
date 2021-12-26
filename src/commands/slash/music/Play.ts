import {
	BaseCommandInteraction,
	MessageActionRow,
	MessageButton,
	MessageEmbed,
} from 'discord.js';
import { Bot } from '../../../client/Client';

import { SlashCommandBuilder } from '@discordjs/builders';

import { YouTubeSearcher, YouTubeSearchResult } from '../../../youtube/YouTube';
import { Video } from 'scrape-youtube/lib/interface';
import { AudioPlayerStatus } from '@discordjs/voice';
import SpotifyWebApi from 'spotify-web-api-node';
import { Song } from '../../../client/Player';

const searcher = new YouTubeSearcher();

var spotifyApi = new SpotifyWebApi({
	clientId: process.env.SPOTIFY_ID,
	clientSecret: process.env.SPOTIFY_TOKEN,
});

export const run = async (
	client: Bot,
	interaction: BaseCommandInteraction
): Promise<void> => {
	const query = interaction.options.get('query').value.toString();


	const playlistRegex =
		/^(?:https?:\/\/)?(?:www\.)?(?:open\.spotify\.com\/)(?:playlist|user\/playlist)\/([a-zA-Z0-9]{22})/;
	const spotifyMatch = query.match(playlistRegex);
	if (spotifyMatch) {
		const playlistId = spotifyMatch[1];

		const grant = await spotifyApi.clientCredentialsGrant();
		spotifyApi.setAccessToken(grant.body['access_token']);

        const playlist = (await spotifyApi.getPlaylist(playlistId)).body;

        let total = playlist.tracks.total;

        client.logger.debug(`Found ${total} songs in playlist`);

        // Get all the tracks in batches of 100
        let tracks: SpotifyApi.PlaylistTrackObject[] = [];
        let offset = 0;

        while (offset < total) {
            client.logger.debug(`Getting playlist tracks ${offset} - ${offset + 100}`);
            const batch = await spotifyApi.getPlaylistTracks(playlistId, {
                offset: offset,
                limit: 100,
            });
            tracks = tracks.concat(batch.body.items);
            offset += 100;
        }

        const owner = (await spotifyApi.getUser(playlist.owner.id)).body;
        client.logger.debug(`Found ${tracks.length} tracks in playlist ${playlist.name}`);

        tracks.forEach(async (track) => {
            let song: Song = new Song();

            song.searchQuery = track.track.name + ' ' + track.track.artists[0].name + ' official';
            song.title = track.track.name;
            song.channel = {
                id: track.track.artists[0].id,
                name: track.track.artists[0].name,
                link: track.track.artists[0].external_urls.spotify,
                thumbnail: '',
                verified: true,
            };
            song.link = track.track.external_urls.spotify;
            song.thumbnail = track.track.album.images[0].url;
            song.duration = Math.round(track.track.duration_ms / 1000);
            song.description = track.track.album.name;
            song.id = track.track.id;

            client.players.get(interaction.guildId).queueSong(song);
        });

        client.players.get(interaction.guildId).play();

        await interaction.reply({
            embeds: [{
                title: `${playlist.name}`,
                description: `Added ${tracks.length} tracks to the queue`,
                image: {
                    url: playlist.images[0].url
                },
                url: playlist.external_urls.spotify,
                footer: {
                    text: owner.display_name,
                    icon_url: owner.images[0].url
                }
            }]
        });
        
	} else {
		const results = await searcher.query(query);

		client.fetchedSongs.set(interaction.channelId, results);
		client.fetchedSongsIndex.set(interaction.channelId, 0);

		const firstInQueue = client.players.get(interaction.guildId).hasNothingToDo();

		const { embed, row } = buildSongSelectionUi(results, 0, firstInQueue);
		await interaction.reply({ embeds: [embed], components: [row] });
	}
};

export const data = new SlashCommandBuilder()
	.setName('play')
	.setDescription('Plays a song')
	.addStringOption((o) =>
		o
			.setName('query')
			.setDescription('The music to search for')
			.setRequired(true)
	);

export function buildSongSelectionUi(
	songs: Video[],
	index: number,
	firstInQueue: boolean
) {
	const embed = new MessageEmbed()
		.setImage(songs[index].thumbnail)
		.setTitle(songs[index].title)
		.setURL(songs[index].link)
		.setDescription(songs[index].description)
		.setFooter(
			songs[index].channel.name + ' ' + (songs[index].channel.verified ? '✅' : ''), 
            songs[index].channel.thumbnail
		);

	const row = new MessageActionRow();
	const previousButton = new MessageButton()
		.setCustomId('previous')
		.setLabel('↺')
		.setDisabled(!(index > 0))
		.setStyle('SECONDARY');

	const selectButton = new MessageButton()
		.setCustomId('play')
		.setLabel(firstInQueue ? '▶' : 'Queue')
		.setDisabled(!(index >= 0 && index < songs.length))
		.setStyle('PRIMARY');

	const nextButton = new MessageButton()
		.setCustomId('next')
		.setLabel('↻')
		.setDisabled(!(index < songs.length - 1))
		.setStyle('SECONDARY');

	row.addComponents(previousButton, selectButton, nextButton);

	return { embed, row };
}
