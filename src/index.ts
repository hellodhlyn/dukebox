import { Client, VoiceConnection, VoiceChannel, StreamDispatcher, Message } from 'discord.js';
import ytdl, { MoreVideoDetails } from 'ytdl-core';

const client = new Client();
let connection: VoiceConnection = null;
let dispatcher: StreamDispatcher = null;

//
// Playlist
//
class PlaylistItem {
  title: string;
  link: string;

  constructor(title: string, link: string) {
    this.title = title;
    this.link = link;
  }
}

const playlist: PlaylistItem[] = [];

function appendToPlaylist(item: PlaylistItem) {
  playlist.push(item);
  if (!dispatcher) {
    play(0);
  }
}

function play(index: number) {
  const item = playlist[index % playlist.length];
  const stream = ytdl(item.link, { filter: 'audioonly' });
  dispatcher = connection.play(stream, { volume: 0.7 });
  dispatcher.on('close', () => {
    play(index + 1);
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
  const messageArgs = message.content.split(" ");
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

      appendToPlaylist(new PlaylistItem(info.title, videoUrl));
      await message.react('👌');
      break;

    // /dukebox list
    case 'list':
      await message.reply('```' + playlist.map((item, idx) => `[${idx < 10 ? '0' + idx : idx}] ${item.title}`).join('\n') + '```');
      break;

    // /dukebox remove [index]
    case 'remove':
      if (messageArgs.length !== 3) {
        await message.reply('/dukebox remove [index]');
        break;
      }

      const index = Number(messageArgs[2]);
      if (isNaN(index) || index >= playlist.length) {
        await message.reply('Out of index.');
        break;
      }

      playlist.splice(index, 1);
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
