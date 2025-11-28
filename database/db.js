// sqlite db for the bot
const Database = require('better-sqlite3');
const path = require('node:path');

const dbPath = path.join(__dirname, 'bot.db');
const db = new Database(dbPath);

// foreign keys are enabled on sqlite since economy table should be connected to user.
// ON DELETE CASCADE needs this option enabled in order to run.
db.pragma('foreign_keys = ON');

// initialing the tables for db
function initializeDatabase() {
	// users table
	db.exec(`
		CREATE TABLE IF NOT EXISTS users (
			id INTEGER PRIMARY KEY AUTOINCREMENT,
			guildId TEXT NOT NULL,
			userId TEXT NOT NULL,
			username TEXT NOT NULL,
			balance INTEGER DEFAULT 500,
			level INTEGER DEFAULT 1,
			experience INTEGER DEFAULT 0,
			joinedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
			updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
			lastDailyClaim DATETIME,
			UNIQUE(guildId, userId)
		);
	`);

	// economy table - for keeping the log of coin transaction
	db.exec(`
		CREATE TABLE IF NOT EXISTS economyLog (
			id INTEGER PRIMARY KEY AUTOINCREMENT,
			guildId TEXT NOT NULL,
			userId TEXT NOT NULL,
			transactionType TEXT NOT NULL,
			amount INTEGER NOT NULL,
			reason TEXT,
			balanceBefore INTEGER NOT NULL,
			balanceAfter INTEGER NOT NULL,
			createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
			FOREIGN KEY (guildId, userId) REFERENCES users(guildId, userId) ON DELETE CASCADE
		);
	`);

	// lfg_posts table - LFG posts created by users
	db.exec(`
		CREATE TABLE IF NOT EXISTS lfg_posts (
			id INTEGER PRIMARY KEY AUTOINCREMENT,
			guildId TEXT NOT NULL,
			userId TEXT NOT NULL,
			game TEXT NOT NULL,
			gameType TEXT,
			playerCountNeeded INTEGER NOT NULL,
			currentPlayers INTEGER DEFAULT 1,
			description TEXT,
			expiresAt DATETIME NOT NULL,
			createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
			updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
		);
	`);

	// lfg_members table - users who joined an LFG post
	db.exec(`
		CREATE TABLE IF NOT EXISTS lfg_members (
			id INTEGER PRIMARY KEY AUTOINCREMENT,
			postId INTEGER NOT NULL,
			guildId TEXT NOT NULL,
			userId TEXT NOT NULL,
			username TEXT NOT NULL,
			joinedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
			UNIQUE(postId, userId),
			FOREIGN KEY (postId) REFERENCES lfg_posts(id) ON DELETE CASCADE
		);
	`);

	// indexing for faster query match
	db.exec(`
		CREATE INDEX IF NOT EXISTS idx_users_guildId_userId ON users(guildId, userId);
		CREATE INDEX IF NOT EXISTS idx_economyLog_guildId_userId ON economyLog(guildId, userId);
		CREATE INDEX IF NOT EXISTS idx_economyLog_createdAt ON economyLog(createdAt);
		CREATE INDEX IF NOT EXISTS idx_lfg_posts_guildId ON lfg_posts(guildId);
		CREATE INDEX IF NOT EXISTS idx_lfg_posts_userId ON lfg_posts(userId);
		CREATE INDEX IF NOT EXISTS idx_lfg_posts_expiresAt ON lfg_posts(expiresAt);
		CREATE INDEX IF NOT EXISTS idx_lfg_members_postId ON lfg_members(postId);
		CREATE INDEX IF NOT EXISTS idx_lfg_members_userId ON lfg_members(userId);
	`);

	console.log('Database initialized successfully');
}

// initializing the db
initializeDatabase();

module.exports = db;