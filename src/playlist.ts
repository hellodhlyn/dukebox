class PlaylistItem {
  title: string;
  link: string;

  constructor(title: string, link: string) {
    this.title = title;
    this.link = link;
  }
}

export default class Playlist {
  private items: PlaylistItem[] = [];

  pop(): PlaylistItem {
    const item = this.items[0];
    this.items = this.items.slice(1);
    return item;
  }

  push(title: string, link: string) {
    this.items.push(new PlaylistItem(title, link));
  }

  list(): PlaylistItem[] {
    return this.items;
  }

  shuffle() {
    for (let i = this.items.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [this.items[i], this.items[j]] = [this.items[j], this.items[i]];
    }
  }

  remove(index: number) {
    if (index < this.items.length) {
      this.items.splice(index, 1);
    }
  }
}
