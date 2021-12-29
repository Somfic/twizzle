using System;
using Discord;
using Discord.Commands;
using Discord.Interactions;
using Discord.WebSocket;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;
using SpotifyAPI.Web;
using TwizzleBot.Audio;
using TwizzleBot.Grabber;
using TwizzleBot.Handlers;
using TwizzleBot.Handlers.Commands;
using TwizzleBot.Handlers.Interactions;
using Victoria;

namespace TwizzleBot.Client
{
    public static class TwizzleBotExtensions
    {
        public static IServiceProvider AddTwizzleBot(this IServiceCollection services)
        {
            // Twizzle services
            services.AddSingleton<Bot>();
            services.AddSingleton<CommandHandler>();
            services.AddSingleton<InteractionHandler>();
            services.AddSingleton<AudioPlayer>();
            
            // Discord services
            services.AddSingleton<DiscordSocketClient>();
            services.AddSingleton<CommandService>();
            services.AddSingleton<InteractionService>();
            
            // Grabber services
            services.AddSingleton<SpotifyGrabber>();
            services.AddSingleton<YouTubeGrabber>();
            
            // Lavalink services
            services.AddLavaNode(config =>
            {
                config.SelfDeaf = true;
            });

            // System services
            services.AddHttpClient("Bot", config =>
            {
                config.DefaultRequestHeaders.Add("user-agent", 
                    "Mozilla/4.0 (compatible; MSIE 6.0; " +
                    "Windows NT 5.2; .NET CLR 1.0.3705;)");
            });
                            
            return services.BuildServiceProvider();
        }
        
        public static LogLevel GetLogLevel(this LogMessage message)
        {
            return message.Severity switch
            {
                LogSeverity.Critical => LogLevel.Critical,
                LogSeverity.Error => LogLevel.Error,
                LogSeverity.Warning => LogLevel.Warning,
                LogSeverity.Info => LogLevel.Information,
                LogSeverity.Debug => LogLevel.Debug,
                LogSeverity.Verbose => LogLevel.Trace,
                _ => LogLevel.None
            };
        }
    }
}