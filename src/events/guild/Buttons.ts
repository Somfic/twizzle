import { ButtonInteraction} from "discord.js";
import { Bot } from "../../client/Client";
import { ButtonCommand } from "../../interfaces/ButtonCommand";
import { Command } from "../../interfaces/Command";
import { RunFunction } from "../../interfaces/Event";

export const run: RunFunction = async (client: Bot, interaction: ButtonInteraction): Promise<void> => {
    if(!interaction.isButton())
        return;


    const id = interaction.customId;
    const button: ButtonCommand = client.buttons.get(id);

    if(!button)  {
        return;
    }

    button.run(client, interaction).catch(error => {
        interaction.reply(`An error occurred while running the button ${button.id}`);
        client.logger.error(error);
    });
}

export const name: string = "interactionCreate";