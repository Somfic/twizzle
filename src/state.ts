import { AudioPlayer, createAudioPlayer } from "@discordjs/voice";

class State {
    public isEnabled: boolean = true;
}

export const state = new State();