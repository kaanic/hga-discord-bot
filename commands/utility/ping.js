const { SlashCommandBuilder } = require('discord.js');

// basic function to check ping
module.exports = {
	data: new SlashCommandBuilder().setName('ping').setDescription('Replies with Pong!'),
	async execute(interaction) {
		await interaction.reply('Pong!');
	},
};