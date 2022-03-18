import { SlashCommandBuilder, SlashCommandStringOption } from "@discordjs/builders";
import { CommandInteraction } from "discord.js";
import { Voice } from "../voice";
import Command from "./command";
const spotifyToYT = require("spotify-to-yt");

export default class Spotify extends Command {
    private client: any;
    constructor(client: any) {
        const command = new SlashCommandBuilder()
                        .setName("spotify")
                        .setDescription("Add a spotify playlist or track")
                        .addStringOption(new SlashCommandStringOption()
                            .setName("url")
                            .setRequired(true)
                            .setDescription("The playlist/track url")
                        );
        super(command);
        this.client = client;
    }
    
    public async handler(channel: CommandInteraction): Promise<void> {
        const guild = channel?.client?.guilds?.cache.get(channel?.guildId ?? "0")
        const member = guild?.members?.cache.get(channel?.member?.user?.id ?? "0");
        const _channel = member?.voice?.channel;

        let queue = this.client.player.createQueue(guild);
        await queue.join(_channel);

        const url = channel.options.getString("url", true);

        let song = await queue.playlist(url).catch(() => {
            if(!this.client.player.getQueue(guild))
                queue.stop();
        });
        // 

        // if (spotifyToYT.validateURL(url) === false) {
        //     channel.followUp(`I can't accept this, I am sorry :(`);
        // }

        // const result = await spotifyToYT.isTrackOrPlaylist(url);

        // if (result === "playlist") {
        //     const songs = await spotifyToYT.playListGet(url);
        //     const songUrls = songs.songs;
        //     const voice = Voice.fromInteraction(channel);

        //     voice.connect();

        //     for (let i = 0; i < songUrls.length; i++) {
        //         voice.player.addToQueue(songUrls[i]);
        //         console.log(songUrls[i])
        //     }

        //     if(voice.player.getQueueSize() == 1) {
        //         // voice.player.addToQueue(url);
        //         voice.player.playNext();
        //     }
        // }

        // channel.followUp(`${result}`);
    }
}