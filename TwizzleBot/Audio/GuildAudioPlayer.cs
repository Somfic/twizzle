using System;
using System.Collections.Concurrent;
using System.Collections.Generic;
using System.Linq;
using System.Net.Http;
using System.Threading.Tasks;
using Discord;
using Discord.Audio;
using Discord.Interactions;
using Discord.WebSocket;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using SpotifyAPI.Web;
using TwizzleBot.Grabber;
using TwizzleBot.Grabber.Lyrics;
using TwizzleBot.Grabber.Music;
using Victoria;
using Victoria.Enums;
using Victoria.EventArgs;
using Victoria.Filters;

namespace TwizzleBot.Audio;

public class GuildAudioPlayer
{
    private readonly ILogger<GuildAudioPlayer> _log;
    private readonly IConfiguration _config;
    private readonly YouTubeGrabber _youtube;
    private readonly HttpClient _client;
    private readonly LavaNode _lavaNode;
    private readonly SpotifyGrabber _spotify;
    private readonly GeniusGrabber _genius;

    public IVoiceChannel AudioChannel { get; private set; }
    public ITextChannel TextChannel { get; private set; }

    public LavaPlayer Player { get; internal set; }
    public AudioOutStream Stream { get; private set; }
    public SocketInteractionContext<SocketInteraction> Context { get; internal set; }

    private IUserMessage _message;

    private IDictionary<string, FullTrack> _tracks = new ConcurrentDictionary<string, FullTrack>();

    private FullPlaylist _activeLoadingPlaylist;
    private int _activeLoadedTracks;
    private DateTime _lastLoadUpdate = DateTime.MinValue;
    private DateTime _startedLoadingAt;

    private int _queueItemsPerPage = 12;

    private int _queuePage;
    private string? _lyricsText;

    public GuildAudioPlayer(ILogger<GuildAudioPlayer> log, IConfiguration config, DiscordSocketClient client,
        YouTubeGrabber youtube,
        IHttpClientFactory clientFactory, LavaNode lavaNode, SpotifyGrabber spotify, GeniusGrabber genius)
    {
        _log = log;
        _config = config;
        _youtube = youtube;
        _lavaNode = lavaNode;
        _spotify = spotify;
        _genius = genius;
        _client = clientFactory.CreateClient();

        _queueItemsPerPage = _config.GetValue<int>("Discord:ItemsPerPage");
    }

    public async Task<IUserMessage> GetMessage(IUserMessage message)
    {
        if (_message == null)
        {
            _message = message;
            return message;
        }

        await _message.ModifyAsync(x =>
        {
            //todo: add support for other message content
            x.Content = message.Content;
        });

        await message.DeleteAsync();

        return _message;
    }

    public bool IsConnected()
    {
        return _lavaNode.HasPlayer(Context.Guild);
    }

    public async Task Leave()
    {
        await _lavaNode.LeaveAsync(AudioChannel);
        await UpdateUi();
    }

    public async Task Connect(SocketInteractionContext<SocketInteraction> context, IVoiceChannel channel = null)
    {
        if (channel != null)
        {
            TextChannel = context.Channel as ITextChannel;
            AudioChannel = channel;
        }
        else if (context.User is IGuildUser {VoiceChannel: { }} user)
        {
            TextChannel = context.Channel as ITextChannel;
            AudioChannel = user.VoiceChannel;
            Player = await _lavaNode.JoinAsync(AudioChannel);
        }
        else
        {
            throw new Exception("User is not in a voice channel");
        }

        await UpdateUi();
    }

    public async Task Queue(FullPlaylist playlist)
    {
        _log.LogInformation("Enqueueing playlist {Track} by {Owner}", playlist.Name,
            playlist.Owner?.DisplayName ?? "Private owner");

        _activeLoadingPlaylist = playlist;
        _activeLoadedTracks = 0;
        _startedLoadingAt = DateTime.Now;

        await UpdateUi();

        if (playlist.Tracks?.Items != null)
        {
            var offset = 0;

            var tracks = new List<FullTrack>();

            tracks.AddRange(playlist.Tracks.Items.Where(x => x.Track.Type == ItemType.Track)
                .Select(x => (FullTrack) x.Track));

            while (offset < playlist.Tracks.Total - 100)
            {
                offset += 100;
                var nextTracks = await _spotify.GetPlaylist(playlist, offset);
                tracks.AddRange(nextTracks.Items.Where(x => x.Track.Type == ItemType.Track)
                    .Select(x => (FullTrack) x.Track));
            }

            await Queue(tracks.ToArray());
        }

        _activeLoadingPlaylist = null;

        await UpdateUi();
    }

    public async Task Queue(IEnumerable<FullTrack> tracks)
    {
        var tasks = tracks.Select(x => Queue(x, false)).ToArray();

        await Task.WhenAny(tasks);

        if (Player.PlayerState != PlayerState.Playing)
        {
            _log.LogInformation("Starting to play");
            await OnTrackEnded(new TrackEndedEventArgs());
        }

        await Task.Run(async () =>
        {
            while (tasks.Any(x => !x.IsCompleted))
            {
                if (_lastLoadUpdate < DateTime.Now.AddSeconds(-1))
                {
                    _log.LogInformation("Updating queue");
                    await UpdateUi();
                    _lastLoadUpdate = DateTime.Now;
                }
            }
        });

        await Task.WhenAll(tasks);

        _log.LogInformation("Added all tracks to queue");

        await UpdateUi();
    }

    public async Task Queue(FullTrack track, bool autoPlay = true)
    {
        try
        {
            var youtubeTracks = await _youtube.Search($"{track.Name} {track.Artists[0].Name} official");
            var youtubeTrack = youtubeTracks.First();

            if (!_tracks.ContainsKey(youtubeTrack.Id))
                _tracks.Add(youtubeTrack.Id, track);

            _activeLoadedTracks++;

            Player.Queue.Enqueue(youtubeTrack);

            if (autoPlay)
            {
                if (Player.PlayerState != PlayerState.Playing)
                {
                    _log.LogInformation("Starting to play");
                    await OnTrackEnded(new TrackEndedEventArgs());
                }

                await UpdateUi();
            }
        }
        catch (Exception ex)
        {
            _log.LogWarning(ex, "Could not queue {Track} by {Artist}", track.Name, track.Artists[0].Name);
        }
    }
    
    public async Task Queue(LavaTrack track, bool autoPlay = true)
    {
        try
        { 
            _activeLoadedTracks++;

            Player.Queue.Enqueue(track);

            if (autoPlay)
            {
                if (Player.PlayerState != PlayerState.Playing)
                {
                    _log.LogInformation("Starting to play");
                    await OnTrackEnded(new TrackEndedEventArgs());
                }

                await UpdateUi();
            }
        }
        catch (Exception ex)
        {
            _log.LogWarning(ex, "Could not queue {Track} by {Artist}", track.Title, track.Author);
        }
    }

    public async Task Play(LavaTrack track)
    {
        await Player.PlayAsync(track);

        await Player.ApplyFilterAsync(new LowPassFilter()
        {
            Smoothing = 1
        });

        await Player.ApplyFilterAsync(new KarokeFilter()
        {
            Level = 1,
            MonoLevel = 1,
            FilterBand = 220,
            FilterWidth = 100,
        });

        await UpdateUi();
    }

    public async Task Resume()
    {
        await Player.ResumeAsync();
        await UpdateUi();
    }

    public async Task Pause()
    {
        await Player.PauseAsync();
        await UpdateUi();
    }

    public async Task Stop()
    {
        Player.Queue.Clear();
        await Player.StopAsync();
        await UpdateUi();
    }

    public async Task Move(int amount)
    {
        if (amount > Player.Queue.Count)
        {
            await Player.StopAsync();
        }
        else
        {
            _log.LogInformation("Moving {Track} to front of queue", amount);

            var newTrack = Player.Queue.RemoveAt(amount - 1);
            var oldQueue = Player.Queue.ToArray();

            Player.Queue.Clear();
            Player.Queue.Enqueue(newTrack);
            Player.Queue.Enqueue(oldQueue);

            _log.LogDebug("Done moving");
        }

        await UpdateUi();
    }

    public async Task Skip(int amount)
    {
        if (Player.Queue.Count == 0)
        {
            await Player.StopAsync();
        }
        else
        {
            for (var i = 0; i < amount - 1; i++)
            {
                Player.Queue.RemoveAt(0);
            }

            await Player.SkipAsync();
        }

        await UpdateUi();
    }

    public async Task Clear()
    {
        Player.Queue.Clear();
        await UpdateUi();
    }
    
    public async Task Clear(int song)
    {
        Player.Queue.RemoveAt(song - 1);
        await UpdateUi();
    }

    public async Task Shuffle()
    {
        Player.Queue.Shuffle();
        await UpdateUi();
    }

    public async Task OnTrackEnded(TrackEndedEventArgs trackEndedEventArgs)
    {
        if (trackEndedEventArgs.Reason == TrackEndReason.Replaced)
            return;

        if (Player.Queue.TryDequeue(out var youtubeTrack))
        {
            _log.LogInformation("Playing next track {Track} by {Artist}", youtubeTrack.Title, youtubeTrack.Author);
            await Play(youtubeTrack);
        }
        else
        {
            _log.LogInformation("Queue is empty, stopping");
        }

        await UpdateUi();
    }

    public void OnPlayerUpdated(PlayerUpdateEventArgs playerUpdateEventArgs)
    {
    }

    public void OnTrackStuck(TrackStuckEventArgs trackStuckEventArgs)
    {
    }

    public async Task OnTrackStarted(TrackStartEventArgs trackStartEventArgs)
    {
        if (_tracks.ContainsKey(Player.Track.Id))
        {
            _lyricsText = "*Loading lyrics ...*";
            _lyricsText = await _genius.FindLyrics(await _genius.FindUrl(_tracks[Player.Track.Id]));
            _lyricsText = _lyricsText?.Replace("[", "\n**[").Replace("]", "]**").Replace("(", "*(").Replace(")", ")*");
        }
        else
        {
            _lyricsText = "idk lyrics van youtube liedjes";
        }

        await UpdateUi();  
    }

    public void OnTrackException(TrackExceptionEventArgs trackExceptionEventArgs)
    {
    }

    public async Task NextPage()
    {
        var maxPage = (int) Math.Ceiling((double) Player.Queue.Count / _queueItemsPerPage) + 2;

        _log.LogInformation("Max page is {MaxPage}", maxPage);

        _queuePage = Math.Min(_queuePage + 1, maxPage);

        await UpdateUi();
    }

    public async Task PreviousPage()
    {
        _queuePage = Math.Max(_queuePage - 1, 0);

        await UpdateUi();
    }

    private async Task UpdateUi()
    {
        var lastMessages = await TextChannel.GetMessagesAsync(1).FirstAsync();
        var lastMessage = lastMessages.First();

        Embed[] embeds;
        MessageComponent buttons;

        try
        {
            embeds = await BuildEmbeds();
            buttons = await BuildButtons();
        }
        catch (Exception ex)
        {
            _log.LogInformation(ex, "Failed to build UI");

            if (_message != null)
            {
                await _message.DeleteAsync();
            }

            var message = await Context.Interaction.FollowupAsync("Failed to build UI");
            await message.DeleteAsync();
            return;
        }

        if (_message == null)
        {
            // Delete all messages made by the bot in the channel
            var messages = await TextChannel.GetMessagesAsync().FlattenAsync();
            messages.Where(x => x.Author.Id == Context.Client.CurrentUser.Id).Skip(1).ToList().ForEach(x => x.DeleteAsync());
            
            // Send a new one
            _message = await Context.Interaction.FollowupAsync(null, embeds, false, false, null, buttons);
            return;
        }
        
        if (_message.Id != lastMessage.Id)
        {
            try
            {
                var message = await TextChannel.GetMessageAsync(_message.Id);
                // Delete the old message
                await _message.DeleteAsync();
            }
            catch
            {
                // ignored
            }
            finally
            {
                // Send a new one
                var messages = await TextChannel.GetMessagesAsync().FlattenAsync();
                messages.Where(x => x.Author.Id == Context.Client.CurrentUser.Id).Skip(1).ToList().ForEach(x => x.DeleteAsync());
                
                // Delete all messages made by the bot in the channel
                _message = await Context.Interaction.FollowupAsync(null, embeds, false, false, null, buttons);
            }
        }
        else
        {
            await _message.ModifyAsync(x => { x.Embeds = embeds; x.Components = buttons; x.Content = null; });
        }
    }

    private async Task<MessageComponent> BuildButtons()
    {
        if (Player == null)
        {
            return new ComponentBuilder().Build();
        }

        var isPlaying = Player.PlayerState == PlayerState.Playing;
        var hasMultipleNextTracks = Player.Queue?.Count > 1;
        var hasNextQueuePage = Player.Queue?.Count > (_queuePage + 1) * _queueItemsPerPage;
        var hasPreviousQueuePage = _queuePage > 0;

        var builder = new ComponentBuilder()
            .WithButton(isPlaying ? "❚❚" : "▶", "play-pause", ButtonStyle.Success, null, null, Player?.Track == null)
            .WithButton("↦", "skip", ButtonStyle.Primary, null, null, Player?.Track == null)
            .WithButton("⤮", "shuffle", ButtonStyle.Primary, null, null, !hasMultipleNextTracks)
            .WithButton("⬅", "page-previous", ButtonStyle.Secondary, null, null, !hasPreviousQueuePage)
            .WithButton("➡", "page-next", ButtonStyle.Secondary, null, null, !hasNextQueuePage);

        return builder.Build();
    }

    private async Task<Embed[]> BuildEmbeds()
    {
        var playing = new EmbedBuilder().WithAuthor("Currently playing");
        var queue = new EmbedBuilder().WithAuthor("Queue");

        if (_activeLoadingPlaylist != null)
        {
            var user = await _spotify.GetUser(_activeLoadingPlaylist.Owner);

            // calculate the estimated time left based on _startedLoadingAt
            var percentage = ((double) _activeLoadedTracks / _activeLoadingPlaylist?.Tracks?.Total).Value;
            var elapsed = DateTime.Now - _startedLoadingAt;

            var total = TimeSpan.FromSeconds(Math.Min(1.0 / percentage * elapsed.TotalSeconds, 10000000));
            var remaining = total - elapsed;

            playing.WithAuthor($"Loading playlist  ·  {Math.Round(percentage * 100f)}%")
                .WithTitle(_activeLoadingPlaylist.Name)
                .WithUrl(_activeLoadingPlaylist?.ExternalUrls?.Values.First())
                .WithDescription($"{_activeLoadingPlaylist.Description}\n\nLoaded {_activeLoadedTracks} / {_activeLoadingPlaylist.Tracks?.Total} tracks")
                .WithImageUrl(_activeLoadingPlaylist.Images?.First().Url)
                .WithFooter($"{user.DisplayName}  ·  Done in {remaining:mm\\:ss}", user.Images.First().Url)
                .WithColor(Color.DarkerGrey);
        }
        else if (Player?.Track == null)
        {
            playing
                .WithAuthor("")
                .WithTitle("Nothing is playing")
                .WithDescription("Use `/play` to start playing music!");
        }
        else
        {
            if (_tracks.ContainsKey(Player.Track.Id))
            {
                // Spoitfy track
                
                var current = _tracks[Player.Track.Id];
                var artist = await _spotify.GetArtist(current);

                var image = current.Album.Images.Count > 0
                    ? current.Album.Images.First().Url
                    : "https://jonhassell.com/wp-content/uploads/2020/09/Apple-Gray.png";

                playing
                    .WithTitle(current.Name)
                    .WithUrl(current.ExternalUrls.First().Value)
                    .WithImageUrl(image)
                    .WithFooter($"{string.Join("  ·  ", current.Artists.Select(x => x.Name))}  ·  {Player.Track.Duration:mm\\:ss}",
                        artist.Images[0].Url)
                    .WithDescription(_lyricsText)
                    .WithColor(Color.DarkGreen)
                    .Build();
            }
            else
            {
                var current = Player.Track;
                
                playing
                    .WithTitle(current.Title)
                    .WithUrl(current.Url)
                    .WithImageUrl("https://i.imgur.com/in3EJ34.png")
                    .WithFooter($"{current.Author}  ·  {Player.Track.Duration:mm\\:ss}")
                    .WithDescription(_lyricsText)
                    .WithColor(Color.DarkGreen)
                    .Build();
            }
        }

        if (Player?.Queue == null || Player?.Queue?.Count == 0)
        {
            queue = null;
        }
        else
        {
            var maxPage = (int) Math.Ceiling((double) Player.Queue.Count / _queueItemsPerPage) - 1;
            _queuePage = Math.Min(_queuePage, maxPage);

            int i = _queuePage * _queueItemsPerPage + 1;
            foreach (var youtubeTrack in Player.Queue.Skip(_queuePage * _queueItemsPerPage).Take(_queueItemsPerPage))
            {
                if (_tracks.ContainsKey(youtubeTrack.Id))
                {
                    var track = _tracks[youtubeTrack.Id];
                    queue.AddField($"{i}. {track.Name}", track.Artists.First().Name, true);
                }
                else
                {
                    queue.AddField($"{i}. {youtubeTrack.Title}", youtubeTrack.Author, true);
                }
                
                i++;
            }

            var totalDuration = new TimeSpan(Player.Queue.Sum(r => r.Duration.Ticks));

            var page = "";
            if (Player.Queue.Count > _queueItemsPerPage)
            {
                page = $"{_queuePage + 1} / {Math.Ceiling(Player.Queue.Count / (double) _queueItemsPerPage)}  ·  ";
            }

            queue.WithFooter(
                $"{Player.Queue.Count} tracks  ·  {page}{Math.Floor(totalDuration.TotalHours)}:{totalDuration.Minutes:00}:{totalDuration.Seconds:00}");
        }

        var embeds = new List<Embed>();

        if (playing != null)
            embeds.Add(playing.Build());

        if (queue != null)
            embeds.Add(queue.Build());

        return embeds.ToArray();
    }

    public int QueueCount()
    {
        return Player.Queue.Count;
    }

    public async Task QueueYouTube(string query)
    {
        var tracks = await _youtube.Search(query);
        await Queue(tracks.First());
    }
}