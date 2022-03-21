import { SlashCommandBuilder, SlashCommandStringOption } from "@discordjs/builders";
import { Song, Utils } from "discord-music-player";
import { CommandInteraction } from "discord.js";
// import { Voice } from "../voice";
import Command from "./command";
import spotify from "../spotify";

const spotifyToYT = require("spotify-to-yt");

export default class Playlist extends Command {
    private client: any;
    constructor(client: any) {
        const command = new SlashCommandBuilder()
                        .setName("playlist")
                        .setDescription("Add a playlist from Apple Music, Spotify or YouTube")
                        .addStringOption(new SlashCommandStringOption()
                            .setName("url")
                            .setRequired(true)
                            .setDescription("The playlist/track url")
                        );
        super(command);
        this.client = client;
    }
    
    public async handler(interaction: CommandInteraction): Promise<void> {
        const { guild, member, channel } = this.transformInteraction(interaction);

        let queue = this.client.player.createQueue(guild);
        await queue.join(channel);

        const url = interaction.options.getString("url", true);
        
        let playlistName = "";
        
        // if(url.includes("spotify")) {
        //     const id: any = url.substring(34).split("?")[0];
        //     // const id: any = url.match('/playlist/([^?]+)/')?.pop();
        //     console.log(id)
        //     let playlist: any = await spotify.getPlaylist(id);

        //     for(let trackObject of playlist.body.tracks.items) {
        //         const track = trackObject.track;
        //         const songUrl: any = await Utils.link(track.external_urls.spotify, {}, this.client.player.getQueue(guild));

        //         const song: any = new Song({
        //             name: track.name,
        //             author: track.artists[0].name,
        //             url: songUrl.url,
        //             thumbnail: track.album.images[0].url,
        //             duration: Utils.msToTime(track.duration_ms),
        //             isLive: false
        //         }, queue, interaction.user);

        //         await queue.play(song).catch(() => {
        //             if(!this.client.player.getQueue(guild))
        //                 queue.stop();
        //         });
        //     }
        
        // } else {
            let playlist = await queue.playlist(url).catch(() => {
                if(!this.client.player.getQueue(guild))
                    queue.stop();
            });

            playlistName = playlist.name;
        // }

        interaction.followUp(`Added all songs of ${playlistName} to the queue!`);
    }
}