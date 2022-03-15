using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using System.Xml;
using Discord;
using Discord.Interactions;
using Discord.WebSocket;
using TwizzleBot.Audio;
using TwizzleBot.Grabber;
using TwizzleBot.Grabber.Music;
using RunMode = Discord.Interactions.RunMode;

namespace TwizzleBot.Modules.Interactions.Slash.Music;

public class MusicSlashes : InteractionModuleBase<SocketInteractionContext<SocketInteraction>>
{
    private readonly AudioPlayer _player;
    private readonly SpotifyGrabber _spotify;
    private readonly AppleMusicGrabber _apple;

    public MusicSlashes(AudioPlayer player, SpotifyGrabber spotify, AppleMusicGrabber apple)
    {
        _player = player;
        _spotify = spotify;
        _apple = apple;
    }

    [SlashCommand("join", "Joins a voice channel", runMode: RunMode.Async)]
    public async Task Join(IVoiceChannel channel = null)
    {
        await DeferAsync();

        var audio = _player.Get(Context);

        await audio.Connect(Context, channel);
    }

    [SlashCommand("leave", "Leaves the voice channel", runMode: RunMode.Async)]
    public async Task Leave()
    {
        await DeferAsync();

        var audio = _player.Get(Context);
        await audio.Leave();
    }

    [SlashCommand("stop", "Stops the music", runMode: RunMode.Async)]
    public async Task Stop()
    {
        await DeferAsync();

        var audio = _player.Get(Context);
        await audio.Stop();
    }

    [SlashCommand("play", "Plays a song", runMode: RunMode.Async)]
    public async Task Play(string query)
    {
        await DeferAsync();

        var audio = _player.Get(Context);

        if (!audio.IsConnected())
            await audio.Connect(Context);

        // Rick roll :)
        var rickRoll = new Random().Next(2048) == 1;
        if (rickRoll)
        {
            var rick = await _spotify.Search("never gonna give you up rick astley");
            var roll = rick.First();
            await audio.Queue(roll);
        }

        var songs = await _spotify.Search(query);
        var song = songs.First();

        await audio.Queue(song);
    }
    
    [SlashCommand("playnow", "Plays a song now", runMode: RunMode.Async)]
    public async Task PlayNow(string query)
    {
        await DeferAsync();

        var audio = _player.Get(Context);

        if (!audio.IsConnected())
            await audio.Connect(Context);
        
        var songs = await _spotify.Search(query);
        var song = songs.First();

        await audio.Queue(song);
        await audio.Move(audio.QueueCount());
    }

    [SlashCommand("spotify", "Loads a playlist from Spotify", runMode: RunMode.Async)]
    public async Task Play([Summary(description: "A spotify playlist link")] Uri link)
    {
        await DeferAsync();

        var audio = _player.Get(Context);
        if (!audio.IsConnected())
            await audio.Connect(Context);

        var playlist = await _spotify.GetPlaylist(link);
        await audio.Queue(playlist);
    }
    
    [SlashCommand("youtube", "Plays music from YouTube", runMode: RunMode.Async)]
    public async Task PlayYouTube([Summary(description: "A spotify link")] string query)
    {
        await DeferAsync();

        var audio = _player.Get(Context);
        if (!audio.IsConnected())
            await audio.Connect(Context);

        await audio.QueueYouTube(query);
    }

    [SlashCommand("pause", "Pauses the audio", runMode: RunMode.Async)]
    public async Task Pause()
    {
        await DeferAsync();

        var audio = _player.Get(Context);

        if (!audio.IsConnected())
            await audio.Connect(Context);

        await audio.Pause();
    }

    [SlashCommand("resume", "Resumes the audio", runMode: RunMode.Async)]
    public async Task Resume()
    {
        await DeferAsync();

        var audio = _player.Get(Context);

        if (!audio.IsConnected())
            await audio.Connect(Context);

        await audio.Resume();
    }

    [SlashCommand("skip", "Skips to track", runMode: RunMode.Async)]
    public async Task Skip([Summary(description: "The track to skip to")] int track = 1)
    {
        await DeferAsync();

        var audio = _player.Get(Context);

        if (!audio.IsConnected())
            await audio.Connect(Context);

        await audio.Skip(track);
    }


    [SlashCommand("move", "Moves a track to the front", runMode: RunMode.Async)]
    public async Task Move([Summary(description: "The track to move")] int track)
    {
        await DeferAsync();

        var audio = _player.Get(Context);

        if (!audio.IsConnected())
            await audio.Connect(Context);

        await audio.Move(track);
    }

    [SlashCommand("shuffle", "Shuffles the queue", runMode: RunMode.Async)]
    public async Task Shuffle()
    {
        await DeferAsync();

        var audio = _player.Get(Context);

        if (!audio.IsConnected())
            await audio.Connect(Context);

        await audio.Shuffle();
    }

    [SlashCommand("clear", "Clears the queue", runMode: RunMode.Async)]
    public async Task Clear()
    {
        await DeferAsync();

        var audio = _player.Get(Context);

        if (!audio.IsConnected())
            await audio.Connect(Context);


        await audio.Clear();
    }
    
    [SlashCommand("remove", "Removes a song in the queue", runMode: RunMode.Async)]
    public async Task Remove(int song)
    {
        await DeferAsync();

        var audio = _player.Get(Context);

        if (!audio.IsConnected())
            await audio.Connect(Context);


        await audio.Clear(song);
    }
    
    [SlashCommand("apple", "Loads a playlist from Apple Music", runMode: RunMode.Async)]
    public async Task Apple(Uri link)
    {
        await DeferAsync();

        var audio = _player.Get(Context);
        if (!audio.IsConnected())
            await audio.Connect(Context);

        var playlist = await _apple.GetPlaylist(link);
        await audio.Queue(playlist);
    }
}