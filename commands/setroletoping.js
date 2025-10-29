import { SlashCommandBuilder, PermissionFlagsBits } from 'discord.js'

export const data = new SlashCommandBuilder()
  .setName('setroletoping')
  .setDescription('Set which role will be pinged when the button is pressed')
  .addRoleOption(opt =>
    opt.setName('role')
      .setDescription('Role to ping')
      .setRequired(true)
  )
  .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)

export async function execute(interaction, { loadConfig, saveConfig }) {
  if (!interaction.memberPermissions.has(PermissionFlagsBits.Administrator))
    return interaction.reply({ content: 'You need Administrator permission.', ephemeral: true })

  const role = interaction.options.getRole('role')
  if (!role) return interaction.reply({ content: 'Please provide a role.', ephemeral: true })

  const cfg = loadConfig()
  const guildId = interaction.guildId
  cfg[guildId] = cfg[guildId] || {}
  cfg[guildId].roleId = role.id
  saveConfig(cfg)
  return interaction.reply({ content: `Role to ping set to ${role}.`, ephemeral: true })
}
