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
    },

    sounds: {
        startup: {
            playSound: true,
            links: [
                "https://www.youtube.com/watch?v=DxOka8zaEvE", // wall-e
                "https://www.youtube.com/watch?v=7nQ2oiVqKHw", // XP startup
                "https://www.youtube.com/watch?v=fu3dRQlV6og", // Hi sisters
                "https://www.youtube.com/watch?v=Q_9VMaX61nI", // scheetje
                "https://www.youtube.com/watch?v=-3xrj86vx9g", // Suprise mf
                "https://www.youtube.com/watch?v=mCwd_k-i2nM", // FBI OPEN UP
            ]
        },

        shutdown: {
            playSound: true,
            links: [
                "https://www.youtube.com/watch?v=IROlj4tUggE", // wall-e
                "https://www.youtube.com/watch?v=Gb2jGy76v0Y", // XP shutdown
                "https://www.youtube.com/watch?v=6yrYAOFHi3A", // Mario
                "https://www.youtube.com/watch?v=VbKU58flqH4", // Mario 2
                "https://www.youtube.com/watch?v=xYJ63OTMDL4", // Roblox
                "https://www.youtube.com/watch?v=r9q_T4lhdeo", // BOOOOOOOOOM
                "https://www.youtube.com/watch?v=gPxJAx7ysVA", // GTAV wasted
            ]
        }
    }   
}