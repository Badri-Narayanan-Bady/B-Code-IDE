import { Collaborator, ChatMessage } from '../types/ide';

export type CollabEvent =
  | { type: 'PEER_JOIN'; peer: Collaborator }
  | { type: 'PEER_LEAVE'; peerId: string }
  | { type: 'CURSOR_MOVE'; peerId: string; fileId: string; line: number; col: number }
  | { type: 'CHAT_MESSAGE'; message: ChatMessage }
  | { type: 'FILE_UPDATE'; fileId: string; content: string; author: string };

class BroadcastCollaboration {
  private channel: BroadcastChannel | null = null;
  private currentChannelName: string = '';
  private listeners: ((event: CollabEvent) => void)[] = [];
  public currentPeer: Collaborator;

  constructor() {
    const peerId = 'user-' + Math.random().toString(36).substring(2, 8);
    const colors = ['#38bdf8', '#34d399', '#f472b6', '#fbbf24', '#a78bfa', '#f97316'];
    const randomColor = colors[Math.floor(Math.random() * colors.length)];

    this.currentPeer = {
      id: peerId,
      name: 'Dev-' + peerId.substring(5),
      avatarColor: randomColor,
      status: 'online',
    };
  }

  public setChannel(channelId: string) {
    const targetChannel = `b_code_chan_${channelId}`;
    if (this.currentChannelName === targetChannel) return;

    if (this.channel) {
      try {
        this.channel.close();
      } catch (e) {
        console.warn('Error closing old channel:', e);
      }
      this.channel = null;
    }

    this.currentChannelName = targetChannel;

    if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
      try {
        this.channel = new BroadcastChannel(targetChannel);
        this.channel.onmessage = (e) => {
          if (e.data && e.data.peerId !== this.currentPeer.id) {
            this.notify(e.data);
          }
        };
        // Announce presence in newly joined room
        this.broadcast({
          type: 'PEER_JOIN',
          peer: this.currentPeer,
        });
      } catch (e) {
        console.warn('BroadcastChannel error:', e);
      }
    }
  }

  public setPeerName(name: string) {
    if (name.trim()) {
      this.currentPeer.name = name.trim();
      this.broadcast({
        type: 'PEER_JOIN',
        peer: this.currentPeer,
      });
    }
  }

  public subscribe(listener: (event: CollabEvent) => void): () => void {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  private notify(event: CollabEvent) {
    this.listeners.forEach(l => l(event));
  }

  public broadcast(event: CollabEvent) {
    if (this.channel) {
      try {
        this.channel.postMessage(event);
      } catch (e) {
        console.error('Failed to broadcast event:', e);
      }
    }
  }

  public sendCursor(fileId: string, line: number, col: number) {
    this.broadcast({
      type: 'CURSOR_MOVE',
      peerId: this.currentPeer.id,
      fileId,
      line,
      col,
    });
  }

  public sendChatMessage(text: string, codeSnippet?: ChatMessage['codeSnippet']) {
    const msg: ChatMessage = {
      id: 'msg-' + Date.now(),
      sender: this.currentPeer.name,
      senderColor: this.currentPeer.avatarColor,
      text,
      timestamp: Date.now(),
      codeSnippet,
    };
    this.broadcast({ type: 'CHAT_MESSAGE', message: msg });
    return msg;
  }
}

export const collabEngine = new BroadcastCollaboration();
