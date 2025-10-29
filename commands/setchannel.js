import { SlashCommandBuilder, ChannelType, PermissionFlagsBits } from 'discord.js'

export const data = new SlashCommandBuilder()
  .setName('setchannel')
  .setDescription('Set the channel that will receive button-press notifications')
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
  cfg[guildId].notificationChannelId = channel.id
  saveConfig(cfg)
  return interaction.reply({ content: `Notification channel set to ${channel}.`})
}
