using System;
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
using Victoria;
using Victoria.Enums;
using Victoria.EventArgs;
using Victoria.Filters;

namespace TwizzleBot.Audio
{
    public class GuildAudioPlayer
    {
        private readonly ILogger<GuildAudioPlayer> _log;
        private readonly IConfiguration _config;
        private readonly YouTubeGrabber _youtube;
        private readonly HttpClient _client;
        private readonly LavaNode _lavaNode;
        private readonly SpotifyGrabber _spotify;

        public IVoiceChannel AudioChannel { get; private set; }
        public ITextChannel TextChannel { get; private set; }

        public LavaPlayer Player { get; internal set; }
        public AudioOutStream Stream { get; private set; }
        public SocketInteractionContext<SocketInteraction> Context { get; internal set; }

        private IUserMessage _message;

        private IDictionary<string, FullTrack> _tracks = new Dictionary<string, FullTrack>();

        private FullPlaylist _activeLoadingPlaylist;
        private int _activeLoadedTracks;
        private DateTime _lastLoadUpdate = DateTime.MinValue;
        private DateTime _startedLoadingAt;
        
        private int _queueItemsPerPage = 12;

        private int _queuePage;

        public GuildAudioPlayer(ILogger<GuildAudioPlayer> log, IConfiguration config, DiscordSocketClient client, YouTubeGrabber youtube,
            IHttpClientFactory clientFactory, LavaNode lavaNode, SpotifyGrabber spotify)
        {
            _log = log;
            _config = config;
            _youtube = youtube;
            _lavaNode = lavaNode;
            _spotify = spotify;
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

                tracks.AddRange(playlist.Tracks.Items.Where(x => x.Track.Type == ItemType.Track).Select(x => (FullTrack) x.Track));
                
                while (offset < playlist.Tracks.Total - 100)
                {
                    offset += 100;
                   var nextTracks = await _spotify.GetPlaylist(playlist, offset);
                   tracks.AddRange(nextTracks.Items.Where(x => x.Track.Type == ItemType.Track).Select(x => (FullTrack) x.Track));
                }

                await Queue(tracks.ToArray());
            }

            _activeLoadingPlaylist = null;

            await UpdateUi();
        }

        public async Task Queue(params FullTrack[] tracks)
        {
            var isFirst = true;
            
            foreach (var track in tracks)
            {
                var youtubeTracks = await _youtube.Search($"{track.Name} {track.Artists[0].Name} official");
                var youtubeTrack = youtubeTracks.First();

                if (!_tracks.ContainsKey(youtubeTrack.Id))
                    _tracks.Add(youtubeTrack.Id, track);
                
                _activeLoadedTracks++;
                
                if(_lastLoadUpdate < DateTime.Now.AddSeconds(-2.5))
                {
                    await UpdateUi();
                    _lastLoadUpdate = DateTime.Now;
                }

                Player.Queue.Enqueue(youtubeTrack);

                if (isFirst && Player.PlayerState != PlayerState.Playing)
                {
                    _log.LogInformation("Starting to play");
                    await OnTrackEnded(new TrackEndedEventArgs());
                }

                isFirst = false;
            }

            _log.LogInformation("Added all tracks to queue");

            await UpdateUi();
        }

        public async Task Play(LavaTrack track)
        {
            await Player.PlayAsync(track);
            
            await Player.ApplyFilterAsync(new LowPassFilter()
            {
                Smoothing = 1
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
                _log.LogInformation("Moving {Track} to front of queue" , amount);
                
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
                var track = _tracks[youtubeTrack.Id];
                _log.LogInformation("Playing next track {Track} by {Artist}", track.Name, track.Artists[0].Name);
                await Play(youtubeTrack);
            }
            else
            {
                _log.LogInformation("Queue is empty, stopping");
            }
        }

        public void OnPlayerUpdated(PlayerUpdateEventArgs playerUpdateEventArgs)
        {
        }

        public void OnTrackStuck(TrackStuckEventArgs trackStuckEventArgs)
        {
        }

        public async Task OnTrackStarted(TrackStartEventArgs trackStartEventArgs)
        {
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
            catch(Exception ex)
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
                    .WithDescription($"Loaded {_activeLoadedTracks} / {_activeLoadingPlaylist.Tracks?.Total} tracks")
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
                var current = _tracks[Player.Track.Id];
                var artist = await _spotify.GetArtist(current);

                playing
                    .WithTitle(current.Name)
                    .WithUrl(current.ExternalUrls.First().Value)
                    .WithImageUrl(current.Album.Images[0].Url)
                    .WithFooter($"{string.Join("  ·  " , current.Artists.Select(x => x.Name))}  ·  {Player.Track.Duration:mm\\:ss}", artist.Images[0].Url)
                    .WithColor(Color.DarkGreen)
                    .Build();
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
                    var track = _tracks[youtubeTrack.Id];

                    queue.AddField($"{i}. {track.Name}", track.Artists[0].Name, true);

                    i++;
                }

                var totalDuration = new TimeSpan(Player.Queue.Sum(r => r.Duration.Ticks));

                var page = "";
                if (Player.Queue.Count > _queueItemsPerPage)
                {
                    page = $"{_queuePage + 1} / {Math.Ceiling(Player.Queue.Count / (double) _queueItemsPerPage)}  ·  ";
                }
                
                queue.WithFooter($"{Player.Queue.Count} tracks  ·  {page}{totalDuration:hh\\:mm\\:ss}");
            }

            var embeds = new List<Embed>();
            
            if(playing != null)
                embeds.Add(playing.Build());
            
            if(queue != null)
                embeds.Add(queue.Build());

            return embeds.ToArray();
        }
    }
}