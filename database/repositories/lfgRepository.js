const db = require('../db');

// a collection of helper functions for LFG system

// --- LFG POST FUNCTIONS ---

// creating a new LFG post
function createLFGPost(guildId, userId, game, gameType, playerCountNeeded, voiceChannelId, expiresAt, messageId = null) {
    try {
        const stmt = db.prepare(`
            INSERT INTO lfg_posts (guildId, userId, game, gameType, playerCountNeeded, voiceChannelId, messageId, expiresAt)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?);    
        `);

        stmt.run(guildId, userId, game, gameType, playerCountNeeded, voiceChannelId, messageId, expiresAt);

        // getting the created post from db
        const postStmt = db.prepare(`
            SELECT * FROM lfg_posts
            WHERE guildId = ? AND userId = ?
            ORDER BY createdAt DESC LIMIT 1;
        `);

        return postStmt.get(guildId, userId);
    } catch (error) {
        console.error('Error creating LFG post:', error);
        return null;
    }
}

// getting LFG post by id
function getLFGPost(postId) {
    try {
        const stmt = db.prepare('SELECT * FROM lfg_posts WHERE id = ?;');

        return stmt.get(postId);
    } catch (error) {
        console.error('Error getting the LFG post:', error);
        return null;
    }
}

// getting all the currently active LFG posts
function getActiveLFGPosts(guildId) {
    try {
        const stmt = db.prepare(`
            SELECT * FROM lfg_posts
            WHERE guildId = ? AND expiresAt > CURRENT_TIMESTAMP
            ORDER BY createdAt DESC;
        `);

        return stmt.all(guildId);
    } catch (error) {
        console.error('Error getting the active LFG posts:', error);
        return [];
    }
}

// getting all LFG posts (active and expired)
// required for purge
function getAllGuildLFGPosts(guildId) {
    try {
        const stmt = db.prepare(`
            SELECT * FROM lfg_posts
            WHERE guildId = ?
            ORDER BY createdAt DESC;
        `);

        return stmt.all(guildId);
    } catch (error) {
        console.error('Error getting all guild LFG posts:', error);
        return [];
    }
}

// getting an user's LFG posts
function getUserLFGPosts(guildId, userId) {
    try {
        const stmt = db.prepare(`
            SELECT * FROM lfg_posts
            WHERE guildId = ? AND userId = ?
            ORDER BY createdAt DESC;    
        `);

        return stmt.all(guildId, userId);
    } catch (error) {
        console.error('Error getting user LFG posts', error);
        return [];
    }
}

// deleting LFG post
function deleteLFGPost(postId) {
    try {
        const stmt = db.prepare(`
            DELETE FROM lfg_posts WHERE id = ?;    
        `);

        stmt.run(postId);
        return true;
    } catch (error) {
        console.error('Error deleting the LFG post:', error);
        return false;
    }
}

// cleaning up the expired LFG posts
function cleanupExpiredLFGPosts() {
    try {
        const stmt = db.prepare('SELECT * FROM lfg_posts WHERE expiresAt <= CURRENT_TIMESTAMP;');

        const expiredPosts = stmt.all();

        if (expiredPosts.length > 0) {
            console.log(`Found ${expiredPosts.length} expired LFG posts.`);
        }

        return expiredPosts;
    } catch (error) {
        console.error('Error cleaning up the expired posts:', error);
		return [];
    }
}

// updating the message ID for a post
function updatePostMessageId(postId, messageId) {
    try {
        const stmt = db.prepare(`
            UPDATE lfg_posts
            SET messageId = ?
            WHERE id = ?;
        `);

        stmt.run(messageId, postId);
        return getLFGPost(postId);
    } catch (error) {
        console.error('Error updating post message ID:', error);
        return null;
    }
}

module.exports = {
    // post functions
    createLFGPost,
    getLFGPost,
    getActiveLFGPosts,
    getUserLFGPosts,
    deleteLFGPost,
    cleanupExpiredLFGPosts,
    updatePostMessageId,
    getAllGuildLFGPosts,
};