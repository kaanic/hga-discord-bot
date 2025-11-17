// animal data for animal hunting minigame
// data is created by AI, might be altered later on

const animals = {
	// COMMON TIER
	common: [
		{ name: 'Rat', emoji: '🐀' },
		{ name: 'Pigeon', emoji: '🕊️' },
		{ name: 'Squirrel', emoji: '🐿️' },
		{ name: 'Duck', emoji: '🦆' },
		{ name: 'Rabbit', emoji: '🐰' },
		{ name: 'Chicken', emoji: '🐔' },
		{ name: 'Frog', emoji: '🐸' },
		{ name: 'Fish', emoji: '🐟' },
	],

	// UNCOMMON TIER
	uncommon: [
		{ name: 'Fox', emoji: '🦊' },
		{ name: 'Deer', emoji: '🦌' },
		{ name: 'Owl', emoji: '🦉' },
		{ name: 'Wolf', emoji: '🐺' },
		{ name: 'Cat', emoji: '🐱' },
		{ name: 'Dog', emoji: '🐕' },
		{ name: 'Bear', emoji: '🐻' },
		{ name: 'Monkey', emoji: '🐵' },
	],

	// RARE TIER
	rare: [
		{ name: 'Tiger', emoji: '🐯' },
		{ name: 'Lion', emoji: '🦁' },
		{ name: 'Panda', emoji: '🐼' },
		{ name: 'Koala', emoji: '🐨' },
		{ name: 'Penguin', emoji: '🐧' },
		{ name: 'Eagle', emoji: '🦅' },
		{ name: 'Shark', emoji: '🦈' },
		{ name: 'Whale', emoji: '🐋' },
	],

	// EPIC TIER
	epic: [
		{ name: 'Dragon', emoji: '🐉' },
		{ name: 'Rhinoceros', emoji: '🦏' },
		{ name: 'Hippopotamus', emoji: '🦛' },
		{ name: 'Giraffe', emoji: '🦒' },
		{ name: 'Scorpion', emoji: '🦂' },
		{ name: 'Octopus', emoji: '🐙' },
	],

	// LEGENDARY TIER
	legendary: [
		{ name: 'Gorilla', emoji: '🦍' },
		{ name: 'Zebra', emoji: '🦓' },
		{ name: 'Bison', emoji: '🐃' },
		{ name: 'Moose', emoji: '🫎' },
	],

	// MYTHICAL TIER
	mythical: [
		{ name: 'Elephant', emoji: '🐘' },
		{ name: 'Camel', emoji: '🐪' },
		{ name: 'Llama', emoji: '🦙' },
	],

	// DISTORTED TIER (Ultra Rare)
	distorted: [
		{ name: 'Cheetah', emoji: '🐆' },
		{ name: 'Leopard', emoji: '🐅' },
	],

	// HIDDEN TIER (Rarest)
	hidden: [
		{ name: 'Flamingo', emoji: '🦩' },
	],
};

// rarity config with drop rates and values
const rarityConfig = {
	common: {
		dropRate: 80,
		zooPoints: 1,
		xp: 1,
		sellValue: 1,
	},
	uncommon: {
		dropRate: 15,
        zooPoints: 5,
		xp: 10,
		sellValue: 3,
	},
	rare: {
		dropRate: 3.5,
		zooPoints: 20,
		xp: 20,
		sellValue: 20,
	},
	epic: {
		dropRate: 0.8,
		zooPoints: 250,
		xp: 400,
		sellValue: 250,
	},
	legendary: {
		dropRate: 0.15,
		zooPoints: 10000,
		xp: 2000,
		sellValue: 15000,
	},
	mythical: {
		dropRate: 0.04,
		zooPoints: 3000,
		xp: 1000,
		sellValue: 5000,
	},
	distorted: {
		dropRate: 0.01,
		zooPoints: 200000,
		xp: 100000,
		sellValue: 300000,
	},
	hidden: {
		dropRate: 0.002,
		zooPoints: 500000,
		xp: 300000,
		sellValue: 1000000,
	},
};

module.exports = { animals, rarityConfig };