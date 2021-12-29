using System;
using System.Linq;
using System.Reflection;
using System.Text.RegularExpressions;
using System.Threading.Tasks;
using Discord;
using Discord.Interactions;
using Discord.WebSocket;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using TwizzleBot.Client;
using IResult = Discord.Interactions.IResult;
using UriTypeConverter = TwizzleBot.Handlers.Interactions.TypeConverters.UriTypeConverter;

namespace TwizzleBot.Handlers.Interactions;

public class InteractionHandler : IHandler
{
    private readonly ILogger<InteractionHandler> _log;
    private readonly DiscordSocketClient _client;
    private readonly InteractionService _interactionService;
    private readonly IServiceProvider _services;
    private readonly IConfiguration _config;

    public InteractionHandler(ILogger<InteractionHandler> log, DiscordSocketClient client,
        InteractionService interactionService, IServiceProvider services, IConfiguration config)
    {
        _log = log;
        _client = client;
        _interactionService = interactionService;
        _services = services;
        _config = config;

        client.InteractionCreated += OnInteractionCreated;

        _interactionService.Log += OnLog;
        _interactionService.SlashCommandExecuted += OnCommandExecuted;
        _interactionService.ContextCommandExecuted += OnCommandExecuted;
        _interactionService.ComponentCommandExecuted += OnCommandExecuted;
        _interactionService.AutocompleteCommandExecuted += OnCommandExecuted;
        _interactionService.AutocompleteHandlerExecuted += OnHandlerExecuted;

        _client.SlashCommandExecuted += OnCommandExecuted;
        _client.UserCommandExecuted += OnCommandExecuted;
        _client.MessageCommandExecuted += OnCommandExecuted;
        _client.ButtonExecuted += OnCommandExecuted;
    }

    private async Task OnCommandExecuted<T>(T command) where T : SocketInteraction
    {
        _log.LogTrace("Executing command {Type}", command.GetType().Name);
        var context = new SocketInteractionContext(_client, command);
        await _interactionService.ExecuteCommandAsync(context, _services);
    }

    private async Task OnHandlerExecuted(IAutocompleteHandler handler, IInteractionContext context, IResult result)
    {
        if (result.Error == InteractionCommandError.UnknownCommand)
            return;

        // Log the result
        if (result.IsSuccess)
        {
            _log.LogTrace("{User} successfully executed autocomplete handler {Handler}", $"{context.User.Username}#{context.User.Discriminator}", handler.GetType().Name);
        }
        else
        {
            _log.LogWarning("{User} failed to execute autocomplete handler {Handler}", $"{context.User.Username}#{context.User.Discriminator}", handler.GetType().Name);
            await context.Interaction.ModifyOriginalResponseAsync(x => x.Content += "\nAn error occurred while executing that command.\n```\n{result.ErrorReason}\n```");
        }
    }

    private async Task OnCommandExecuted<T>(CommandInfo<T> info, IInteractionContext context, IResult result) where T : class, IParameterInfo
    {
        if (result.Error == InteractionCommandError.UnknownCommand)
            return;
            
        // Regex to extract everything before 'Command'
        var regex = new Regex(@"^(?<command>.*)Command");
        var match = regex.Match(typeof(T).Name);
        var type = match.Success ? match.Groups["command"].Value.ToLower() : typeof(T).Name;

        // Log the result
        if (result.IsSuccess)
        {
            _log.LogTrace("{User} successfully executed {Type} command {Module}:{Command}", $"{context.User.Username}#{context.User.Discriminator}", type, info.Module.Name, info.Name);
        }
        else
        {
            _log.LogWarning("{User} failed to execute {Type} command {Module}:{Command}. {ErrorType}: {Error}", $"{context.User.Username}#{context.User.Discriminator}", type, info.Module.Name, info.Name, result.ToString(), result.ErrorReason);
            await context.Interaction.FollowupAsync($"An error occurred while executing that command.\n```\n{result.ErrorReason}\n```");
        }
    }

    public async Task Register(Assembly assembly)
    {
        _interactionService.AddTypeConverter<Uri>(new UriTypeConverter());
        await _interactionService.AddModulesAsync(assembly, _services);

        var guilds = _config.GetSection("Discord:Guilds").GetChildren().Select(x => x.Value);
        
        foreach (var guildId in guilds)
        {
            _log.LogTrace("Adding guild {Guild}", guildId);
            
            var guild = _client.GetGuild(ulong.Parse(guildId));
            
            if (guild == null)
            {
                _log.LogWarning("Could not find guild {GuildId}", guildId);
                continue;
            }

            await _interactionService.RegisterCommandsToGuildAsync(guild.Id);
            
            _log.LogInformation("Added guild {Guild}", guild.Name);
        }
    }

    private async Task OnInteractionCreated(SocketInteraction interaction)
    {
        // On interaction received
    }
        
    private Task OnLog(LogMessage message)
    {
        _log.Log(message.GetLogLevel(), message.Exception, "{Source}: {Message}", message.Source, message.Message);
        return Task.CompletedTask;
    }
}