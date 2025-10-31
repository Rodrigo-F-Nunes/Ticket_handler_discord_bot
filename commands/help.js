import { SlashCommandBuilder, EmbedBuilder } from 'discord.js'

export const data = new SlashCommandBuilder()
	.setName('help')
	.setDescription('List all bot commands and their descriptions')

export async function execute(interaction, context) {
	const commandsList = []
	if (context && context.commandsMap) {
		for (const [name, handler] of context.commandsMap.entries()) {
			// Try to get description from the command data
			if (handler && handler.data && typeof handler.data.description === 'string') {
				commandsList.push({ name, description: handler.data.description })
			}
		}
	}
	// Fallback: get from interaction.client.application.commands.cache if available
	if (commandsList.length === 0 && interaction.client.application?.commands?.cache) {
		for (const cmd of interaction.client.application.commands.cache.values()) {
			commandsList.push({ name: cmd.name, description: cmd.description })
		}
	}

	if (commandsList.length === 0) {
		commandsList.push(
			{ name: 'setchannel', description: 'Set the channel for notifications.' },
			{ name: 'setroletoping', description: 'Set the role to ping.' },
			{ name: 'createmsg', description: 'Create the banner message with a button.' },
			{ name: 'status', description: 'Check if the bot is online and see its uptime.' },
			{ name: 'setlogchannel', description: 'Set the channel that will receive the status and users of previous tickets.' },
		)
	}

	const embed = new EmbedBuilder()
		.setTitle('Bot Commands')
		.setDescription('Here are the available commands:')
		.setColor(0x00AE86)
		.addFields(commandsList.map(cmd => ({ name: `/${cmd.name}`, value: cmd.description || 'No description', inline: false })))

	await interaction.reply({ embeds: [embed]})
}
