import {
	AudioPlayer,
	AudioPlayerStatus,
	createAudioPlayer,
	createAudioResource,
	getVoiceConnection,
	joinVoiceChannel,
	StreamType,
	VoiceConnection,
	VoiceConnectionStatus,
} from '@discordjs/voice';
import { Collection, Guild, VoiceChannel } from 'discord.js';
import fs, { createReadStream, ReadStream } from 'fs';
import { Channel, Video } from 'scrape-youtube/lib/interface';
import ytdl from 'ytdl-core';
import { YouTubeSearcher } from '../youtube/YouTube';
import { Bot } from './Client';

const searcher = new YouTubeSearcher();

class Song implements Video {
	searchQuery: string;

	views: number;
	uploaded: string;
	duration: number;
	description: string;
	id: string;
	title: string;
	link: string;
	thumbnail: string;
	channel: Channel;
}

class Player {
	private audioPlayer: AudioPlayer;
	private connection: VoiceConnection;

	private queuedSongs: Song[] = [];

	private client: Bot;
	private guild: Guild;

	constructor(client: Bot, guild: Guild) {
		this.client = client;
		this.guild = guild;

		this.client.logger.debug(`Created played in ${this.guild.name}`);
	}

	private createPlayer() {
		if (this.audioPlayer === undefined) {
			this.audioPlayer = createAudioPlayer();

			this.audioPlayer.on('error', (error) => {
				this.client.logger.error(`${error.message} in ${this.guild.name}`);
			});

			this.audioPlayer.on(AudioPlayerStatus.Idle, async () => {
				this.client.logger.debug(
					`Detected idling, playing next song in ${this.guild.name}`
				);
				this.playNextSong();
			});
		}
	}

	public async play() {
		this.createPlayer();
		if (this.audioPlayer.state.status === AudioPlayerStatus.Idle) {
			this.client.logger.debug(`Playing next song in ${this.guild.name}`);
			await this.playNextSong();
		}
	}

	private async playNextSong() {
		const song = this.queuedSongs.shift();

		if (song !== undefined) {
			this.client.logger.debug(`Moved to ${song.title} in ${this.guild.name}`);
			if (!(await this.playSong(song))) {
				this.queuedSongs.unshift(song);
				this.client.logger.debug(
					`Could not play ${song.title}, put it back in queue in ${this.guild.name}`
				);
			}
		} else {
			this.client.logger.debug(`Moved through queue in ${this.guild.name}`);
		}
	}

	public pause() {
        this.createPlayer();
		this.client.logger.debug(`Pausing audio playback in ${this.guild.name}`);
		this.audioPlayer.pause();
	}

	public resume() {
		this.client.logger.debug(`Resuming audio playback in ${this.guild.name}`);
		this.audioPlayer.unpause();
		this.play();
	}

	public skip() {
        this.stop();
		this.play();
	}

    public stop() {
        this.createPlayer();
		this.client.logger.debug(`Stopping audio playback in ${this.guild.name}`);
		this.audioPlayer.stop();
	}

	public clearQueue() {
		this.client.logger.debug(`Clearing audio queue in ${this.guild.name}`);
		this.queuedSongs = [];
	}

	public queueSong(song: Song) {
		if (song.searchQuery == undefined) {
			this.client.logger.debug(`Queuing ${song.title} in ${this.guild.name}`);
		} else {
			this.client.logger.debug(
				`Lazy queing ${song.searchQuery} in ${this.guild.name}`
			);
		}
		this.queuedSongs.push(song);
	}

	public isConnected(): boolean {
		return (
			this.connection !== undefined &&
			this.connection.state.status === VoiceConnectionStatus.Ready
		);
	}

	public leaveChannel() {
        this.audioPlayer.stop();
        this.audioPlayer = undefined;
		if (this.connection !== undefined) {
			this.client.logger.debug(`Leaving audio channel in ${this.guild.name}`);
			this.connection.destroy();
		}
	}

	public getQueuedSongs(): Song[] {
		return this.queuedSongs;
	}

	public hasNothingToDo(): boolean {
        this.createPlayer();
		return (
			this.queuedSongs.length === 0 &&
			this.audioPlayer.state.status === AudioPlayerStatus.Idle
		);
	}

	public shuffle() {
		this.client.logger.debug(`Shuffling queue in ${this.guild.name}`);
		this.queuedSongs = this.queuedSongs.sort(() => Math.random() - 0.5);
	}

	public joinChannel(channel: VoiceChannel) {
		this.client.logger.debug(
			`Joining audio channel ${channel.name} in ${this.guild.name}`
		);
		this.connection = joinVoiceChannel({
			channelId: channel.id,
			guildId: this.guild.id,
			// @ts-ignore
			adapterCreator: channel.guild.voiceAdapterCreator,
			selfDeaf: true,
			selfMute: false,
		});

		this.connection.once(VoiceConnectionStatus.Ready, () => {
			this.play();
		});
	}

	private async playSong(song: Song): Promise<boolean> {
		if (song.searchQuery !== undefined) {
			const videos = await searcher.query(song.searchQuery);
			song = videos[0] as Song;
		}

		this.client.logger.debug(
			`Getting stream for ${song.title} in ${this.guild.name}`
		);

		// Get the song's audio stream
		const stream = await this.getAudioStream(song, this.client.config.tempPath);

		// Create a new audio resource
		const audio = createAudioResource(stream, {
			inputType: StreamType.WebmOpus,
		});

		if (!this.isConnected()) {
			this.client.logger.warn(
				`Could not play ${song.title}, not connected to a voice channel in ${this.guild.name}`
			);
			return false;
		}

		// Play the song
        this.createPlayer();
		this.client.logger.debug(`Playing ${song.title} in ${this.guild.name}`);
		this.audioPlayer.play(audio);

		// Mark the song as playing
		const connection = getVoiceConnection(this.guild.id);
		connection.subscribe(this.audioPlayer);

		return true;
	}

	private getAudioStream(song: Song, tempPath: string): Promise<ReadStream> {
		return new Promise((resolve, reject) => {
			// Get the temporary path of the song
			const file = `./${tempPath}/${song.id}.webm`;

			// Check if the song is already cached
			if (fs.existsSync(file)) {
				this.client.logger.debug(`Found cached audio file for ${song.title}`);
				resolve(createReadStream(file));
			}

			// If not, download the song
			else {
				this.client.logger.debug(`Downloading audio file for ${song.title}`);

				// Create a stream of the song
				const videoStream = ytdl(`https://www.youtube.com/watch?v=${song.id}`, {
					filter: (format) =>
						format.container === 'webm' && format.hasAudio === true,
				});

				// Write the song to the temporary path
				videoStream.pipe(
					fs
						.createWriteStream(file)

						// When the song is done downloading, resolve the promise
						.on('finish', async () => {
							this.client.logger.debug(
								`Finished downloading audio file for ${song.title}`
							);
							resolve(createReadStream(file));
						})
				);
			}
		});
	}
}

export { Player, Song };
