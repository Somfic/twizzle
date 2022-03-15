import { DiscordGatewayAdapterCreator, joinVoiceChannel, VoiceConnection } from "@discordjs/voice";
import { CommandInteraction, VoiceChannel, VoiceState } from "discord.js";
import { Player } from "./player";

export class Voice {
    public player: Player;
    private connection: VoiceConnection;
    private static guilds = new Map();
    
    static joinVoiceChannel(channel: CommandInteraction) : Voice {
        if (Voice.guilds.has(channel?.guild?.id)) {
            return Voice.guilds.get(channel?.guild?.id);
        }

        const voice = new Voice(channel);
        Voice.guilds.set(channel?.guild?.id, voice);
        return voice;
    }

    static leaveVoiceChannel(channel: CommandInteraction) {
        if (Voice.guilds.has(channel?.guild?.id) == false) {
            return;
        }
        Voice.guilds.get(channel?.guild?.id).disconnect();
        Voice.guilds.delete(channel?.guild?.id);
    }

    static getPlayer(channel: CommandInteraction): Player {
        return Voice.guilds.get(channel?.guild?.id).player;
    }

    constructor(interaction: CommandInteraction) {
        const guild = interaction?.client?.guilds?.cache.get(interaction?.guildId ?? "0")
        const member = guild?.members?.cache.get(interaction?.member?.user?.id ?? "0");
        const voiceChannel = member?.voice?.channel;

        this.connection = joinVoiceChannel({
            channelId: voiceChannel?.id ?? "0",
            guildId: interaction?.guild?.id as string,
            adapterCreator: interaction?.guild?.voiceAdapterCreator as DiscordGatewayAdapterCreator,
        });

        this.player = new Player();

        this.connection.subscribe(this.player.getInternalPlayer());
    }

    public disconnect() {
        this.connection.destroy();
    }

    public queue(url: string) {
        this.player.addToQueue(url);
        this.player.playNext();
    }
}