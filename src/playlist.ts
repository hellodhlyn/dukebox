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

  remove(index: number) {
    if (index < this.items.length) {
      this.items.splice(index, 1);
    }
  }
}
