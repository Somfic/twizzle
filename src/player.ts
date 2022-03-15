import { 
    AudioPlayer, 
    createAudioPlayer, 
    createAudioResource, 
    AudioResource, 
    StreamType, 
    AudioPlayerStatus
} from "@discordjs/voice";
import ytdl from "ytdl-core";
import { Queue } from "./queue";

export class Player {
    public queue: Queue = new Queue();
    private player: AudioPlayer = createAudioPlayer();

    constructor() {
        this.player.on(AudioPlayerStatus.Idle, () => {
            this.queue.removeCurrent();
            this.playNext(); 

        });
    }

    public addToQueue(url: string) {
        this.queue.add(url);
    }

    public playNext() {
        this.player.pause();
        const url = this.queue.getNextSong();
        const resource: AudioResource<null> = this.getResource(url);
        this.player.play(resource);
    }

    private getResource(url: string): AudioResource<null> {
        return createAudioResource(ytdl(url), {
            inputType: StreamType.Arbitrary,
        });
    }

    public getInternalPlayer(): AudioPlayer {
        return this.player;
    }

    public getQueueSize(): number {
        return this.queue.getQueueSize();
    }
}