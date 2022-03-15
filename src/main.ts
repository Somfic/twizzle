import { SlashCommandBuilder } from '@discordjs/builders';
import { REST } from '@discordjs/rest';
import { Client, Intents } from 'discord.js';
import fs from 'fs';
import { Routes } from 'discord-api-types/v9';

import config from "./config";

import { generateDependencyReport } from '@discordjs/voice';

const client = new Client({intents: [Intents.FLAGS.GUILDS]});

client.once('ready', async () => {
    console.log('Ready!');
    registerCommands();
    console.log(generateDependencyReport());
});

client.on('interactionCreate', async interaction => {
    if(!interaction.isCommand())
        return;

    await interaction.deferReply({ephemeral: true});

    const { commandName } = interaction;

    try {
        console.log(`Processing command: ${commandName}`);
        await require(`./commands/${commandName}.ts`).default.handler(interaction);
    } catch(error) {
        interaction.followUp({content: "Oh no .. our bot .. it's broken\n```" + error + "```", ephemeral: true});
        console.error(`Error processing command: ${commandName}`);
        console.error(error);
    }
})

client.login(config.discord.token);

function registerCommands() {
    const files = fs.readdirSync('./src/commands').filter(file => file.endsWith('.ts'))
    const commands: SlashCommandBuilder[] = [];
    
    for(const file of files) {        
        try {
            const command = require(`./commands/${file}`).default.command as SlashCommandBuilder;
            command.setName(file.replace('.ts', ''));
            commands.push(command);
        } catch(error) {
            console.error(`Error processing file: ${file}`);
            console.error(error);
        }
    }

    const json = commands.map(command => command.toJSON());
    const rest = new REST({ version: '9' }).setToken(config.discord.token);
    rest.put(Routes.applicationGuildCommands(config.discord.id, config.discord.guild), { body: commands })
	.then(() => console.log('Successfully registered application commands.'))
	.catch(console.error);
}