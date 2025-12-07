const { SlashCommandBuilder, EmbedBuilder, ChannelType } = require('discord.js');
const { createLFGPost, getLFGPost, deleteLFGPost, updatePostMessageId } = require('../../database/repositories/lfgRepository');
const { getGame, validateGameAndType, validatePlayerCount, getGameEmoji } = require('../../config/gamesConfig');
const lfgConfig = require('../../config/lfgConfig');

const createCooldowns = new Map();
let roomCounter = 0;

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

        if (focusedOption.name === 'game') {
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
            if (selectedGame.gameTypes.length > 0) {
                const filtered = selectedGame.gameTypes
                    .filter(type => type.toLowerCase().includes(focusedOption.value.toLowerCase()))
                    .slice(0, 25);

                const choices = filtered.map(type => ({
                    name: type,
                    value: type,
                }));

                await interaction.respond(choices);
            } else {
                // no predefined types for the game, custom input
                await interaction.respond([
                    {
                        name: focusedOption.value || 'Custom game type',
                        value: focusedOption.value || 'Any',
                    },
                ]);
            }
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

        // validation
        const gameConfig = getGame(game);
        if (!gameConfig) {
            return interaction.reply({
                content: 'Invalid game selected.',
                ephemeral: true,
            });
        }

        if (!validateGameAndType(game, gameType)) {
            return interaction.reply({
                content: `Invalid game type for ${gameConfig.name}.`,
                ephemeral: true,
            });
        }

        if (!validatePlayerCount(game, playerCount)) {
            return interaction.reply({
                content: `Player count must be between ${gameConfig.minPlayers} and ${gameConfig.maxPlayers} for ${gameConfig.name}.`,
                ephemeral: true,
            });
        }

        // deferring to give more time for voice channel creation
        await interaction.deferReply({ ephemeral: true });

        // creating voice channel
        roomCounter++;
        const channelName = `${roomCounter} - ${gameConfig.name}`;

        // verifying that the category exists
		if (!lfgConfig.voiceCategoryId) {
			return interaction.editReply({
				content: 'LFG voice category is not configured.',
				ephemeral: true,
			});
		}

        let voiceChannel;
        try {
			voiceChannel = await interaction.guild.channels.create({
				name: channelName,
				type: ChannelType.GuildVoice,
				parent: lfgConfig.voiceCategoryId,
				userLimit: gameConfig.maxPlayers,
				reason: `LFG post for ${gameConfig.name}`,
			});
		} catch (error) {
			console.error('Error creating voice channel:', error);
			return interaction.editReply({
				content: 'Failed to create voice channel. Please check bot permissions.',
				ephemeral: true,
			});
		}

        // calculating expiration time
        const expiresAt = new Date(Date.now() + duration * 60 * 1000);

        // creating LFG post in database
        const post = createLFGPost(
            interaction.guildId,
            interaction.user.id,
            game,
            gameType,
            playerCount,
            voiceChannel.id,
            expiresAt.toISOString(),
        );

        if (!post) {
            // cleaning up the voice channel if post creation fails
            await voiceChannel.delete('LFG post creation failed');
            return interaction.editReply({
                content: 'Error creating LFG post. Please try again.',
                ephemeral: true,
            });
        }

        // creating embed message
        const embed = new EmbedBuilder()
            .setColor('#6BCB77')
            .setTitle(`${interaction.user.username} is looking for players!`)
            .addFields(
                // row #1 - 3 columns
                { name: 'Game', value: `${getGameEmoji(game)} ${gameConfig.name}`, inline: true },
                { name: 'Game Type', value: gameType || 'Any', inline: true },
                { name: 'Party Size', value: `${playerCount}`, inline: true },

                // row #2 - 3 columns
                { name: 'Voice Channel', value: `${voiceChannel.toString()}`, inline: true },
                { name: 'Expires', value: `<t:${Math.floor(expiresAt.getTime() / 1000)}:R>`, inline: true },
                { name: 'Post ID', value: `\`${post.id}\``, inline: true },
            )
            .setFooter({ text: `Room #${roomCounter}` });

        // sending message to LFG channel
        let lfgMessage;
        try {
            const lfgChannel = interaction.guild.channels.cache.get(lfgConfig.channelId);
            if (!lfgChannel) {
                throw new Error('LFG channel not found');
            }

            lfgMessage = await lfgChannel.send({ embeds: [embed] });
            updatePostMessageId(post.id, lfgMessage.id);
        } catch (error) {
            console.error('Error posting to LFG channel:', error);
			// continue anyway, voice channel is created and post is in the db
		}

        // setting cooldown
        createCooldowns.set(userId, now);

        // sending confirmation
        await interaction.editReply({
            content: `LFG post created!\n\n
            **Game:** ${gameConfig.name}\n
            **Type:** ${gameType}\n
            **Players Needed:** ${playerCount}\n
            **Duration:** ${duration} minutes\n
            **Voice Channel:** ${voiceChannel.toString()}`,
            ephemeral: true,
        });
    } catch (error) {
        console.error('Error in LFG create:', error);
        await interaction.editReply({
            content: 'An error occurred while creating the LFG post.',
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

        // deleting the voice channel
        try {
            const voiceChannel = interaction.guild.channels.cache.get(post.voiceChannelId);
            if (voiceChannel) {
                await voiceChannel.delete('LFG post deleted');
            }
        } catch (error) {
            console.error('Error deleting voice channel:', error);
        }

        // deleting the LFG post from database
        const success = deleteLFGPost(postId);

        if (!success) {
			return interaction.reply({
				content: 'Error deleting LFG post. Please try again.',
				ephemeral: true,
			});
		}

        // delete message from LFG channel
        if (post.messageId) {
            try {
                const lfgChannel = interaction.guild.channels.cache.get(lfgConfig.channelId);
                if (lfgChannel) {
                    const message = await lfgChannel.messages.fetch(post.messageId);
                    if (message) {
                        await message.delete();
                    }
                }
            } catch (error) {
                console.error('Error deleting LFG message:', error);
            }
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