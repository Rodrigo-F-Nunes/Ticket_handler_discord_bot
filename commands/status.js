import { SlashCommandBuilder, EmbedBuilder } from 'discord.js'

export const data = new SlashCommandBuilder()
  .setName('status')
  .setDescription('Check if the bot is online and see its uptime')

export async function execute(interaction) {
  const uptimeSec = Math.floor(process.uptime())
  const uptimeMin = Math.floor(uptimeSec / 60)
  const embed = new EmbedBuilder()
    .setTitle('Bot Status')
    .setDescription('✅ O bot está online!')
    .addFields({ name: 'Uptime', value: `${uptimeMin} min (${uptimeSec} sec)` })
    .setColor(0x00AE86)
  await interaction.reply({ embeds: [embed], ephemeral: true })
}