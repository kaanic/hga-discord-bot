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
            INSERT INTO users (guildId, userId, username, balance, level, experience)
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

// getting users in the guild based on given order criteria and limit
function getAllUsersInGuild(guildId, limit = 10, orderBy = 'level') {
    try {
        const validOrderByColumns = ['level', 'experience', 'balance'];
        const orderByColumn = validOrderByColumns.includes(orderBy) ? orderBy : 'balance';

        const stmt = db.prepare(`
            SELECT * FROM users WHERE guildId = ?
            ORDER BY ${orderByColumn} DESC
            LIMIT ?;    
        `);

        return stmt.all(guildId, limit);
    } catch (error) {
        console.error('Error fetching users:', error);
        return [];
    }
}

function deleteUser(guildId, userId) {
    try {
        const stmt = db.prepare(`
            DELETE FROM users WHERE guildId = ? AND userId = ?;
        `);
        stmt.run(guildId, userId);

        // console.log(`User deleted: ${userId}`)
        return true;
    } catch (error) {
        console.error('Error deleting the user:', error);
        return false;
    }
}

// adding experience to an user
function addExperience(guildId, userId, amount) {
	try {
		const user = getUser(guildId, userId);
		if (!user) return null;

		const newXP = user.experience + amount;

		const stmt = db.prepare(`
			UPDATE users SET experience = ?,
			updatedAt = CURRENT_TIMESTAMP
			WHERE guildId = ? AND userId = ?;	
		`);
		stmt.run(newXP, guildId, userId);

		return getUser(guildId, userId);
	} catch (error) {
		console.error('Error upon adding experience:', error);
		return null;
	}
}

// setting user level manually
function setLevel(guildId, userId, level) {
    try {
        const stmt = db.prepare(`
            UPDATE users SET level = ?,
            updatedAt = CURRENT_TIMESTAMP
            WHERE guildId = ? AND userId = ?;
        `);
        stmt.run(level, guildId, userId);

        return getUser(guildId, userId);
    } catch (error) {
        console.error('Error upon setting level:', error);
		return null;
    }
}

// changing user's balance and making a transaction log for it
function updateBalance(guildId, userId, amount, reason = 'Points earned') {
    try {
        const user = getUser(guildId, userId);
        if (!user) return null;

        const balanceBefore = user.balance;
        const balanceAfter = balanceBefore + amount;

        // checking if the transaction is possible
        if (balanceAfter < 0) {
            console.log(`Cannot withdraw ${Math.abs(amount)} points from ${user.username}. Insufficient balance.`);
            return null;
        }

        // updating the balance
        const updateStmt = db.prepare(`
            UPDATE users SET balance = ?, updatedAt = CURRENT_TIMESTAMP
            WHERE guildId = ? AND userId = ?;    
        `);
        updateStmt.run(balanceAfter, guildId, userId);

        // updating transaction log
        const logStmt = db.prepare(`
            INSERT INTO economyLog (guildId, userId, transactionType, amount, reason, balanceBefore, balanceAfter)
            VALUES (?, ?, ?, ?, ?, ?, ?);
        `);
        logStmt.run(guildId, userId, 'POINTS', amount, reason, balanceBefore, balanceAfter);

        return getUser(guildId, userId);
    } catch (error) {
        console.error('Error adding points:', error);
        return null;
    }
}

// getting an user's transaction history
function getTransactionHistory(guildId, userId, limit = 10) {
    try {
        const stmt = db.prepare(`
            SELECT * FROM economyLog
            WHERE guildId = ? AND userId = ?
            ORDER BY createdAt DESC
            LIMIT ?;    
        `);

        return stmt.all(guildId, userId, limit);
    } catch (error) {
        console.error('Error fetching transaction history:', error);
        return [];
    }
}

module.exports = {
    createUser,
    getUser,
    getOrCreateUser,
    getAllUsersInGuild,
    deleteUser,
    addExperience,
    setLevel,
    updateBalance,
    getTransactionHistory,
};