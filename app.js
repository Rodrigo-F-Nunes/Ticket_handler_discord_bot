import dotenv from 'dotenv'
dotenv.config()

import fs from 'fs'
import path from 'path'
import { Client, REST, Routes, GatewayIntentBits, Activity, ActivityType, ButtonBuilder, ActionRowBuilder, ButtonStyle } from 'discord.js';
import { pathToFileURL } from 'url'

const TOKEN = process.env.TOKEN
const APP_ID = process.env.APP_ID
const CONFIG_PATH = path.resolve('./data/config.json')

const commands = []
const commandsMap = new Map()

if (!TOKEN || !APP_ID) {
	console.error('.env must contain TOKEN and APP_ID')
	process.exit(1)
}

function loadConfig() {
	try {
		if (!fs.existsSync(CONFIG_PATH)) return {}
		const raw = fs.readFileSync(CONFIG_PATH, 'utf8')
		return JSON.parse(raw || '{}')
	} catch (err) {
		console.error('Failed to load config:', err)
		return {}
	}
}

function saveConfig(cfg) {
	try {
		const dir = path.dirname(CONFIG_PATH)
		if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true })
		fs.writeFileSync(CONFIG_PATH, JSON.stringify(cfg, null, 2), 'utf8')
	} catch (err) {
		console.error('Failed to save config:', err)
	}
}

async function loadCommands() {
	const commandsPath = path.resolve('./commands')
	if (!fs.existsSync(commandsPath)) return
	const files = fs.readdirSync(commandsPath).filter(f => f.endsWith('.js'))
	for (const file of files) {
		const fullPath = path.join(commandsPath, file)
		const mod = await import(pathToFileURL(fullPath).href)
		if (!mod || !mod.data) continue
		commands.push(mod.data.toJSON())
		if (typeof mod.execute === 'function') commandsMap.set(mod.data.name, mod.execute)
	}
}

async function registerCommandsForGuilds(guilds) {
	await loadCommands()
	const rest = new REST({ version: '10' }).setToken(TOKEN)
	for (const guild of guilds) {
		try {
			console.log(`Registering commands for guild ${guild.id}...`)
			await rest.put(Routes.applicationGuildCommands(APP_ID, guild.id), { body: commands })
			console.log(`Guild commands registered for ${guild.name} (${guild.id})`)
		} catch (err) {
			console.error(`Failed to register commands for guild ${guild.id}:`, err)
		}
	}
}

/*
randomizer that i dont need now but i thought it was cool
const clientActivity=[
    { name: 'GitHub', type: ActivityType.Custom, url: 'https://github.com/Rodrigo-F-Nunes'},
    { name: 'Rock n Roll', type: ActivityType.listening, url: 'https://open.spotify.com/playlist/41vWl8AWa39l5kAtLoLkyT?si=tTnhdReaReuzy-aXtnhlEA'},
    { name: 'Opening tickets', type: ActivityType.Custom}
]

setInterval(() => {
        const activityRandom = clientActivity[Math.floor(Math.random() * clientActivity.length)];
        client.user.setActivity(clientActivity[activityRandom]);
},10000)

setInterval inside of client.once('ready', async () => {})

*/

const client = new Client({ intents: [GatewayIntentBits.Guilds] })

client.once('clientReady', async () => {
	console.log(`Logged in as ${client.user.tag}`)
    client.user.setActivity({ name: 'github', state: 'on_test', type: ActivityType.Custom, url: 'https://github.com/Rodrigo-F-Nunes'});
	await registerCommandsForGuilds(client.guilds.cache.values())
})

client.on('interactionCreate', async interaction => {
	try {
			if (interaction.isChatInputCommand()) {
				const guildId = interaction.guildId
				if (!guildId) return interaction.reply({ content: 'This command must be used in a server/guild.', ephemeral: true })

				const handler = commandsMap.get(interaction.commandName)
				if (!handler) return interaction.reply({ content: 'Command not implemented on the bot.', ephemeral: true })
					
				// Pass commandsMap to help command for dynamic listing
				return handler(interaction, { loadConfig, saveConfig, client, commandsMap })
			}

		if (interaction.isStringSelectMenu()) {
			if (interaction.customId !== 'selectMenu') return

			await interaction.deferReply({ ephemeral: true })
			const cfg = loadConfig()
			const guildId = interaction.guildId
			if (!guildId) return interaction.editReply({ content: 'This select menu must be used in a server.', ephemeral: true })

			const guildCfg = cfg[guildId]
			if (!guildCfg || !guildCfg.notificationChannelId) return interaction.editReply({ content: 'Notification channel is not configured. An admin must run /setchannel first.', ephemeral: true })
			if (!guildCfg.roleId) return interaction.editReply({ content: 'Role to ping is not configured. An admin must run /setroletoping first.', ephemeral: true })

			const notifyChannel = await client.channels.fetch(guildCfg.notificationChannelId).catch(() => null)
			if (!notifyChannel) return interaction.editReply({ content: 'Could not find the configured notification channel (maybe it was deleted).', ephemeral: true })

			const selected = interaction.values[0]
			let optionText = ''
			if (selected === 'id_1') optionText = 'Opção 1'
			else if (selected === 'id_2') optionText = 'Opção 2'
			else if (selected === 'id_3') optionText = 'Opção 3'
			else optionText = selected

			if (!global.ticketRequests) global.ticketRequests = new Map()
			global.ticketRequests.set(`ticket_${interaction.user.id}`, { userId: interaction.user.id, optionText })

			const claimButton = new ButtonBuilder()
				.setCustomId(`claim_ticket_${interaction.user.id}`)
				.setLabel('Claim ticket')
				.setStyle(ButtonStyle.Success)

			const row = new ActionRowBuilder().addComponents(claimButton)

			await notifyChannel.send({
				content: `<@&${guildCfg.roleId}> <@${interaction.user.id}> fez um pedido: **${optionText}**`,
				allowedMentions: { roles: [guildCfg.roleId], users: [interaction.user.id] },
				components: [row]
			})
			return interaction.editReply({ content: `Pedido recebido! Um moderador entrará em contato brevemente em ${notifyChannel}.`, ephemeral: true })
		}

		if (interaction.isButton() && interaction.customId.startsWith('claim_ticket_')) {
			await interaction.deferReply({ ephemeral: true })
			const requestKey = interaction.customId.replace('claim_ticket_', 'ticket_')
			const ticketInfo = global.ticketRequests?.get(requestKey)
			if (!ticketInfo) return interaction.editReply({ content: 'Ticket info not found.', ephemeral: true })
			const userId = ticketInfo.userId
			const optionText = ticketInfo.optionText
			const claimerId = interaction.user.id
			const guild = interaction.guild
			if (!guild) return interaction.editReply({ content: 'Guild not found.', ephemeral: true })

			try {
				const originalMsg = await interaction.message.fetch()
				if (originalMsg) {
					await originalMsg.edit({ components: [] })
				}
			} catch (e) {
				console.error('Failed to remove claim button:', e)
			}

			const user = await client.users.fetch(userId).catch(() => null)
			const claimer = await client.users.fetch(claimerId).catch(() => null)
			const clean = name => name?.replace(/[^a-zA-Z0-9-_]/g, '').toLowerCase() || 'unknown'
			const ticketChannelName = `ticket-${clean(user?.username)}-${clean(claimer?.username)}`

			const ticketChannel = await guild.channels.create({
				name: ticketChannelName.slice(0, 90),
				type: 0,
				permissionOverwrites: [
					{ id: guild.id, deny: ['ViewChannel'] },
					{ id: userId, allow: ['ViewChannel', 'SendMessages'] },
					{ id: claimerId, allow: ['ViewChannel', 'SendMessages'] },
					{ id: client.user.id, allow: ['ViewChannel', 'SendMessages'] },
				]
			})

			const closeButton = new ButtonBuilder()
				.setCustomId(`close_ticket_${ticketChannel.id}`)
				.setLabel('Fechar ticket')
				.setStyle(ButtonStyle.Danger)

			const closeRow = new ActionRowBuilder().addComponents(closeButton)
			await ticketChannel.send({
				content: `Ticket criado para <@${userId}> e <@${claimerId}>. Pedido: **${optionText}**\n\n`,
				components: [closeRow]
			})
			return interaction.editReply({ content: `Ticket criado: ${ticketChannel}.`})

		}

		if (interaction.isButton() && interaction.customId.startsWith('close_ticket_')) {
			await interaction.deferReply({ ephemeral: true })
			const channel = interaction.channel

			const member = interaction.member
			if (!member.permissions.has('ManageChannels')) {
				return interaction.editReply({ content: 'Apenas moderadores do ticket podem fechá-lo.'})
			}

			await interaction.editReply({ content: 'Fechando o ticket...' })

			setTimeout(async () => {
				try {
					await channel.delete('Ticket fechado pelo usuário via botão.')
				} catch (err) {
					console.error('Erro ao deletar o ticket:', err)
				}
			}, 2000)
		}

	} catch (err) {
		console.error('Interaction handler error:', err)
		try { if (interaction.replied || interaction.deferred) await interaction.editReply({ content: 'An error occurred while handling your request.', ephemeral: true })
			else await interaction.reply({ content: 'An error occurred while handling your request.', ephemeral: true }) } catch(e){}
	}
})

client.login(TOKEN)
