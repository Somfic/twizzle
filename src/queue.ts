import { MessageEmbed } from "discord.js";
import ytdl from "ytdl-core";

export class Queue {
    private queue: string[] = [];

    public add(url: string): boolean {
        if (ytdl.validateURL(url) == false) {
            return false;
        }

        this.queue.push(url);
        return true;
    }

    public getNextSong(): string {
        return this.queue[0] ?? "https://www.youtube.com/watch?v=dQw4w9WgXcQ";
    }

    public clear() {
        this.queue = [];
    }

    public removeCurrent() {
        this.queue.shift();
    }
    
    public bringForward(index: number): void {
        this.queue.splice(0, 0, this.queue.splice(index, 1)[0]);
    }

    public buildEmbed() : MessageEmbed {
        const embed = new MessageEmbed();
        embed.setTitle("Queue");
        embed.setDescription(this.queue.join("\n"));
        return embed;
    }

    public getQueueSize(): number {
        return this.queue.length;
    }
}