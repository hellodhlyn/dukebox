import ytdl, { MoreVideoDetails } from 'ytdl-core';
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

bot.onList(async (): Promise<BotResponse> => {
  const items = playlist.list();
  const message = '```' + items.map((item, idx) => `[${idx < 10 ? '0' + idx : idx}] ${item.title}`).join('\n') + '```';
  return { message };
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
