import { Client, VoiceConnection, VoiceChannel, StreamDispatcher, Message } from 'discord.js';
import ytdl, { MoreVideoDetails } from 'ytdl-core';
import Playlist from './playlist';

const client = new Client();
let connection: VoiceConnection = null;
let dispatcher: StreamDispatcher = null;

const playlistClass = new Playlist();

function play() {
  const item = playlistClass.pop();
  const stream = ytdl(item.link, { filter: 'audioonly' });
  dispatcher = connection.play(stream, { volume: 0.7 });
  dispatcher.on('close', () => {
    play();
  });
}


//
// Client Events
//
client.on('ready', async () => {
  const channelId = process.env.DISCORD_CHANNEL_ID;
  const channel = await client.channels.cache.get(channelId) as VoiceChannel;
  connection = await channel.join();
});

client.on('message', async (message: Message) => {
  const messageArgs = message.content.split(' ');
  if (messageArgs[0] !== '/dukebox') {
    return;
  }

  switch (messageArgs[1]) {
    // /dukebox play [url]
    case 'play':
      if (messageArgs.length !== 3) {
        await message.reply('/dukebox play [url]');
        break;
      }

      const videoUrl = messageArgs[2];
      let info: MoreVideoDetails;
      try {
        info = (await ytdl.getInfo(videoUrl)).videoDetails;
      } catch (e) {
        await message.reply('Invalid url.');
        break;
      }

      playlistClass.push(info.title, videoUrl);
      await message.react('👌');

      if (!dispatcher) {
        play();
      }
      break;

    // /dukebox list
    case 'list':
      const items = playlistClass.list();
      await message.reply('```' + items.map((item, idx) => `[${idx < 10 ? '0' + idx : idx}] ${item.title}`).join('\n') + '```');
      break;

    // /dukebox remove [index]
    case 'remove':
      if (messageArgs.length !== 3) {
        await message.reply('/dukebox remove [index]');
        break;
      }

      playlistClass.remove(Number(messageArgs[2]));
      await message.react('👌');
      break;

    default:
      await message.reply(`No such command: ${messageArgs[1]}`);
      return;
  }
});


['SIGINT', 'SIGTERM', 'SIGQUIT'].forEach((signal) => {
  process.on(signal, () => {
    client.destroy();
    process.exit();
  });
});

(async () => {
  const botToken = process.env.DISCORD_BOT_TOKEN;
  await client.login(botToken);
})();
