import { AudioPlayer, createAudioPlayer } from "@discordjs/voice";

class State {
    public player: AudioPlayer = createAudioPlayer();
}

export const state = new State();