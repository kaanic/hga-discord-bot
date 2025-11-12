const db = require('./db');

// collection of helper functions for the user db

// getting user from db
function getUser(guildId, userId) {
    try {
        const stmt = db.prepare(`
            SELECT * FROM users WHERE guildId = ? AND userId = ?;   
        `);

        return stmt.get(guildId, userId);

    } catch (error) {
        console.error('Error fetching user:', error);
        return null;
    }
}

// creating a new user in users table with 500 currency - the value is subject to change
function createUser(guildId, userId, username) {
    try {
        const stmt = db.prepare(`
            INSERT INTO users (guildId, userId, username, currency, level, experience)
            VALUES (?, ?, ?, 500, 1, 0);
        `);

        stmt.run(guildId, userId, username);
        // console.log(`User created: ${username} (${userId} in server ${guildId})`);

        return getUser(guildId, userId);

    } catch (error) {
        console.error('Error creating the user: error', error);
        return null;
    }
}

// merging getUser and createUser functions
function getOrCreateUser(guildId, userId, username) {
    let user = getUser(guildId, userId);

    if (!user) {
        user = createUser(guildId, userId, username);
    }

    return user;
}

module.exports = {
    createUser,
    getUser,
    getOrCreateUser,
};