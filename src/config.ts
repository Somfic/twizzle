require('dotenv').config();

export default {
    discord: {
        id: process.env.DISCORD_ID ?? '',
        token: process.env.DISCORD_TOKEN ?? '',
        guild: process.env.DISCORD_GUILD ?? '',
    },

    spotify: {
        id: process.env.SPOTIFY_ID ?? '',
        token: process.env.SPOTIFY_TOKEN ?? '',
    },

    commands: {
        ephemeral: false,
    }
}