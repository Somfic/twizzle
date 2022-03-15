using System;
using System.Collections.Generic;
using System.Linq;
using System.Net.Http;
using System.Text;
using System.Text.Json;
using System.Text.RegularExpressions;
using System.Threading.Tasks;
using System.Web;
using Microsoft.Extensions.Logging;
using Newtonsoft.Json;
using SpotifyAPI.Web;

namespace TwizzleBot.Grabber.Lyrics;

public class GeniusGrabber
{
    private readonly ILogger<GeniusGrabber> _log;
    private readonly HttpClient _client;

    public GeniusGrabber(ILogger<GeniusGrabber> log, IHttpClientFactory httpClientFactory)
    {
        _log = log;
        _client = httpClientFactory.CreateClient();
    }

    public async Task<Uri> FindUrl(FullTrack track)
    {
        var query = HttpUtility.ParseQueryString($"{track.Name} {track.Artists.FirstOrDefault().Name}");

        var response = await _client.GetAsync($"https://genius.com/api/search/multi?q={query}");
        response.EnsureSuccessStatusCode();

        var json = await response.Content.ReadAsStringAsync();
        var searchResult = JsonConvert.DeserializeObject<GeniusSearch>(json);

        return searchResult.Response.Sections.First(x => x.Type == "song").Hits[0].Result.Url;
    }

    public async Task<string> FindLyrics(Uri uri)
    {
        var response = await _client.GetAsync(uri);
        response.EnsureSuccessStatusCode();

        var responseData = await response.Content.ReadAsByteArrayAsync();
        var jsonDocument = JsonDocument.Parse(ExtractJson(responseData));
        var lyrics = new Queue<string>();
        ExtractLyrics(jsonDocument.RootElement.EnumerateArray());
        var str = string.Join(Environment.NewLine, lyrics);

        string ExtractJson(Span<byte> responseData)
        {
            var bytes1 = Encoding.UTF8.GetBytes("\\\"children\\\":[{\\\"children\\\":[");
            var bytes2 = Encoding.UTF8.GetBytes("\\\"\\\"],\\\"tag\\\":\\\"root\\\"}");
            var length1 = responseData.Length;
            var start1 = responseData.IndexOf((ReadOnlySpan<byte>) bytes1);
            var length2 = length1 - start1;
            var span2 = responseData.Slice(start1, length2);
            var span3 = span2.Slice(0, span2.LastIndexOf((ReadOnlySpan<byte>) bytes2) + bytes2.Length - 0);
            var utF8 = Encoding.UTF8;
            var length3 = span3.Length;
            const int start2 = 28;
            var length4 = length3 - 39 - start2;
            ReadOnlySpan<byte> bytes3 = span3.Slice(start2, length4);
            return Regex.Unescape(utF8.GetString(bytes3));
        }

        void ExtractLyrics(IEnumerable<JsonElement> elements)
        {
            foreach (var element in elements)
            {
                switch (element.ValueKind)
                {
                    case JsonValueKind.Object:
                        JsonElement jsonElement;
                        if (element.TryGetProperty("children", out jsonElement))
                        {
                            ExtractLyrics(jsonElement.EnumerateArray());
                            continue;
                        }

                        continue;
                    case JsonValueKind.String:
                        var str = element.GetString();
                        if (!string.IsNullOrWhiteSpace(str))
                            lyrics.Enqueue(str);

                        continue;
                    default:
                        continue;
                }
            }
        }

        return str;
    }
}