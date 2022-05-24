import ytdl, { MoreVideoDetails } from 'ytdl-core';
import ytpl from 'ytpl';
import Playlist from './playlist';
import { Bot, BotResponse } from './bot';

const botToken = process.env.DISCORD_BOT_TOKEN;
const channelId = process.env.DISCORD_CHANNEL_ID;
const bot = new Bot(botToken, channelId);


//// Handle playlist
const playlist = new Playlist();

async function play() {
  const item = playlist.pop();
  if (!item) {
    return;
  }

  await bot.play(item.link, () => { play() });
}


//// Bot commands
bot.onAdd(async (url: string): Promise<BotResponse> => {
  let info: MoreVideoDetails;
  try {
    info = (await ytdl.getInfo(url)).videoDetails;
  } catch (e) {
    return { message: 'Failed to find the video.' };
  }

  playlist.push(info.title, url)
  if (!bot.isPlaying) {
    await play();
  }

  return { reaction : '👌' };
});

bot.onAddAll(async (playlistUrl: string): Promise<BotResponse> => {
  const videoList = await ytpl(playlistUrl);
  for (const video of videoList.items) {
    let info: MoreVideoDetails;
    try {
      info = (await ytdl.getInfo(video.url)).videoDetails;
    } catch (e) {
      // Ignored
    }

    playlist.push(info.title, video.url);
    if (!bot.isPlaying) {
      await play();
    }
  }

  return { reaction : '👌' };
});

bot.onList(async (): Promise<BotResponse> => {
  const items = playlist.list();
  const message = '```'
    + items.slice(0, 10).map((item, idx) => `[${idx < 10 ? '0' + idx : idx}] ${item.title}`).join('\n')
    + `${items.length > 10 ? `... and ${items.length - 10} more` : ''}`
    + '```';
  return { message };
});

bot.onShuffle(async (): Promise<BotResponse> => {
  playlist.shuffle();
  return { reaction: '👌' };
});

bot.onRemove(async (index: number): Promise<BotResponse> => {
  playlist.remove(index);
  return { reaction: '👌' };
});


['SIGINT', 'SIGTERM', 'SIGQUIT'].forEach((signal) => {
  process.on(signal, () => {
    bot.disconnect();
    process.exit();
  });
});

(async () => {
  await bot.connect();
})();
