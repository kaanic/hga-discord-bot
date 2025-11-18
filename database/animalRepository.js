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

// --- ANIMAL CATALOGUE FUNCTIONS ---

// populating animals catalogue from config file
function populateAnimalsCatalogue() {
    const { animals } = require('../animals/animalData');

    // getting rarity keys directly
    const rarities = Object.keys(animals);

    for (const rarity in rarities) {
        for (const animal in animals[rarity]) {
            try {
                const stmt = db.prepare(`
                    INSERT OR IGNORE INTO animals_catalogue (name, emoji, rarity)
                    VALUES (?, ?, ?);
                `);

                stmt.run(animal.name, animal.emoji, rarity);
            } catch (error) {
                console.error(`Error inserting animal ${animal.name}`, error);
            }
        }
    }

    console.log('Animals catalogue is successfully populated.');
}

// getting all animals from catalogue
function getAllAnimals() {
    try {
        const stmt = db.prepare('SELECT * FROM animals_catalogue;');

        return stmt.all();
    } catch (error) {
        console.error('Error fetching all animals:', error);
        return [];
    }
}

// --- USER INVENTORY FUNCTIONS ---

// getting an user's entire inventory
function getUserInventory(guildId, userId) {
    try {
        const stmt = db.prepare(`
            SELECT * FROM users_animals
            WHERE guildId = ? AND userId = ?
            ORDER BY rarity DESC, animalName ASC;    
        `);

        return stmt.all(guildId, userId);
    } catch (error) {
        console.error('Error fetching user inventory:', error);
        return [];
    }
}

// getting a specific animal from user inventory
function getUserAnimal(guildId, userId, animalName) {
    try {
        const stmt = db.prepare(`
            SELECT * FROM user_animals
            WHERE guildId = ? AND userId = ? AND animalName = ?;    
        `);

        return stmt.get(guildId, userId, animalName);
    } catch (error) {
        console.error('Error fetching user animal;', error);
        return null;
    }
}

// adding an animal to user inventory
// animals will be able to stack, upon duplicates it will be updated instead
function addAnimalToInventory(guildId, userId, animalName, rarity, quantity = 1) {
    try {
        const existing = getUserAnimal(guildId, userId, animalName);

        if (existing) {
            // if user already has the animal, updating the value
            const stmt = db.prepare(`
                UPDATE user_animals
                SET quantity = quantity + ?,
                    caughtAt = CURRENT_TIMESTAMP
                WHERE guildId = ? AND userId = ? AND animalName = ?;    
            `);

            stmt.run(quantity, guildId, userId, animalName);
        } else {
            // inserting the animal instead
            const stmt = db.prepare(`
                INSERT INTO user_animals (guildId, userId, animalName, rarity, quantity)
                VALUES (?, ?, ?, ?, ?);    
            `);

            stmt.run(guildId, userId, animalName, rarity, quantity);
        }

        return getUserAnimal(guildId, userId, animalName);
    } catch (error) {
        console.error('Error adding animal to inventory:', error);
        return null;
    }
}

// initializing tables on first time
initializeAnimalTables();
populateAnimalsCatalogue();

module.exports = {
    initializeAnimalTables,

    // animal catalogue
    populateAnimalsCatalogue,
    getAllAnimals,

    // user animal table
    getUserInventory,
    getUserAnimal,
    addAnimalToInventory,

    // stats
};