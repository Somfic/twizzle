import { Player } from "discord-music-player";
import { Client as DiscordClient } from 'discord.js';

export interface Client extends DiscordClient {
    player: Player;
}