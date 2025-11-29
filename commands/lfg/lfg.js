const { SlashCommandBuilder } = require('discord.js');
const { createLFGPost, getLFGPost, deleteLFGPost } = require('../../database/repositories/lfgRepository');
const { getGame } = require('../../config/gamesConfig');
const lfgConfig = require('../../config/lfgConfig');

const createCooldowns = new Map();

module.exports = {
    data: new SlashCommandBuilder()
        .setName('lfg')
		.setDescription('Looking for group system')
		.addSubcommand((subcommand) =>
			subcommand
				.setName('create')
				.setDescription('Create a new LFG post!')
				.addStringOption((option) =>
					option
						.setName('game')
						.setDescription('Select a game')
						.setRequired(true)
						.setAutocomplete(true),
				)
				.addStringOption((option) =>
					option
						.setName('gametype')
						.setDescription('Game type (auto-filled based on game)')
						.setRequired(true)
						.setAutocomplete(true),
				)
				.addIntegerOption((option) =>
					option
						.setName('playercount')
						.setDescription('How many players needed')
						.setRequired(true)
						.setMinValue(1)
						.setMaxValue(10),
				)
				.addIntegerOption((option) =>
					option
						.setName('duration')
						.setDescription('How long the post lasts (in minutes)')
						.setRequired(false)
						.setMinValue(5)
						.setMaxValue(1440),
				)
				.addStringOption((option) =>
					option
						.setName('description')
						.setDescription('Additional details (optional)')
						.setRequired(false)
						.setMaxLength(200),
				),
		)
		.addSubcommand((subcommand) =>
			subcommand
				.setName('delete')
				.setDescription('Delete your LFG post')
				.addIntegerOption((option) =>
					option
						.setName('postid')
						.setDescription('The ID of your LFG post')
						.setRequired(true),
                ),
        ),

    async execute(interaction) {
        const subcommand = interaction.options.getSubcommand();

        if (subcommand === 'create') {
           await handleCreate(interaction);
        } else if (subcommand === 'delete') {
            await handleDelete(interaction);
        }
    },

    async autocomplete(interaction) {
        const focusedOption = interaction.options.getFocused(true);
        const gameInput = interaction.options.getString('game');

        if (focusedOption === 'game') {
            // getting all the games from config
            const { gamesConfig } = require('../../config/gamesConfig');
            const games = Object.entries(gamesConfig);

            // filtering based on the input to autocomplete
            const filtered = games
                // eslint-disable-next-line no-unused-vars
                .filter(([key, game]) =>
                    game.name.toLowerCase().includes(focusedOption.value.toLowerCase()),
                ).slice(0, 25);

            const choices = filtered.map(([key, game]) => ({
                name: game.name,
                value: key,
            }));

            await interaction.respond(choices);
        } else if (focusedOption.name === 'gametype') {
            // getting game types based on previously selected game
            const selectedGame = gameInput ? getGame(gameInput) : null;

            if (!selectedGame) {
                await interaction.respond([]);
                return;
            }

            // if the game has predefined typed from the cfg file, showing them here
            await interaction.respond([
                {
                    name: focusedOption.value || 'Custom game type',
                    value: focusedOption.value || 'Any',
                },
            ]);
        }
    },
};

// --- HANDLER FUNCTIONS ---

async function handleCreate(interaction) {
    try {
        const userId = interaction.user.id;
		const now = Date.now();
		const cooldownAmount = lfgConfig.createCooldown * 60 * 1000;

		if (createCooldowns.has(userId)) {
			const expirationTime = createCooldowns.get(userId) + cooldownAmount;

			if (now < expirationTime) {
				return interaction.reply({
					content: `You're on cooldown! You can create another LFG post <t:${Math.round(expirationTime / 1000)}:R>.`,
					ephemeral: true,
				});
			}
		}

        // making variable for each option
        const game = interaction.options.getString('game');
		const gameType = interaction.options.getString('gametype');
		const playerCount = interaction.options.getInteger('playercount');
		const duration = interaction.options.getInteger('duration') || lfgConfig.defaultDuration;
		const description = interaction.options.getString('description');

        // validation
        const gameConfig = getGame(game);
        if (!gameConfig) {
            return interaction.reply({
                content: `Player count must be between ${gameConfig.minPlayers} and ${gameConfig.maxPlayers} for ${gameConfig.name}.`,
                ephemeral: true,
            });
        }

        // calculating expiration time
        const expiresAt = new Date(Date.now() + duration * 60 * 1000);

        const post = createLFGPost(
            interaction.guildId,
            interaction.user.id,
            game,
            gameType,
            playerCount,
            expiresAt.toISOString(),
            description,
        );

        if (!post) {
            return interaction.reply({
                content: 'Error creating LFG post, please try again.',
                ephemeral: true,
            });
        }

        // setting the cooldown
        createCooldowns.set(userId, now);

        // sending confirmation to discord chat
        await interaction.reply({
            content: `LFG post created!\n
                     **Game:** ${gameConfig.name}\n
                     **Type:** ${gameType}\n
                     **Players Needed:** ${playerCount}\n
                     **Duration:** ${duration} minutes${description ? `\n
                    **Description:** ${description}` : ''}`,
            ephemeral: true,
        });
    } catch (error) {
        console.error('Error in LFG create:', error);
        await interaction.reply({
            content: 'An error occured while creating the LFG post.',
            ephemeral: true,
        });
    }
}

async function handleDelete(interaction) {
    try {
        const postId = interaction.options.getInteger('postid');

        // checking if the post exists and the user is the one created the post
        const post = getLFGPost(postId);

        if (!post) {
			return interaction.reply({
				content: 'LFG post not found.',
				ephemeral: true,
			});
		}

		if (post.userId !== interaction.user.id) {
			return interaction.reply({
				content: 'You can only delete your own LFG posts.',
				ephemeral: true,
			});
		}

        // deleting the post
        const success = deleteLFGPost(postId);

        if (!success) {
			return interaction.reply({
				content: 'Error deleting LFG post. Please try again.',
				ephemeral: true,
			});
		}

		await interaction.reply({
			content: `✅ LFG post #${postId} deleted.`,
			ephemeral: true,
		});
    } catch (error) {
        console.error('Error in LFG delete:', error);
		await interaction.reply({
			content: 'An error occurred while deleting the LFG post.',
			ephemeral: true,
		});
    }
}