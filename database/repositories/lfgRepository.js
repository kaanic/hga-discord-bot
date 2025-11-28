const db = require('../db');

// a collection of helper functions for LFG system

// --- LFG POST FUNCTIONS ---

// creating a new LFG post
function createLFGPost(guildId, userId, game, gameType, playerCountNeeded, expiresAt, description = null) {
    try {
        const stmt = db.prepare(`
            INSERT INTO lfg_posts (guildId, userId, game, gameType, playerCountNeeded, expiresAt, description)
            VALUES (?, ?, ?, ?, ?, ?, ?);    
        `);

        stmt.run(guildId, userId, game, gameType, playerCountNeeded, expiresAt, description);

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

        return stmt.run(postId);
    } catch (error) {
        console.error('Error deleting the LFG post:', error);
        return false;
    }
}

// cleaning up the expired LFG posts
function cleanupExpiredLFGPosts() {
    try {
        const stmt = db.prepare('DELETE FROM lfg_posts WHERE expiresAt <= CURRENT_TIMESTAMP;');

        const result = stmt.run();

        if (result.changes > 0) { console.log(`Cleaned up ${result.changes} expired LFG posts.`); }
        return result.changes;
    } catch (error) {
        console.error('Error cleaning up the expired posts:', error);
        return 0;
    }
}


// --- LFG MEMBER FUNCTIONS ---

// ## TODO ##

module.exports = {
    // post functions
    createLFGPost,
    getLFGPost,
    getActiveLFGPosts,
    getUserLFGPosts,
    deleteLFGPost,
    cleanupExpiredLFGPosts,

    // member functions
    //
};
