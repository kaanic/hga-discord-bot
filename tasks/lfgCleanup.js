const { cleanupExpiredLFGPosts, deleteLFGPost } = require('../database/repositories/lfgRepository');
const lfgConfig = require('../config/lfgConfig');

// tracking the posts that have expired and are waiting for empty channels
const expiredPostsAwaitingCleanup = new Map();

/**
 * initializes the LFG cleanup task
 * @param {Client} client - discord client instance
 */
function initializeLFGCleanup(client) {
	// checking for expired posts every 30 seconds
	setInterval(() => {
		checkAndCleanupExpiredPosts(client);
	}, lfgConfig.emptyChannelCheckInterval * 1000);

	console.log('LFG cleanup task initialized');
}

/**
 * checks for the expired LFG posts and their voice channel status
 * @param {Client} client - discord client instance
 */
async function checkAndCleanupExpiredPosts(client) {
	try {
		// getting all expired posts from database
		const expiredPosts = cleanupExpiredLFGPosts();

		for (const post of expiredPosts) {
			// marking for cleanup
			if (!expiredPostsAwaitingCleanup.has(post.id)) {
				expiredPostsAwaitingCleanup.set(post.id, {
					postId: post.id,
					voiceChannelId: post.voiceChannelId,
					guildId: post.guildId,
					markedAt: Date.now(),
				});
			}
		}

		// checking emptiness of voice channels for posts marked for cleanup
		const postIds = Array.from(expiredPostsAwaitingCleanup.keys());

		for (const postId of postIds) {
			const cleanupData = expiredPostsAwaitingCleanup.get(postId);
			const guild = client.guilds.cache.get(cleanupData.guildId);

			if (!guild) {
				expiredPostsAwaitingCleanup.delete(postId);
				continue;
			}

			try {
				const voiceChannel = guild.channels.cache.get(cleanupData.voiceChannelId);

				if (!voiceChannel) {
					// channel already deleted, clean up from db
					deleteLFGPost(postId);
					expiredPostsAwaitingCleanup.delete(postId);
					console.log(`LFG post ${postId} cleaned up (channel not found)`);
					continue;
				}

				// checking if the channel is empty
				if (voiceChannel.members.size === 0) {
					// delete voice channel
					await voiceChannel.delete('LFG post expired and channel empty');

					// deleting from db
					deleteLFGPost(postId);
					expiredPostsAwaitingCleanup.delete(postId);

					console.log(`LFG post ${postId} cleaned up (empty channel deleted)`);
				}
			} catch (error) {
				console.error(`Error cleaning up LFG post ${postId}:`, error);
				// removing from tracking on error
				expiredPostsAwaitingCleanup.delete(postId);
			}
		}
	} catch (error) {
		console.error('Error in LFG cleanup task:', error);
	}
}

module.exports = {
	initializeLFGCleanup,
	checkAndCleanupExpiredPosts,
};