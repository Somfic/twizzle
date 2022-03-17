import { REST } from '@discordjs/rest';
import { Client, Intents } from 'discord.js';
import { Routes } from 'discord-api-types/v9';
import config from "./config";
import { Command, Ping, Search, YouTube, Leave, Skip, Join } from './commands';

const client = new Client({intents: [Intents.FLAGS.GUILDS, Intents.FLAGS.GUILD_VOICE_STATES]});
const commands: { [key: string]: Command } = {
    ping: new Ping(),
    search: new Search(),
    youtube: new YouTube(),
    leave: new Leave(),
    skip: new Skip(),
    join: new Join()
};

client.once('ready', async () => {
    console.log('Ready!');
    registerCommands();
    
    if(process.env.NODE_ENV === 'development') {
        client.user?.setStatus('idle');
    } else {
        client.user?.setStatus('online');
    }
});

client.on('interactionCreate', async channel => {
    if(!channel.isCommand())
        return;

    await channel.deferReply({ephemeral: config.commands.ephemeral});

    const { commandName } = channel;

    try {
        console.log(`Processing command: ${commandName}`);
        await commands[commandName].handler(channel);
    } catch(error) {
        console.log(1);
        console.log(`Error processing command: ${commandName}`);
        console.log(error);
        channel.followUp({content: "no u\n```" + error + "```", ephemeral: config.commands.ephemeral});
    }
})

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