import { BaseCommandInteraction, VoiceChannel } from 'discord.js';
import { Bot } from '../../../client/Client';

import { SlashCommandBuilder } from '@discordjs/builders';

export const run = async (client: Bot, interaction: BaseCommandInteraction): Promise<void> => {
    client.players.get(interaction.guildId).pause();

    await interaction.reply({
        embeds: [{
            title: ':pause_button:',
            description: 'Paused the music'
        }]
    });
};

export const data = new SlashCommandBuilder()
	.setName('pause')
	.setDescription('Pauses the music');
