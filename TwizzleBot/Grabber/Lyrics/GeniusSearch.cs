using System;
using System.Globalization;
using Newtonsoft.Json;
using Newtonsoft.Json.Converters;

namespace TwizzleBot.Grabber.Lyrics;

public partial class GeniusSearch
{
    [JsonProperty("meta")]
    public Meta Meta { get; set; }

    [JsonProperty("response")]
    public Response Response { get; set; }
}

public class Meta
{
    [JsonProperty("status")]
    public long Status { get; set; }
}

public class Response
{
    [JsonProperty("sections")]
    public Section[] Sections { get; set; }
}

public class Section
{
    [JsonProperty("type")]
    public string Type { get; set; }

    [JsonProperty("hits")]
    public Hit[] Hits { get; set; }
}

public class Hit
{
    [JsonProperty("highlights")]
    public Highlight[] Highlights { get; set; }

    [JsonProperty("index")]
    public string Index { get; set; }

    [JsonProperty("type")]
    public string Type { get; set; }

    [JsonProperty("result")]
    public Result Result { get; set; }
}

public class Highlight
{
    [JsonProperty("property")]
    public string Property { get; set; }

    [JsonProperty("value")]
    public string Value { get; set; }

    [JsonProperty("snippet")]
    public bool Snippet { get; set; }

    [JsonProperty("ranges")]
    public Range[] Ranges { get; set; }
}

public class Range
{
    [JsonProperty("start")]
    public long Start { get; set; }

    [JsonProperty("end")]
    public long End { get; set; }
}

public class Result
{
    [JsonProperty("_type")]
    public string Type { get; set; }

    [JsonProperty("annotation_count")]
    public long AnnotationCount { get; set; }

    [JsonProperty("api_path")]
    public string ApiPath { get; set; }

    [JsonProperty("artist_names")]
    public string ArtistNames { get; set; }

    [JsonProperty("full_title")]
    public string FullTitle { get; set; }

    [JsonProperty("header_image_thumbnail_url")]
    public Uri HeaderImageThumbnailUrl { get; set; }

    [JsonProperty("header_image_url")]
    public Uri HeaderImageUrl { get; set; }

    [JsonProperty("id")]
    public long Id { get; set; }

    [JsonProperty("instrumental")]
    public bool Instrumental { get; set; }

    [JsonProperty("lyrics_owner_id")]
    public long LyricsOwnerId { get; set; }

    [JsonProperty("lyrics_state")]
    public string LyricsState { get; set; }

    [JsonProperty("lyrics_updated_at")]
    public long LyricsUpdatedAt { get; set; }

    [JsonProperty("path")]
    public string Path { get; set; }

    [JsonProperty("pyongs_count")]
    public long? PyongsCount { get; set; }

    [JsonProperty("song_art_image_thumbnail_url")]
    public Uri SongArtImageThumbnailUrl { get; set; }

    [JsonProperty("song_art_image_url")]
    public Uri SongArtImageUrl { get; set; }

    [JsonProperty("stats")]
    public Stats Stats { get; set; }

    [JsonProperty("title")]
    public string Title { get; set; }

    [JsonProperty("title_with_featured")]
    public string TitleWithFeatured { get; set; }

    [JsonProperty("updated_by_human_at")]
    public long UpdatedByHumanAt { get; set; }

    [JsonProperty("url")]
    public Uri Url { get; set; }

    [JsonProperty("primary_artist")]
    public PrimaryArtist PrimaryArtist { get; set; }
}

public class PrimaryArtist
{
    [JsonProperty("_type")]
    public string Type { get; set; }

    [JsonProperty("api_path")]
    public string ApiPath { get; set; }

    [JsonProperty("header_image_url")]
    public Uri HeaderImageUrl { get; set; }

    [JsonProperty("id")]
    public long Id { get; set; }

    [JsonProperty("image_url")]
    public Uri ImageUrl { get; set; }

    [JsonProperty("index_character")]
    public string IndexCharacter { get; set; }

    [JsonProperty("is_meme_verified")]
    public bool IsMemeVerified { get; set; }

    [JsonProperty("is_verified")]
    public bool IsVerified { get; set; }

    [JsonProperty("name")]
    public string Name { get; set; }

    [JsonProperty("slug")]
    public string Slug { get; set; }

    [JsonProperty("url")]
    public Uri Url { get; set; }

    [JsonProperty("iq", NullValueHandling = NullValueHandling.Ignore)]
    public long? Iq { get; set; }
}

public class Stats
{
    [JsonProperty("unreviewed_annotations")]
    public long UnreviewedAnnotations { get; set; }

    [JsonProperty("concurrents", NullValueHandling = NullValueHandling.Ignore)]
    public long? Concurrents { get; set; }

    [JsonProperty("hot")]
    public bool Hot { get; set; }

    [JsonProperty("pageviews", NullValueHandling = NullValueHandling.Ignore)]
    public long? Pageviews { get; set; }
}

public partial class GeniusSearch
{
    public static GeniusSearch FromJson(string json) => JsonConvert.DeserializeObject<GeniusSearch>(json, Converter.Settings);
}

public static class Serialize
{
    public static string ToJson(this GeniusSearch self) => JsonConvert.SerializeObject(self, Converter.Settings);
}

internal static class Converter
{
    public static readonly JsonSerializerSettings Settings = new JsonSerializerSettings
    {
        MetadataPropertyHandling = MetadataPropertyHandling.Ignore,
        DateParseHandling = DateParseHandling.None,
        Converters =
        {
            new IsoDateTimeConverter { DateTimeStyles = DateTimeStyles.AssumeUniversal }
        },
    };
}