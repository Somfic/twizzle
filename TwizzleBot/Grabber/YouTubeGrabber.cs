using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using Microsoft.Extensions.Logging;
using Victoria;
using Victoria.Responses.Search;

namespace TwizzleBot.Grabber
{
    public class YouTubeGrabber
    {
        private readonly ILogger<YouTubeGrabber> _log;
        private readonly LavaNode _lavaNode;

        public YouTubeGrabber(ILogger<YouTubeGrabber> log, LavaNode lavaNode)
        {
            _log = log;
            _lavaNode = lavaNode;
        }

        public async Task<IReadOnlyCollection<LavaTrack>> Search(string query)
        {
            _log.LogDebug("Querying YouTube for query '{Query}'", query);
            
            var result = await _lavaNode.SearchYouTubeAsync(query);

            switch (result.Status)
            {
                case SearchStatus.LoadFailed:
                    throw new Exception($"Failed to load YouTube search results for query '{query}'.", new Exception(result.Exception.Message));
                case SearchStatus.NoMatches:
                    throw new Exception($"Could not find any Spotify matches for query '{query}'.");
            }
            
            _log.LogTrace("Found {Count} YouTube matches for query '{Query}'", result.Tracks.Count, query);

            return result.Tracks;
        }
    }
}