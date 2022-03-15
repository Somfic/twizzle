using System;
using System.Reflection;
using System.Threading.Tasks;
using Discord;
using Discord.WebSocket;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;
using SpotifyAPI.Web;
using TwizzleBot.Grabber;
using TwizzleBot.Grabber.Music;
using TwizzleBot.Handlers;
using TwizzleBot.Handlers.Commands;
using TwizzleBot.Handlers.Interactions;
using Victoria;

namespace TwizzleBot.Client;

public class Bot
{
    private readonly ILogger<Bot> _log;
    private readonly IConfiguration _configuration;
    private readonly LavaNode _lavaNode;
    private readonly SpotifyGrabber _spotify;
    private readonly DiscordSocketClient _client;
        
    private readonly IHandler _commandHandler;
    private readonly IHandler _interactionHandler;

    public Bot(ILogger<Bot> log, IServiceProvider services, IConfiguration configuration, LavaNode lavaNode, SpotifyGrabber spotify)
    {
        _log = log;
        _configuration = configuration;
        _lavaNode = lavaNode;
        _spotify = spotify;
        _client = services.GetRequiredService<DiscordSocketClient>();
            
        _commandHandler = services.GetRequiredService<CommandHandler>();
        _interactionHandler = services.GetRequiredService<InteractionHandler>();

        _client.Log += OnLog;
        _lavaNode.OnLog += async message =>
        {
            if(message.Severity > LogSeverity.Debug)
                await OnLog(message);
        };
    }
        
    public async Task Run()
    {
        var assembly = Assembly.GetEntryAssembly();

        _client.Ready += async () =>
        {
            await _commandHandler.Register(assembly);
            await _interactionHandler.Register(assembly);
                
            if (!_lavaNode.IsConnected) {
                await _lavaNode.ConnectAsync();
            }

            await _spotify.Authenticate();
        };

        await _client.LoginAsync(TokenType.Bot, _configuration["Discord:Token"]);
        await _client.StartAsync();
    }

    private Task OnLog(LogMessage message)
    {
        _log.Log(message.GetLogLevel(), message.Exception, "{Source}: {Message}", message.Source, message.Message);

        return Task.CompletedTask;
    }
}