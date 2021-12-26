import { BaseCommandInteraction, VoiceChannel } from 'discord.js';
import { Bot } from '../../../client/Client';

import { SlashCommandBuilder } from '@discordjs/builders';

export const run = async (client: Bot, interaction: BaseCommandInteraction): Promise<void> => {
    client.players.get(interaction.guildId).resume();

    await interaction.reply({
        embeds: [{
            title: ':arrow_forward:',
            description: 'Resumed the music'
        }]
    });
};

export const data = new SlashCommandBuilder()
	.setName('resume')
	.setDescription('Resumes the music');
