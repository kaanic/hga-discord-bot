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

	// indexing for faster query match
	db.exec(`
		CREATE INDEX IF NOT EXISTS idx_users_guildId_userId ON users(guildId, userId);
		CREATE INDEX IF NOT EXISTS idx_economyLog_guildId_userId ON economyLog(guildId, userId);
		CREATE INDEX IF NOT EXISTS idx_economyLog_createdAt ON economyLog(createdAt);
	`);

	console.log('Database initialized successfully');
}

// initializing the db
initializeDatabase();

module.exports = db;