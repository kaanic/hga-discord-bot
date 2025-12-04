// game config for LFG system
// includes the available games, their gametypes and group capacity

const { GAME_EMOJIS } = require('../globals');

const gamesConfig = {
	overwatch: {
		name: 'Overwatch 2',
		emoji: '🎮',
		gameTypes: [
			'Quick Play',
			'Competitive',
			'Arcade',
			'Stadium',
			'Custom',
		],
		maxPlayers: 6,
		minPlayers: 1,
	},

	valorant: {
		name: 'Valorant',
		emoji: '🎯',
		gameTypes: [
			'Unrated',
			'Competitive',
			'Swift Play',
			'Escalation',
			'Spike Rush',
			'Deathmatch',
		],
		maxPlayers: 5,
		minPlayers: 1,
	},

	cs2: {
		name: 'Counter-Strike 2',
		emoji: '💣',
		gameTypes: [
			'Competitive',
			'Premier',
			'Casual',
			'Deathmatch',
			'Arms Race',
		],
		maxPlayers: 5,
		minPlayers: 1,
	},

	leagueoflegends: {
		name: 'League of Legends',
		emoji: '⚔️',
		gameTypes: [
			'Ranked Solo/Duo',
			'Ranked Flex',
			'Draft',
			'ARAM',
		],
		maxPlayers: 5,
		minPlayers: 1,
	},

	minecraft: {
		name: 'Minecraft',
		emoji: '⛏️',
		gameTypes: [],
		maxPlayers: 32,
		minPlayers: 1,
	},

	fortnite: {
		name: 'Fortnite',
		emoji: '🎪',
		gameTypes: [],
		maxPlayers: 4,
		minPlayers: 1,
	},

	apex: {
		name: 'Apex Legends',
		emoji: '🔫',
		gameTypes: [],
		maxPlayers: 3,
		minPlayers: 1,
	},

	dota2: {
		name: 'Dota 2',
		emoji: '🗡️',
		gameTypes: [],
		maxPlayers: 5,
		minPlayers: 1,
	},

	phasmophobia: {
		name: 'Phasmophobia',
		emoji: '👻',
		gameTypes: [],
		maxPlayers: 4,
		minPlayers: 1,
	},
};

// -- helper functions ---

// getting a game by the key
function getGame(gameKey) {
    return gamesConfig[gameKey.toLowerCase()];
}

// getting all the games
function getAllGames() {
	return Object.entries(gamesConfig).map(
		([key, game]) => ({
		key,
		...game,
	}));
}

// validating game and game type
function validateGameAndType(gameKey, gameType) {
	const game = getGame(gameKey);
	if (!game) return false;

	if (game.gameTypes.length === 0) return true;
	return game.gameTypes.includes(gameType);
}

// validating player count
function validatePlayerCount(gameKey, playerCount) {
	const game = getGame(gameKey);
	if (!game) return false;

	return (playerCount >= game.minPlayers) && (playerCount <= game.maxPlayers);
}

// getting formatted emoji string for a game
function getGameEmoji(gameKey) {
	const game = getGame(gameKey);
	const gameKeyLower = gameKey.toLowerCase();
	const emojiId = GAME_EMOJIS[gameKeyLower];

	if (!emojiId) {
		return game?.emoji || '🎮';
	}

	// returning formatted emoji mention: <:name:id>
	const emojiName = game.name.toLowerCase().replace(/\s+/g, '');
	return `<:${emojiName}:${emojiId}>`;
}

module.exports = {
    gamesConfig,
    getGame,
	getAllGames,
	validateGameAndType,
	validatePlayerCount,
	getGameEmoji,
};