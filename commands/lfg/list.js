const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { getActiveLFGPosts } = require('../../database/repositories/lfgRepository');
const { getGame, getGameEmoji } = require('../../config/gamesConfig');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('lfglist')
		.setDescription('View all active LFG posts')
		.addStringOption((option) =>
			option
				.setName('game')
				.setDescription('Filter by game (optional)')
				.setRequired(false)
				.setAutocomplete(true),
		),

	async execute(interaction) {
		try {
			await interaction.deferReply();

			const gameFilter = interaction.options.getString('game');
			let posts = getActiveLFGPosts(interaction.guildId);

			// filtering the by game if it is specified
			if (gameFilter) {
				posts = posts.filter((post) => post.game === gameFilter);
			}

			// in case no posts are found
			if (posts.length === 0) {
				const embed = new EmbedBuilder()
					.setColor('#FF6B6B')
					.setTitle('No Active LFG Posts')
					.setDescription(gameFilter ? `No LFG posts found for ${getGame(gameFilter)?.name || gameFilter}.` : 'No LFG posts are currently active.');

				return interaction.editReply({ embeds: [embed] });
			}

			// making embeds for each post
			const embeds = posts.map((post) => {
				const game = getGame(post.game);
				const voiceChannel = interaction.guild.channels.cache.get(post.voiceChannelId);

				const embed = new EmbedBuilder()
					.setColor('#6BCB77')
					.setTitle(`${getGameEmoji(post.game)} ${game?.name || post.game}`)
					.addFields(
						{ name: 'Game Type', value: post.gameType || 'Any', inline: true },
						{ name: 'Players Needed', value: `${post.playerCountNeeded}`, inline: true },
						{ name: 'Posted By', value: `<@${post.userId}>`, inline: true },
						{ name: 'Voice Channel', value: voiceChannel ? `${voiceChannel.toString()}` : 'Channel deleted', inline: true },
						{ name: 'Expires', value: `<t:${Math.floor(new Date(post.expiresAt).getTime() / 1000)}:R>`, inline: true },
						{ name: 'Post ID', value: `\`${post.id}\``, inline: true },
					);

				return embed;
			});

			// discord has 5 embed limit per message
			if (embeds.length <= 5) {
				await interaction.editReply({ embeds });
			} else {
				await interaction.editReply({
					embeds: embeds.slice(0, 5),
					content: `Showing 5 of ${embeds.length} active LFG posts.`,
				});
			}
		} catch (error) {
			console.error('Error in LFG list:', error);
			await interaction.editReply({
				content: 'An error occurred while fetching LFG posts.',
			});
		}
	},

	async autocomplete(interaction) {
		const focusedOption = interaction.options.getFocused(true);

		if (focusedOption.name === 'game') {
			const { gamesConfig } = require('../../config/gamesConfig');
			const games = Object.entries(gamesConfig);

			const filtered = games
            // eslint-disable-next-line no-unused-vars
				.filter(([key, game]) =>
					game.name.toLowerCase().includes(focusedOption.value.toLowerCase()),
				)
				.slice(0, 25);

			const choices = filtered.map(([key, game]) => ({
				name: game.name,
				value: key,
			}));

			await interaction.respond(choices);
		}
	},
};