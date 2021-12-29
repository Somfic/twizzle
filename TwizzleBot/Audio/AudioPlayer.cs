using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using Discord;
using Discord.Interactions;
using Discord.WebSocket;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;
using Victoria;
using Victoria.Enums;
using Victoria.EventArgs;

namespace TwizzleBot.Audio;

public class AudioPlayer
{
    private readonly ILogger<AudioPlayer> _log;
    private readonly DiscordSocketClient _client;
    private readonly IServiceProvider _services;

    private readonly IDictionary<ulong, GuildAudioPlayer> _audioClients = new Dictionary<ulong, GuildAudioPlayer>();
    private readonly IDictionary<ulong, PlayerState> _playerStates = new Dictionary<ulong, PlayerState>();

        
    public AudioPlayer(ILogger<AudioPlayer> log, DiscordSocketClient client, IServiceProvider services, LavaNode lavaNode)
    {
        _log = log;
        _client = client;
        _services = services;
            
        lavaNode.OnTrackEnded += OnTrackEnded;
        lavaNode.OnPlayerUpdated += OnPlayerUpdated;
        lavaNode.OnTrackStuck += OnTrackStuck;
        lavaNode.OnTrackStarted += OnTrackStarted;
        lavaNode.OnTrackException += OnTrackException;
    }
        
    private Task OnTrackException(TrackExceptionEventArgs arg)
    {
        var audio = Get(arg.Player.VoiceChannel.Guild);
        if (audio == null) return Task.CompletedTask;
            
        _log.LogDebug("Track exception in guild {Guild} ({GuildId}): {Exception}",arg.Player.VoiceChannel.Guild.Name, arg.Player.VoiceChannel.Guild.Id, arg.Exception.Message);
        audio.OnTrackException(arg);
            
        return Task.CompletedTask;
    }

    private Task OnTrackStarted(TrackStartEventArgs arg)
    {
        var audio = Get(arg.Player.VoiceChannel.Guild);
        if (audio == null) return Task.CompletedTask;
            
        _log.LogDebug("Track started in guild {Guild} ({GuildId}): {Title}",arg.Player.VoiceChannel.Guild.Name, arg.Player.VoiceChannel.Guild.Id, arg.Track.Title);
        audio.OnTrackStarted(arg);
            
        return Task.CompletedTask;
    }

    private Task OnTrackStuck(TrackStuckEventArgs arg)
    {
        var audio = Get(arg.Player.VoiceChannel.Guild);
        if (audio == null) return Task.CompletedTask;
            
        _log.LogDebug("Track got stuck in guild {Guild} ({GuildId}): {Title}",arg.Player.VoiceChannel.Guild.Name, arg.Player.VoiceChannel.Guild.Id, arg.Track.Title);
        audio?.OnTrackStuck(arg);
            
        return Task.CompletedTask;
    }

    private Task OnPlayerUpdated(PlayerUpdateEventArgs arg)
    {
        var audio = Get(arg.Player.VoiceChannel.Guild);
        if (audio == null) return Task.CompletedTask;

        if (!_playerStates.ContainsKey(arg.Player.VoiceChannel.Guild.Id))
        {
            _playerStates.Add(arg.Player.VoiceChannel.Guild.Id, PlayerState.None);
        }

        if (arg.Player.PlayerState != _playerStates[arg.Player.VoiceChannel.Guild.Id])
        {
            _playerStates[arg.Player.VoiceChannel.Guild.Id] = arg.Player.PlayerState;
            _log.LogDebug("Player updated in guild {Guild} ({GuildId}): {State}",arg.Player.VoiceChannel.Guild.Name, arg.Player.VoiceChannel.Guild.Id, arg.Player.PlayerState);
            audio.OnPlayerUpdated(arg);   
        }

        return Task.CompletedTask;
    }

    private async Task OnTrackEnded(TrackEndedEventArgs arg)
    {
        var audio = Get(arg.Player.VoiceChannel.Guild);
        if (audio == null) return;

        _log.LogDebug("Track ended in guild {Guild} ({GuildId}): {Track} ({Reason})",arg.Player.VoiceChannel.Guild.Name, arg.Player.VoiceChannel.Guild.Id, arg.Track.Title, arg.Reason);
        await audio.OnTrackEnded(arg);
    }

    private GuildAudioPlayer Get(IGuild guild)
    {
        return _audioClients.ContainsKey(guild.Id) ? _audioClients[guild.Id] : null;
    }

    public GuildAudioPlayer Get(SocketInteractionContext<SocketInteraction> context)
    {
        if (_audioClients.ContainsKey(context.Guild.Id))
        {
            _audioClients[context.Guild.Id].Context = context;
            return _audioClients[context.Guild.Id];
        }

        _log.LogDebug("Creating new audio client for guild {GuildName} ({GuildId})", context.Guild.Name, context.Guild.Id);
        var audio = ActivatorUtilities.CreateInstance<GuildAudioPlayer>(_services);
        audio.Context = context;
        _audioClients.Add(context.Guild.Id, audio);
        return audio;
    }
}