using System;
using System.Collections.Generic;
using System.Text.RegularExpressions;
using System.Threading.Tasks;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using SpotifyAPI.Web;

namespace TwizzleBot.Grabber.Music;

public class SpotifyGrabber
{
    private readonly ILogger<SpotifyGrabber> _log;
    private readonly IConfiguration _config;
    private SpotifyClient _spotify;

    public SpotifyGrabber(ILogger<SpotifyGrabber> log, IConfiguration config)
    {
        _log = log;
        _config = config;
        _spotify = new SpotifyClient(config["Spotify:Token"]);
    }

    public async Task Authenticate()
    {
        _log.LogInformation("Authenticating with Spotify");
        
        var config = SpotifyClientConfig.CreateDefault();
            
        var authRequest = new ClientCredentialsRequest(_config["Spotify:Identifier"], _config["Spotify:Token"]);
        var response = await new OAuthClient(config).RequestToken(authRequest);

        _spotify = new SpotifyClient(config.WithToken(response.AccessToken));
    }

    public async Task<IReadOnlyCollection<FullTrack>> Search(string query)
    {
        try
        {
            _log.LogDebug("Querying Spotify for query '{Query}'", query);

            var result = await _spotify.Search.Item(new SearchRequest(SearchRequest.Types.Track, query));

            if (result.Tracks.Total == 0)
            {
                throw new Exception($"Could not find any Spotify matches for query '{query}'.");
            }

            _log.LogTrace("Found {Count} Spotify matches for query '{Query}'", result.Tracks.Total, query);

            return result.Tracks.Items;
        }
        catch (APIUnauthorizedException ex)
        {
            await Authenticate();
            return await Search(query);
        }
    }

    public async Task<Paging<PlaylistTrack<IPlayableItem>>> GetPlaylist(FullPlaylist playlist, int offset)
    {
        try
        {
            return await _spotify.Playlists.GetItems(playlist.Id, new PlaylistGetItemsRequest {Offset = offset});
        }
        catch (APIUnauthorizedException ex)
        {
            await Authenticate();
            return await GetPlaylist(playlist, offset);
        }
    }
        
    public async Task<FullPlaylist> GetPlaylist(Uri playlistUri)
    {
        try
        {
            var match = Regex.Match(playlistUri.ToString(), @"/playlist/([^?]+)");

            if (!match.Success) {
                throw new Exception($"Invalid Spotify playlist URI '{playlistUri}'.");
            }
            
            var playlistId = match.Groups[1].Value;
            return await _spotify.Playlists.Get(playlistId);   
        }
        catch (APIUnauthorizedException ex)
        {
            await Authenticate();
            return await GetPlaylist(playlistUri);
        }
    }

    public async Task<FullArtist> GetArtist(FullTrack track)
    {
        try
        {
            return await _spotify.Artists.Get(track.Artists[0].Id);
        }
        catch (APIUnauthorizedException ex)
        {
            await Authenticate();
            return await GetArtist(track);
        }
    }

    public async Task<TrackAudioAnalysis> GetAnalysis(FullTrack current)
    {
        try
        {
            return await _spotify.Tracks.GetAudioAnalysis(current.Id);
        } catch (APIUnauthorizedException ex)
        {
            await Authenticate();
            return await GetAnalysis(current);
        }
    }

    public async Task<TrackAudioFeatures> GetFeatures(FullTrack current)
    {
        try
        {
            return await _spotify.Tracks.GetAudioFeatures(current.Id);
        }catch (APIUnauthorizedException ex)
        {
            await Authenticate();
            return await GetFeatures(current);
        }
    }

    public async Task<PublicUser> GetUser(PublicUser owner)
    {
        try
        {
            return await _spotify.UserProfile.Get(owner.Id);
        }catch (APIUnauthorizedException ex)
        {
            await Authenticate();
            return await GetUser(owner);
        }
    }
}