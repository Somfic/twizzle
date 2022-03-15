using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Net.Http;
using System.Text.RegularExpressions;
using System.Threading.Tasks;
using System.Xml;
using HtmlAgilityPack;
using Microsoft.Extensions.Logging;
using SpotifyAPI.Web;
using TwizzleBot.Grabber.Music.Models;

namespace TwizzleBot.Grabber.Music;

public class AppleMusicGrabber
{
    private readonly ILogger<AppleMusicGrabber> _log;
    private readonly SpotifyGrabber _spotify;
    private readonly HttpClient _client;

    public AppleMusicGrabber(ILogger<AppleMusicGrabber> log, IHttpClientFactory httpClientFactory, SpotifyGrabber spotify)
    {
        _log = log;
        _spotify = spotify;
        _client = httpClientFactory.CreateClient();
    }

    public async Task<FullTrack[]> GetPlaylist(Uri playlistUri)
    {
        var songs = new List<FullTrack>();
        
        // var result = await _client.GetAsync(playlistUri);
        // result.EnsureSuccessStatusCode();
        // var html = await result.Content.ReadAsStringAsync();

        var html = await File.ReadAllTextAsync("html.html");
        
        var doc = new HtmlDocument();
        doc.LoadHtml(html);

        var nodes = doc.DocumentNode.SelectNodes("//div[contains(@class, 'songs-list-row ')]");
        
        for (var index = 0; index < nodes.Count; index++)
        {
            var node = nodes[index];
            
            // Title
            var title = node.DescendantsAndSelf().First(x => x.HasClass("songs-list-row__song-name")).InnerText.Trim();
           
            // Artist
            var artist = node.DescendantsAndSelf().First(x => x.HasClass("songs-list__col--artist")).InnerText.Trim();

            string query = title + " " + artist;
            query = query.Replace("&amp;", "");

            try
            {
                var song = await _spotify.Search(query);
                songs.Add(song.First());
            }
            catch (Exception ex)
            {
                _log.LogWarning(ex, "Failed to find song");
            }
        }

        return songs.ToArray();
    }
}