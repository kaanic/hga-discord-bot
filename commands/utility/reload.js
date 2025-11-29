const { SlashCommandBuilder } = require('discord.js');

// reloads specified command on each call
// (implemented to avoid restarting bot everytime on slightest change)
module.exports = {
    data: new SlashCommandBuilder()
        .setName('reload')
        .setDescription('Reloads a command.')
        .addStringOption((option) => option.setName('command').setDescription('The command to reload').setRequired(true)),
    async execute(interaction) {
        // checking if the command to be reloaded exists
        const commandName = interaction.options.getString('command', true).toLowerCase();
        const command = interaction.client.commands.get(commandName);

        if (!command) { return interaction.reply(`There is no command with name \`${commandName}\`!`);}

        // --- finding and reloading the command file ---
        try {
            // searching through all command folders to find the command file
            const commandsPath = path.join(__dirname, '..');
            const commandFolders = fs.readdirSync(commandsPath);

            let commandFilePath = null;

            for (const folder of commandFolders) {
                const folderPath = path.join(commandsPath, folder);

                // skip if not a directory
                if (!fs.statSync(folderPath).isDirectory()) continue;

                const commandFiles = fs.readdirSync(folderPath).filter((file) => file.endsWith('.js'));

                for (const file of commandFiles) {
                    const filePath = path.join(folderPath, file);
                    const cmd = require(filePath);

                    if (cmd.data.name === commandName) {
                        commandFilePath = filePath;
                        break;
                    }
                }

                if (commandFilePath) break;
            }

            if (!commandFilePath) {
                return interaction.reply(`Could not find command file for \`${commandName}\`.`);
            }

            // deleting from the cache and reloading
            delete require.cache[require.resolve(commandFilePath)];
            const newCommand = require(commandFilePath);

            // updating the command in the collection
            interaction.client.commands.set(newCommand.data.name, newCommand);

            await interaction.reply(`Command \`${newCommand.data.name}\` was reloaded!`);
        } catch (error) {
            console.error(error);
            await interaction.reply(
                `There was an error while reloading the command:\n\`${error.message}\``,
            );
        }
    },
};