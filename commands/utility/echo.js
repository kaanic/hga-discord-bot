const { SlashCommandBuilder, ChannelType } = require('discord.js');

// a command to echo a string in specified channel
module.exports = {
	data: new SlashCommandBuilder()
		.setName('echo')
		.setDescription('Replies with your input')
		.addStringOption((option) =>
			option
				.setName('input')
				.setDescription('The input to echo back')
				.setMaxLength(2_000)
				.setRequired(true))
		.addChannelOption((option) =>
			option
				.setName('channel')
				.setDescription('The channel to echo into')
				.addChannelTypes(ChannelType.GuildText),
			),
		async execute(interaction) {
			const input = interaction.options.getString('input');
			const channel = interaction.options.getChannel('channel');

			// no specified channel
			if (!channel) {
				await interaction.reply({ content: input });
				return;
			}

			// send and confirm
			try {
				await channel.send(input);
				await interaction.reply({
					content: `Message echoed to ${channel}.`,
					ephemeral: true,
				});
			} catch (error) {
				await interaction.reply({
					content: `No permission to send message in that channel.\nError: ${error}`,
					ephemeral: true,
				});
			}
		},
};