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
            caughtAt DATETIME DEFAULT CURRENT_TIMESTAMP,
            UNIQUE(guildId, userId, animalName),
            FOREIGN KEY (animalName) REFERENCES animals_catalogue(name) ON DELETE CASCADE
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

    for (const rarity of rarities) {
        for (const animal of animals[rarity]) {
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

// getting the animals from catalogue based on the rarity
function getAnimalsByRarity(rarity) {
    try {
        const stmt = db.prepare('SELECT * FROM animals_catalogue WHERE rarity = ?;');

        return stmt.all(rarity);
    } catch (error) {
        console.error(`Error fetching ${rarity} animals`, error);
        return [];
    }
}

// --- USER INVENTORY FUNCTIONS ---

// getting an user's entire inventory
function getUserInventory(guildId, userId) {
    try {
        const stmt = db.prepare(`
            SELECT * FROM user_animals
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

// removing an animal from an user inventory
function removeAnimalFromInventory(guildId, userId, animalName, quantity = 1) {
    try {
        const existing = getUserAnimal(guildId, userId, animalName);
        if (!existing) return null;

        if (existing.quantity <= quantity) {
            // if quantity becomes 0 or less than 0
            const stmt = db.prepare(`
                DELETE FROM user_animals
                WHERE guildId = ? AND userId = ? and animalName = ?;    
            `);

            stmt.run(guildId, userId, animalName);
        } else {
            // just decreasing quantity
            const stmt = db.prepare(`
                UPDATE user_animals
                SET quantity = quantity - ?
                WHERE guildId = ? AND userId = ? and animalName = ?;
            `);

            stmt.run(quantity, guildId, userId, animalName);
        }

        return true;
    } catch (error) {
        console.error('Error removing animal from user inventory:', error);
        return false;
    }
}

// rarity summarization of an user inventory
function getInventorySummary(guildId, userId) {
	try {
		const stmt = db.prepare(`
			SELECT rarity, COUNT(*) as uniqueCount, SUM(quantity) as totalQuantity
			FROM user_animals 
			WHERE guildId = ? AND userId = ?
			GROUP BY rarity
			ORDER BY CASE 
				WHEN rarity = 'common' THEN 1
				WHEN rarity = 'uncommon' THEN 2
				WHEN rarity = 'rare' THEN 3
				WHEN rarity = 'epic' THEN 4
				WHEN rarity = 'legendary' THEN 5
				WHEN rarity = 'mythical' THEN 6
				WHEN rarity = 'distorted' THEN 7
				WHEN rarity = 'hidden' THEN 8
				ELSE 9
			END;
		`);
		return stmt.all(guildId, userId);
	} catch (error) {
		console.error('Error fetching inventory summary:', error);
		return [];
	}
}

// --- HUNTING STATS FUNCTIONS ---

// getting/creating hunting stats per user
function getOrCreateHuntingStats(guildId, userId) {
    try {
        let stats = db.prepare(`
            SELECT * FROM hunting_stats
            WHERE guildId = ? AND userId = ?;    
        `).get(guildId, userId);

        if (!stats) {
            const stmt = db.prepare(`
                INSERT INTO hunting_stats (guildId, userId, totalHunts, totalAnimalsHunted)
                VALUES (?, ?, 0, 0);    
            `);

            stmt.run(guildId, userId);

            stats = db.prepare(`
                SELECT * FROM hunting_stats
                WHERE guildId = ? AND userId = ?;    
            `).get(guildId, userId);
        }

        return stats;
    } catch (error) {
        console.error('Error getting hunting stats:', error);
        return null;
    }
}

// updating hunting stats
function updateHuntingStats(guildId, userId, animalsHuntedCount) {
    try {
        const stmt = db.prepare(`
            UPDATE hunting_stats
            SET lastHuntAt = CURRENT_TIMESTAMP,
                totalHunts = totalHunts + 1,
                totalAnimalsHunted = totalAnimalsHunted + ?,
                updatedAt = CURRENT_TIMESTAMP
            WHERE guildId = ? AND userId = ?;    
        `);

        stmt.run(animalsHuntedCount, guildId, userId);
        return getOrCreateHuntingStats(guildId, userId);
    } catch (error) {
        console.error('Error updating hunting stats:', error);
		return null;
    }
}

// checking if the user is on cooldown
function isHuntingOnCooldown(guildId, userId, cooldownSeconds = 15) {
	try {
		const stats = getOrCreateHuntingStats(guildId, userId);

		if (!stats.lastHuntAt) {
			// first hunt
            return false;
		}

		const lastHuntTime = new Date(stats.lastHuntAt).getTime();
		const currentTime = Date.now();
		const timeDiffSeconds = (currentTime - lastHuntTime) / 1000;

		return timeDiffSeconds < cooldownSeconds;
	} catch (error) {
		console.error('Error checking cooldown:', error);
		return true;
	}
}

// getting remaining cooldown in seconds
function getRemainingCooldown(guildId, userId, cooldownSeconds = 15) {
	try {
		const stats = getOrCreateHuntingStats(guildId, userId);

		if (!stats.lastHuntAt) {
			return 0;
		}

		const lastHuntTime = new Date(stats.lastHuntAt).getTime();
		const currentTime = Date.now();
		const timeDiffSeconds = (currentTime - lastHuntTime) / 1000;
		const remaining = Math.ceil(cooldownSeconds - timeDiffSeconds);

		return Math.max(0, remaining);
	} catch (error) {
		console.error('Error calculating remaining cooldown:', error);
		return 0;
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
    getAnimalsByRarity,

    // user animal table
    getUserInventory,
    getUserAnimal,
    addAnimalToInventory,
    removeAnimalFromInventory,
    getInventorySummary,

    // stats
    getOrCreateHuntingStats,
    updateHuntingStats,
    isHuntingOnCooldown,
    getRemainingCooldown,
};