import { SlashCommandBuilder, SlashCommandStringOption } from "@discordjs/builders";
import { CommandInteraction } from "discord.js";
import SpotifyApi from "spotify-web-api-node";
import config from "../config";
import Command from "./command";

export default class Search extends Command {
    constructor() {
        const command: Omit<SlashCommandBuilder, "addSubcommand" | "addSubcommandGroup"> = new SlashCommandBuilder()
        .setName("search")
        .setDescription("Finds a song on spotify")
        .addStringOption(new SlashCommandStringOption()
            .setName("query")
            .setRequired(true)
            .setDescription("The song to search for")
        );

        super(command);
    }
    
    public async handler(interaction: CommandInteraction): Promise<void> {
        const api = new SpotifyApi({
            clientId: config.spotify.id,
            clientSecret: config.spotify.token
        });

        const auth = await api.clientCredentialsGrant();
        api.setAccessToken(auth.body.access_token);

        let result = await api.search(interaction.options.getString('query', true), ["track"])
        let tracks = result.body.tracks;
        
        if(tracks == null || tracks.items.length == 0) {
            interaction.followUp("No results found :(");
            return;
        }

        let track = tracks.items[0];

        interaction.followUp({
            embeds: [
                {
                    title: track.name,
                    url: track.external_urls.spotify,
                    description: track.artists.map(artist => artist.name).join(", "),
                    thumbnail: {
                        url: track.album.images[0].url
                    },
                    footer: {
                        text: `${Math.round(track.duration_ms / 1000 / 60 % 60)} : ${Math.floor(track.duration_ms / 1000 % 60)}`
                    }
                }
            ]
        });
    }
}