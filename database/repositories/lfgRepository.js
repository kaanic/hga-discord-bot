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

// adding an user to an LFG post
function addMemberToLFGPost(postId, guildId, userId, username) {
    try {
        // checking if the user has already joined
        const existing = db.prepare(`
            SELECT * FROM lfg_members WHERE postId = ? AND userId = ?;    
        `).get(postId, userId);

        if (existing) return { success: false, message: 'You already joined this LFG post.' };

        // adding the member
        const stmt = db.prepare(`
            INSERT INTO lfg_members (postId, guildId, userId, username)
            VALUES (?, ?, ?, ?);    
        `);

        stmt.run(postId, guildId, userId, username);

        // updating the currentPlayers count on lfg_posts
        const updateStmt = db.prepare(`
            UPDATE lfg_posts SET currentPlayers = currentPlayers + 1
            WHERE id = ?;    
        `);

        updateStmt.run(postId);

        return { success: true, message: 'Successfully joined the LFG post.' };
    } catch (error) {
        console.error('Error adding member to post:', error);
        return {
            success: false,
            message: 'Error joining the post.',
        };
    }
}

// removing an user from an LFG post
function removeMemberFromLFGPost(postId, userId) {
    try {
        // checking if the user is in the post
        const existing = db.prepare(`
            SELECT * FROM lfg_members WHERE postId = ? AND userId = ?;    
        `).get(postId, userId);

        if (!existing) return { success: false, message: 'You are not part of this LFG post.' };

        // removing the member
        const stmt = db.prepare(`
            DELETE FROM lfg_members WHERE postId = ? AND userId = ?;    
        `);

        stmt.run(postId, userId);

        // updating the currentPlayers count in lfg_posts
        const updateStmt = db.prepare(`
            UPDATE lfg_posts SET currentPlayers = currentPlayers - 1
            WHERE id = ?;
        `);

        updateStmt.run(postId);

        return { success: true, message: 'Successfully left the LFG post.' };
    } catch (error) {
        console.error('Error removing member from the post:', error);
        return {
            success: false,
            message: 'Error leaving the post.',
        };
    }
}

// getting all members from a LFG post
function getPostMembers(postId) {
    try {
        const stmt = db.prepare(`
            SELECT * FROM lfg_members
            WHERE postId = ?
            ORDER BY joinedAt ASC;
        `);

        return stmt.all(postId);
    } catch (error) {
        console.error('Error getting the post members:', error);
		return [];
    }
}

// checking if the user is member of the post
function isMemberOfPost(postId, userId) {
    try {
        const stmt = db.prepare(`
            SELECT * FROM lfg_members WHERE postId = ? AND userId = ?;
        `);

        return (stmt.get(postId, userId) !== null);
    } catch (error) {
        console.error('Error checking member status:', error);
		return false;
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

    // member functions
    addMemberToLFGPost,
    removeMemberFromLFGPost,
    getPostMembers,
    isMemberOfPost,
};
