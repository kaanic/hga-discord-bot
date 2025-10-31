// require the necessary discord.js classes
const { Client, Events, GatewayIntentBits } = require('discord.js');
const { token } = require('./config.json');

// creating a new client instance
// guild = discord server
const client = new Client({ intents: [GatewayIntentBits.Guilds] });

// when the client is ready, run this code (only once).
// it makes some properties non-nullable.
client.once(Events.ClientReady, (readyClient) => {
	console.log(`Ready! Logged in as ${readyClient.user.tag}`);
});

// log in to discord with your token
client.login(token);