import { Client, Message, VoiceChannel, VoiceConnection } from 'discord.js';
import ytdl from 'ytdl-core';

const helpMessage = `\`\`\`
/d add [video-url]
/d addall [playlist-url]
/d list
/d remove [index]
/d leave
\`\`\``;

export class BotResponse {
  message?: string;
  reaction?: string;
}

export class Bot {
  private readonly token: string;
  private readonly channelId: string;

  private client = new Client();
  private connection: VoiceConnection;
  private _isPlaying = false;

  private onAddCallback: (url: string) => Promise<BotResponse>;
  private onAddAllCallback: (url: string) => Promise<BotResponse>;
  private onListCallback: () => Promise<BotResponse>;
  private onRemoveCallback: (index: number) => Promise<BotResponse>;

  constructor(token: string, channelId: string) {
    this.token = token;
    this.channelId = channelId;

    this.client.on('message', async (message: Message) => {
      const args = message.content.split(' ');
      if (!['/dukebox', '/d'].includes(args[0])) {
        return;
      }

      let res: BotResponse;
      switch (args[1]) {
        case 'add':
          res = (args.length === 3) ? await this.onAddCallback(args[2]) : { message: '/dukebox add [video-url]' };
          break;

        case 'addall':
          res = (args.length === 3) ? await this.onAddAllCallback(args[2]) : { message: '/dukebox addall [playlist-url]' };
          break;

        case 'list':
          res = await this.onListCallback();
          break;

        case 'remove':
          res = (args.length === 3) ? await this.onRemoveCallback(Number(args[2])) : { message: '/dukebox remove [index]' };
          break;

        case 'leave':
          await this.leave();
          res = { reaction: '👋' };
          break;

        case 'help':
        case '?':
          res = { message: helpMessage };
          break;

        default:
          res = { reaction: '❓' };
      }

      if (res?.message) {
        await message.reply(res.message);
      } else if (res?.reaction) {
        await message.react(res.reaction);
      }
    });
  }

  get isPlaying(): boolean {
    return this._isPlaying;
  }

  async connect() {
    await this.client.login(this.token);
  }

  async disconnect() {
    await this.client.destroy();
  }

  async join() {
    const channel = await this.client.channels.cache.get(this.channelId) as VoiceChannel;
    this.connection = await channel.join();
  }

  async leave() {
    this.connection.disconnect();
    this.connection = null;
  }

  async play(url: string, onFinish: () => void) {
    if (!this.connection) {
      await this.join();
    }

    this._isPlaying = true;
    const stream = ytdl(url, { filter: 'audioonly' });
    const dispatcher = this.connection.play(stream, { volume: 0.7 });
    dispatcher.on('close', () => {
      this._isPlaying = false;
      onFinish();
    });
  }

  onAdd(callback: (url: string) => Promise<BotResponse>) {
    this.onAddCallback = callback;
  }

  onAddAll(callback: (url: string) => Promise<BotResponse>) {
    this.onAddAllCallback = callback;
  }

  onList(callback: () => Promise<BotResponse>) {
    this.onListCallback = callback;
  }

  onRemove(callback: (index: number) => Promise<BotResponse>) {
    this.onRemoveCallback = callback;
  }
}
