import { Client, Collection, GuildApplicationCommandManager, Intents } from 'discord.js';
import consola, { Consola, LogLevel } from 'Consola';

import { Command } from '../interfaces/Command';
import { Event } from '../interfaces/Event';
import { Config } from '../interfaces/Config';
import { glob as g } from 'glob';
import { promisify } from 'util';
import { ButtonCommand } from '../interfaces/ButtonCommand';
import { YouTubeSearchResult } from '../youtube/YouTube';

import { AudioPlayer } from '@discordjs/voice';
import { Video } from 'scrape-youtube/lib/interface';
import { Player } from './Player';

const glob = promisify(g);

class Bot extends Client {
	public logger: Consola = consola;

	public commands: Collection<string, Command> = new Collection();
	public events: Collection<string, Event> = new Collection();
    public buttons: Collection<string, ButtonCommand> = new Collection();

    public fetchedSongs: Collection<string, Video[]> = new Collection();
    public fetchedSongsIndex: Collection<string, number> = new Collection();

	public players: Collection<string, Player> = new Collection();

	public config: Config;

	constructor() {
		super({
			intents: Intents.FLAGS.GUILDS | Intents.FLAGS.GUILD_MESSAGES | Intents.FLAGS.GUILD_MESSAGE_REACTIONS | Intents.FLAGS.GUILD_VOICE_STATES,
		});
	}

	public async start(config: Config): Promise<void> {
		this.config = config;
		super.login(config.token);

        await this.loadCommands();
        await this.loadButtons();
        await this.loadEvents();
	}

	private async loadCommands(): Promise<void> {
		const commandFiles: string[] = await glob(
			`${__dirname}/../commands/slash/**/*{.ts,.js}`
		);

		this.logger.info(`Found ${commandFiles.length} commands`);

		commandFiles.map(async (file: string) => {
			const command: Command = await import(file);

			this.logger.debug(`Loading command ${command.data.name}`);

			this.commands.set(command.data.name, command);
		});
	}

    private async loadButtons(): Promise<void> {
		const commandFiles: string[] = await glob(
			`${__dirname}/../commands/buttons/**/*{.ts,.js}`
		);

		this.logger.info(`Found ${commandFiles.length} buttons`);

		commandFiles.map(async (file: string) => {
			const button: ButtonCommand = await import(file);

			this.logger.debug(`Loading button ${button.id}`);

			this.buttons.set(button.id, button);
		});
	}

	private async loadEvents(): Promise<void> {
		const eventFiles: string[] = await glob(
			`${__dirname}/../events/**/*{.ts,.js}`
		);

		this.logger.info(`Found ${eventFiles.length} events`);

		eventFiles.map(async (file: string) => {
			const event: Event = await import(file);

            this.logger.debug(`Loading event ${event.name}`);

			this.events.set(event.name, event);
			super.on(event.name, (...args: any[]) => event.run(this, ...args));
		});
	}
}

export { Bot };
