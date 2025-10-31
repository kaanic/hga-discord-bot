const { SlashCommandBuilder } = require('discord.js');

// function that logs the current server and member count
module.exports = {
	data: new SlashCommandBuilder().setName('server').setDescription('Provides information about the server.'),
	async execute(interaction) {
		// interaction.guild is the object representing the guild in which the command was run
		await interaction.reply(
			`This server is ${interaction.guild.name} and has ${interaction.guild.memberCount} members.`,
		);
	},
};