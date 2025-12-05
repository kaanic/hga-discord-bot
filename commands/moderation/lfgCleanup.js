const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const { getAllGuildLFGPosts, deleteLFGPost } = require('../../database/repositories/lfgRepository');
const lfgConfig = require('../../config/lfgConfig');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('lfgcleanup')
        .setDescription('Clear all LFG rooms and posts (Mod only)')
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels)
        .setDMPermission(false),

    async execute(interaction) {
        try {
            await interaction.deferReply({ ephemeral: true });

            const guildId = interaction.guildId;

            // getting all the posts
            const allPosts = getAllGuildLFGPosts(guildId);

            if (allPosts.length === 0) {
                return interaction.editReply({
                    content: 'No LFG posts to clean up.',
                });
            }

            let deletedRooms = 0;
            let deletedMessages = 0;
            let deletedPosts = 0;
            const errors = [];

            // deleting the bots LFG embed messages from LFG channel first
            try {
                const lfgChannel = interaction.guild.channels.cache.get(lfgConfig.channelId);
                if (lfgChannel) {
                    const messages = await lfgChannel.messages.fetch({ limit: 100 });
                    for (const [, message] of messages) {
                        // only deleting messages sent by the bot with embeds
                        if (message.author.id === interaction.client.user.id && message.embeds.length > 0) {
                            try {
                                await message.delete();
                                deletedMessages++;
                            } catch (error) {
                                console.error('Error deleting message:', error);
                                errors.push('Failed to delete a bot message from LFG channel');
                            }
                        }
                    }
                }
            } catch (error) {
                console.error('Error fetching LFG channel messages:', error);
                errors.push('Failed to access LFG channel or fetch messages');
            }

            // iterating through each post (active and expired)
            for (const post of allPosts) {
                try {
                    // deleting voice channel
                    try {
                        const voiceChannel = interaction.guild.channels.cache.get(post.voiceChannelId);
                        if (voiceChannel) {
                            // kicking all members from the channel before deleting
                            const members = voiceChannel.members;
                            for (const [, member] of members) {
                                try {
                                    await member.voice.disconnect('LFG room cleanup by moderator');
                                } catch (error) {
                                    console.error(`Error disconnecting member ${member.user.tag}:`, error);
                                    errors.push(`Failed to disconnect ${member.user.tag} from voice channel`);
                                }
                            }

                            // deleting the channel
                            await voiceChannel.delete('LFG cleanup command executed');
                            deletedRooms++;
                        }
                    } catch (error) {
                        console.error('Error deleting voice channel:', error);
                        errors.push(`Failed to delete voice channel for post #${post.id}`);
                    }

                    // deleting post from database
                    const success = deleteLFGPost(post.id);
                    if (success) {
                        deletedPosts++;
                    } else {
                        errors.push(`Failed to delete post #${post.id} from database`);
                    }
                } catch (error) {
                    console.error(`Error cleaning up post #${post.id}:`, error);
                    errors.push(`Error processing post #${post.id}`);
                }
            }

            // building response message
            let responseMessage = '**LFG Cleanup Complete**\n';
            responseMessage += `Deleted ${deletedMessages} message(s) from LFG channel\n`;
            responseMessage += `Deleted ${deletedRooms} voice room(s)\n`;
            responseMessage += `Deleted ${deletedPosts} LFG post(s)\n`;

            if (errors.length > 0) {
                responseMessage += '\n **Errors encountered:**\n';
                errors.forEach(error => {
                    responseMessage += `- ${error}\n`;
                });
            }

            await interaction.editReply({
                content: responseMessage,
            });
        } catch (error) {
            console.error('Error in LFG cleanup:', error);
            await interaction.editReply({
                content: 'An error occurred while cleaning up LFG data.',
            });
        }
    },
};