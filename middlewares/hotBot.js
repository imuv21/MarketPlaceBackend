import { Client, GatewayIntentBits } from 'discord.js';
import { REST, Routes } from 'discord.js';

const client = new Client({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent] });

client.on('messageCreate', (message) => {
    if (message.author.bot) return;
    message.reply({
        content: `Hi ${message.author.username}, how are you?`
    });
});

//HotBot
client.login(process.env.BOT_TOKEN);

const commands = [
    {
        name: 'ping',
        discription: 'dgkdlg'
    },
];

const rest = new REST({ version: "10" }).setToken(process.env.BOT_TOKEN);

(async () => {
    try {
        console.log('Started refreshing application (/) commands.');
        await rest.put(Routes.applicationCommands(process.env.BOT_CLIENT_ID), { body: commands });
        console.log('Successfully reloaded application (/) commands.');
    } catch (error) {
        console.error(error);
    }
})();