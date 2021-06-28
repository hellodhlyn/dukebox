import {Client} from 'discord.js';

const client = new Client();

client.on('ready', () => {
  console.log("I'm ready!")
});

(async () => {
  const botToken = process.env.DISCORD_BOT_TOKEN;
  await client.login(botToken);
})();
