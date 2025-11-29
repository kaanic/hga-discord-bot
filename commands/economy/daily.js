const { SlashCommandBuilder } = require('discord.js');
const { getOrCreateUser, claimDaily } = require('../../database/repositories/userRepository');
const { ECONOMY } = require('../../globals');

const DAILY_AMOUNT = ECONOMY.DAILY_AMOUNT;

module.exports = {
    data: new SlashCommandBuilder()
        .setName('daily')
        .setDescription('Claim your daily points!'),
    async execute(interaction) {
        const userId = interaction.user.id;
        const guildId = interaction.guildId;

        getOrCreateUser(guildId, userId, interaction.user.username);

        const result = claimDaily(guildId, userId, DAILY_AMOUNT);
        if (!result) return interaction.reply('Error claiming daily points.');

        if (!result.success) {
            return interaction.reply({
                content: `${result.message}`,
                ephemeral: true,
            });
        }

        await interaction.reply(
            '**Daily Claimed!**\n' +
            `You received **${DAILY_AMOUNT}** points!\n` +
            `New balance: **${result.user.balance}**`,
        );
    },
};