const { lfgChannelId, lfgVoiceCategoryId } = require('../config.json');

const lfgConfig = {
	// pulled from config.json
	channelId: lfgChannelId,
	voiceCategoryId: lfgVoiceCategoryId,

	// default duration for a LFG post (in mins)
	defaultDuration: 60,

	// cooldown for creating a LFG post per user (in mins)
	createCooldown: 5,

	// interval to check if empty voice channels should be deleted (in secs)
	emptyChannelCheckInterval: 300,

	// duration presets
	durationPresets: [
		{ label: '30 minutes', value: 30 },
		{ label: '1 hour', value: 60 },
		{ label: '2 hours', value: 120 },
		{ label: '4 hours', value: 240 },
		{ label: '8 hours', value: 480 },
	],
};

module.exports = lfgConfig;