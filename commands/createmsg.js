import { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder, ActionRowBuilder, StringSelectMenuBuilder } from 'discord.js'

export const data = new SlashCommandBuilder()
  .setName('createmsg')
  .setDescription('Create the banner message with a button in this channel')
  .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)

export async function execute(interaction) {
  if (!interaction.memberPermissions.has(PermissionFlagsBits.Administrator))
    return interaction.reply({ content: 'You need Administrator permission.', ephemeral: true })

  const embed = new EmbedBuilder()
    .setTitle('Faça seu pedido aqui!')
    .setImage('https://media.discordapp.net/attachments/1419766814703095838/1433092962728017991/frieren-e-a-jornada-para-o-alem-qhvlvd2l8mr5.png?ex=69036f53&is=69021dd3&hm=7e59b4cca732c6ca103470ddec50dbc2eade179a37d68beb9637c5e0706dfcf8&=&format=webp&quality=lossless') // placeholder banner
    .setDescription(':sob:')
    .setColor(0x00AE86)
    
  const selectMenu = new StringSelectMenuBuilder()
    .setCustomId('selectMenu')
    .setPlaceholder('Selecione sua opção:')
    .addOptions([
      {
        label: 'Opção 1',
        description: 'Descrição da opção 1',
        value: 'id_1',
      },
      {
        label: 'Opção 2',
        description: 'Descrição da opção 2',
        value: 'id_2',
      },
      {
        label: 'Opção 3',
        description: 'Descrição da opção 3',
        value: 'id_3',
      },
    ])

  const row = new ActionRowBuilder().addComponents(selectMenu)

  await interaction.reply({ content: 'Creating message...', ephemeral: true })
  const channel = interaction.channel
  if (!channel) return interaction.editReply({ content: 'Failed to find channel to send message.', ephemeral: true })
  await channel.send({ embeds: [embed], components: [row] })
  return interaction.editReply({ content: 'Message created in this channel.', ephemeral: true })
}
