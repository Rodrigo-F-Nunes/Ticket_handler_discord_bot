import { SlashCommandBuilder, ChannelType, PermissionFlagsBits } from 'discord.js'

export const data = new SlashCommandBuilder()
  .setName('setlogchannel')
  .setDescription('Set the channel that will receive the status and users f previous tickets')
  .addChannelOption(opt =>
    opt.setName('channel')
      .setDescription('Text channel to notify')
      .setRequired(true)
      .addChannelTypes(ChannelType.GuildText)
  )
  .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)

export async function execute(interaction, { loadConfig, saveConfig }) {
  if (!interaction.memberPermissions.has(PermissionFlagsBits.Administrator))
    return interaction.reply({ content: 'You need Administrator permission.', ephemeral: true })

  const channel = interaction.options.getChannel('channel')
  if (!channel || channel.type !== ChannelType.GuildText) return interaction.reply({ content: 'Please provide a text channel.', ephemeral: true })

  const cfg = loadConfig()
  const guildId = interaction.guildId
  cfg[guildId] = cfg[guildId] || {}
  cfg[guildId].logChannelId = channel.id
  saveConfig(cfg)
  return interaction.reply({ content: `Log channel set to ${channel}.`})
}
