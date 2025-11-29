const { SlashCommandBuilder } = require('discord.js');
const { getOrCreateUser } = require('../../database/repositories/userRepository');

// command for basic personal stats on the server
module.exports = {
    data: new SlashCommandBuilder()
        .setName('balance')
        .setDescription('Check your current balance and stats.'),
    async execute(interaction) {
        const user = getOrCreateUser(
            interaction.guildId,
            interaction.user.id,
            interaction.user.username,
        );

        if (!user) {
            return interaction.reply('Error retrieving your balance.');
        }

        await interaction.reply(
            `**${user.username}'s Stats**\n` +
			`Balance: **${user.balance}** points\n` +
			`Level: **${user.level}**\n` +
			`Experience: **${user.experience}** XP`,
        );
    },
};