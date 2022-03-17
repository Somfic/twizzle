import { DiscordGatewayAdapterCreator, joinVoiceChannel, VoiceConnection } from "@discordjs/voice";
import { CommandInteraction, VoiceBasedChannel, VoiceChannel, VoiceState } from "discord.js";
import config from "./config";
import { Player } from "./player";

export class Voice {
    private static guilds = new Map();

    static fromInteraction(interaction: CommandInteraction): Voice {
        if (Voice.guilds.has(interaction?.guild?.id)) {
            return Voice.guilds.get(interaction?.guild?.id);
        }

        const guild = interaction?.client?.guilds?.cache.get(interaction?.guildId ?? "0")
        const member = guild?.members?.cache.get(interaction?.member?.user?.id ?? "0");
        const channel = member?.voice?.channel;

        if (channel == undefined)
            throw new Error("You are not in a voice channel");

        const voice = new Voice(channel);

        Voice.guilds.set(interaction?.guild?.id, voice);
        return voice;
    }

    private connection: VoiceConnection | undefined;
    private channel: VoiceBasedChannel;
    public player: Player = new Player();

    constructor(channel: VoiceBasedChannel) {
        this.channel = channel;
    }

    public disconnect() {
        if (!this.isConnected())
            return;

        // Shutdown sounds
        if (config.sounds.shutdown.playSound) {
            this.clearQueue();

            const random = Math.floor(Math.random() * config.sounds.shutdown.links.length);
            this.queue(config.sounds.shutdown.links[random]);

            this.player.onTrackEnd(() => this.dispose());
        } else {
            this.dispose();
        }
    }

    private dispose() {
        this.connection?.disconnect();
        this.connection?.destroy();
        this.connection = undefined;
    }

    public connect() {
        if (this.isConnected())
            return;

        this.connection = joinVoiceChannel({
            channelId: this.channel.id,
            guildId: this.channel.guild?.id,
            adapterCreator: this.channel.guild?.voiceAdapterCreator,
        });

        this.connection.subscribe(this.player.getInternalPlayer());

        // Startup sounds
        if (config.sounds.startup.playSound) {
            const random = Math.floor(Math.random() * config.sounds.startup.links.length);
            this.queue(config.sounds.startup.links[random]);
        }
    }

    public queue(url: string) {
        this.player.addToQueue(url);
        this.player.playNext();
    }

    public clearQueue() {
        this.player.queue.clear();
    }

    public isConnected() {
        if (this.connection == undefined)
            return false;

        return this.connection.state.status == "ready";
    }
}