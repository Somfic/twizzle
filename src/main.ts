import { REST } from '@discordjs/rest';
import { ButtonInteraction, Client as DiscordClient, CommandInteraction, Intents, MessageActionRow, MessageButton, MessageEmbed } from 'discord.js';
import { Routes } from 'discord-api-types/v9';
import config from "./config";
import { Command, Playlist, Ping, Search, Leave, Skip, Track, Clear, Shuffle, Play, Pause } from './commands';
import { Player, Queue, Song } from 'discord-music-player';
import  { Client } from "./client"
// global.AbortController = require("node-abort-controller").AbortController;

const client = new DiscordClient({intents: [Intents.FLAGS.GUILDS, Intents.FLAGS.GUILD_MESSAGES, Intents.FLAGS.GUILD_VOICE_STATES]});

const player = new Player(client, {
    leaveOnEnd: false,
    leaveOnStop: false,
    leaveOnEmpty: false,
    deafenOnJoin: true
});

(client as Client).player = player;


player
    .on('songFirst', (queue: Queue, song: Song) => {
        console.log("first!!")
        buildEmbeds(song, queue);
    })
    .on('songChanged', (queue: Queue, newSong: Song, oldSong: Song) => {
        buildEmbeds(newSong, queue);
    })

let lastInteraction: CommandInteraction;



const commands: { [key: string]: Command } = {
    ping: new Ping(client),
    search: new Search(client),
    leave: new Leave(client),
    skip: new Skip(client),
    track: new Track(client),
    playlist: new Playlist(client),
    clear: new Clear(client),
    shuffle: new Shuffle(client),
    play: new Play(client),
    pause: new Pause(client)
};

client.once('ready', async () => {
    console.log('Ready!');
    registerCommands();
    
    if(config.env === 'development') {
        client.user?.setStatus('idle');
        client.user?.setActivity("Playing Twizzle Developer 2022");
    } else {
        client.user?.setStatus('online');
        client.user?.setActivity("Playing Twizzle");
    }
});


client.on('interactionCreate', async (interaction: CommandInteraction | ButtonInteraction | any) => {
    if(interaction.isCommand() == false && interaction.isButton() == false) {
        return;
    }
    
    if (interaction.isCommand()) {
        lastInteraction = interaction as CommandInteraction;
    }

    await (interaction as CommandInteraction | ButtonInteraction).deferReply({ephemeral: config.commands.ephemeral});

    const command = (interaction as any).customId ?? (interaction as any).commandName;

    try {
        console.log(`Processing command: ${command}`);
        
        await commands[command].handler(interaction as any);

        if (command === "pause" || command === "play") {
            const song = player.getQueue((lastInteraction?.guild as any).toString()!)?.nowPlaying;
            if (song) buildEmbeds(song, (player.getQueue((lastInteraction.guild as any))) as Queue);
        }
    } catch(error) {
        console.log(`Error processing command: ${command}`);
        console.log(error);
        interaction.followUp({content: "no u\n```" + error + "```", ephemeral: config.commands.ephemeral});
    }
});

client.login(config.discord.token);

function registerCommands() {
    const json = [];

    for (const command in commands) {
        json.push(commands[command].getCommandJSON());
    }

    const rest = new REST({ version: '9' }).setToken(config.discord.token);
    rest.put(Routes.applicationGuildCommands(config.discord.id, config.discord.guild), { body: json })
	.then(() => console.log('Successfully registered application commands.'))
	.catch(console.error);
}

function buildEmbeds(currentSong: Song, queue: Queue) {
    const progressbar = player.getQueue((lastInteraction?.guild as any).toString() + "")?.createProgressBar().prettier;
    console.log(progressbar);
    let currentlyPlaying = new MessageEmbed()
        .setTitle(currentSong.name)
        .setURL(currentSong.url)
        .setThumbnail(currentSong.thumbnail)
        .setDescription(currentSong.duration);

    const pause = new MessageButton()
        .setCustomId('pause')
        .setLabel('Pause')
        .setStyle('PRIMARY')
        .setEmoji('⏸️');

    const play = new MessageButton()
        .setCustomId('play')
        .setLabel('Play')
        .setStyle('PRIMARY')
        .setEmoji('▶️');

    const skip = new MessageButton()
        .setCustomId("skip")
        .setLabel("Skip")
        .setStyle("PRIMARY")
        .setEmoji("⏭");

    const leave = new MessageButton()
        .setCustomId("leave")
        .setLabel("Leave")
        .setStyle("DANGER")
        .setEmoji("⏹");

    const shuffle = new MessageButton()
        .setCustomId("shuffle")
        .setLabel("Shuffle")
        .setStyle("SECONDARY")
        .setEmoji("🔀");

    const row = new MessageActionRow()
        .addComponents(player.getQueue((lastInteraction.guild as any))?.isPlaying ? pause : play, skip, shuffle, leave);
        
    lastInteraction.followUp({
        content: "aids",
        embeds: [currentlyPlaying],
        components: [row]
    });
}