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
import { ButtonInteraction, Collection, Guild, Interaction, Message, VoiceChannel } from 'discord.js';
import fs, { createReadStream, ReadStream } from 'fs';
import { Channel, Video } from 'scrape-youtube/lib/interface';
import ytdl from 'ytdl-core';
import { buildQueue } from '../commands/slash/music/Queue';
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
	private currentSong: Song;
	private queueMessage: Message;

	private client: Bot;
	private guild: Guild;

	private isPaused: boolean = false;

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

	public getIsPaused(): boolean {
		return this.isPaused;
	}

	public getQueueMessage(): Message {
		return this.queueMessage;
	}

	public setQueueMessage(message: Message) {
		if(this.queueMessage != undefined) {
			this.queueMessage.delete();
		}

		this.queueMessage = message;
	}

	private async playNextSong() {	
		this.currentSong = this.queuedSongs.shift();

		if (this.currentSong !== undefined) {
			this.client.logger.debug(`Moved to ${this.currentSong.title} in ${this.guild.name}`);
			if (!(await this.playSong(this.currentSong))) {
				this.queuedSongs.unshift(this.currentSong);
				this.client.logger.debug(
					`Could not play ${this.currentSong.title}, put it back in queue in ${this.guild.name}`
				);
				this.currentSong = undefined;
			} else {
				// Download next song in queue
				if(this.queuedSongs.length > 0) {
					if (this.queuedSongs[0].searchQuery !== undefined) {
						const videos = await searcher.query(this.queuedSongs[0].searchQuery);
						this.queuedSongs[0] = videos[0] as Song;
					}

					this.client.logger.debug(`Precaching next song ${this.queuedSongs[0].title} in ${this.guild.name}`);
					this.getAudioStream(this.queuedSongs[0], this.client.config.tempPath);
				}
			}
		} else {
			this.client.logger.debug(`Moved through queue in ${this.guild.name}`);
		}

		await this.updateUi();
	}

	private async updateUi() {
		if(this.queueMessage !== undefined) {
			this.client.logger.debug(`Updating queue UI in ${this.guild.name}`);

			const {embeds, row} = buildQueue(this.client, this.guild);
        	await this.queueMessage.edit({ embeds: embeds, components: [row] });
		}
	}

	public async pause() {
        this.createPlayer();
		this.client.logger.debug(`Pausing audio playback in ${this.guild.name}`);
		this.isPaused = true;
		this.audioPlayer.pause();

		await this.updateUi();
	}

	public async resume() {
		this.client.logger.debug(`Resuming audio playback in ${this.guild.name}`);
		this.isPaused = false;
		this.audioPlayer.unpause();
		await this.play();

		await this.updateUi();
	}

	public async skip() {
        this.createPlayer();
		this.client.logger.debug(`Skipping audio playback in ${this.guild.name}`);
		this.audioPlayer.stop();
		await this.play();

		await this.updateUi();
	}

    public async stop() {
        this.createPlayer();
		this.client.logger.debug(`Stopping audio playback in ${this.guild.name}`);
		this.audioPlayer.stop();

		await this.updateUi();
	}

	public async clearQueue() {
		this.client.logger.debug(`Clearing audio queue in ${this.guild.name}`);
		this.queuedSongs = [];

		await this.updateUi();
	}

	public async queueSongs(songs: Song[]) {
		for (let index = 0; index < songs.length; index++) {
			const song = songs[index];
			if (song.searchQuery == undefined) {
				this.client.logger.debug(`Queuing ${song.title} in ${this.guild.name}`);
			} else {
				this.client.logger.debug(
					`Lazy queing ${song.searchQuery} in ${this.guild.name}`
				);
			}
			this.queuedSongs.push(song);	
		}

		await this.updateUi();
	}

	public async queueSong(song: Song) {
		if (song.searchQuery == undefined) {
			this.client.logger.debug(`Queuing ${song.title} in ${this.guild.name}`);
		} else {
			this.client.logger.debug(
				`Lazy queing ${song.searchQuery} in ${this.guild.name}`
			);
		}
		this.queuedSongs.push(song);

		await this.updateUi();
	}

	public getCurrentSong(): Song {
		return this.currentSong;
	}

	public isConnected(): boolean {
		return (
			this.connection !== undefined &&
			this.connection.state.status === VoiceConnectionStatus.Ready
		);
	}

	public async leaveChannel() {
        this.audioPlayer.stop();
        this.audioPlayer = undefined;
		if (this.connection !== undefined) {
			this.client.logger.debug(`Leaving audio channel in ${this.guild.name}`);
			this.connection.destroy();
		}

		await this.updateUi();
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

	public async shuffle() {
		this.client.logger.debug(`Shuffling queue in ${this.guild.name}`);
		this.queuedSongs = this.queuedSongs.sort(() => Math.random() - 0.5);

		await this.updateUi();
	}

	public async joinChannel(channel: VoiceChannel) {
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

		await this.updateUi();
	}

	private async playSong(song: Song): Promise<boolean> {
		if (song.searchQuery !== undefined) {
			const videos = await searcher.query(song.searchQuery);
			song = videos[0] as Song;
		}

		this.client.logger.debug(
			`Getting stream for ${song.title} in ${this.guild.name} (${song.searchQuery})`
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
				this.client.logger.debug(`Downloading audio file for ${song.title} (${song.id})`);

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
