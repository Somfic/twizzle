using System;
using System.Linq;
using System.Threading.Tasks;
using Discord;
using Discord.Commands;
using Discord.Interactions;
using Discord.WebSocket;
using TwizzleBot.Audio;
using TwizzleBot.Grabber;
using Victoria.Enums;
using RunMode = Discord.Interactions.RunMode;

namespace TwizzleBot.Modules.Interactions.Buttons.Music;

public class MusicButtons : InteractionModuleBase<SocketInteractionContext<SocketInteraction>>
{
    private readonly AudioPlayer _player;
    private readonly SpotifyGrabber _spotify;

    public MusicButtons(AudioPlayer player, SpotifyGrabber spotify)
    {
        _player = player;
        _spotify = spotify;
    }

    [ComponentInteraction("play-pause")]
    public async Task PlayPause()
    {
        await DeferAsync();

        var audio = _player.Get(Context);

        if (audio.Player.PlayerState == PlayerState.Playing)
        {
            await audio.Pause();
        }
        else
        {
            await audio.Resume();
        }
    }
        
    [ComponentInteraction("skip")]
    public async Task Skip()
    {
        await DeferAsync();

        var audio = _player.Get(Context);
        await audio.Skip(1);
    }
        
    [ComponentInteraction("shuffle")]
    public async Task Shuffle()
    {
        await DeferAsync();

        var audio = _player.Get(Context);
        await audio.Shuffle();
    }
        
    [ComponentInteraction("page-next")]
    public async Task PageNext()
    {
        await DeferAsync();

        var audio = _player.Get(Context);
        await audio.NextPage();
    }
        
    [ComponentInteraction("page-previous")]
    public async Task PagePrevious()
    {
        await DeferAsync();

        var audio = _player.Get(Context);
        await audio.PreviousPage();
    }
}