const db = require('./db');

// collection of helper functions related to animal and inventory system

// initializing the animal tables
function initializeAnimalTables() {
    // --- animals_catalogue ---
    // main list with each animal and their properties
    db.exec(`
        CREATE TABLE IF NOT EXISTS animals_catalogue (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL UNIQUE,
            emoji TEXT NOT NULL,
            rarity TEXT NOT NULL,
            createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
        );
    `);

    // --- user_animals ---
    // animal instances owned by each user
    db.exec(`
        CREATE TABLE IF NOT EXISTS user_animals (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            guildId TEXT NOT NULL,
            userId TEXT NOT NULL,
            animalName TEXT NOT NULL,
            rarity TEXT NOT NULL,
            quantity INTEGER DEFAULT 1,
            caughtAt DATETIME DAFULT CURRENT_TIMESTAMP,
            UNIQUE(guildId, userId, animalName),
            FOREIGN KEY (animalName) REFERENCES animal_catalogue(name) ON DELETE CASCADE
        );    
    `);

    // --- hunting_stats ---
    // tracking hunting activity and cooldowns
	db.exec(`
		CREATE TABLE IF NOT EXISTS hunting_stats (
			id INTEGER PRIMARY KEY AUTOINCREMENT,
			guildId TEXT NOT NULL,
			userId TEXT NOT NULL,
			lastHuntAt DATETIME,
			totalHunts INTEGER DEFAULT 0,
			totalAnimalsHunted INTEGER DEFAULT 0,
			createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
			updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
			UNIQUE(guildId, userId)
		);
	`);

    // indexing for faster query match
	db.exec(`
		CREATE INDEX IF NOT EXISTS idx_user_animals_guildId_userId ON user_animals(guildId, userId);
		CREATE INDEX IF NOT EXISTS idx_user_animals_rarity ON user_animals(rarity);
		CREATE INDEX IF NOT EXISTS idx_hunting_stats_guildId_userId ON hunting_stats(guildId, userId);
	`);

    console.log('Animal tables initialized successfully');
}

// initializing tables on first time
initializeAnimalTables();

module.exports = {
    initializeAnimalTables,
};