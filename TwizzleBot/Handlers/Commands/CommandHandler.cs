using System;
using System.Reflection;
using System.Threading.Tasks;
using Discord;
using Discord.Commands;
using Discord.WebSocket;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using TwizzleBot.Client;
using IResult = Discord.Commands.IResult;

namespace TwizzleBot.Handlers.Commands
{
    public class CommandHandler : IHandler
    {
        private readonly ILogger<CommandHandler> _log;
        private readonly DiscordSocketClient _client;
        private readonly CommandService _commandService;
        private readonly IServiceProvider _services;
        private readonly IConfiguration _config;

        public CommandHandler(ILogger<CommandHandler> log, DiscordSocketClient client, CommandService commandService, IServiceProvider services, IConfiguration config)
        {
            _log = log;
            _client = client;
            _commandService = commandService;
            _services = services;
            _config = config;

            client.MessageReceived += OnMessageReceived;
            
            _commandService.Log += OnLog;
            _commandService.CommandExecuted += OnCommandExecuted;
        }

        private async Task OnCommandExecuted(Optional<CommandInfo> info, ICommandContext context, IResult result)
        {
            if (result.Error == CommandError.UnknownCommand)
                return;

            // Log the result
            if (result.IsSuccess)
            {
                _log.LogTrace("{User} successfully executed text command {Module}:{Command}", $"{context.User.Username}#{context.User.Discriminator}", info.Value.Module.Name, info.Value.Name);
            }
            else
            {
                _log.LogWarning("{User} failed to execute text command {Module}:{Command}. {ErrorType}: {Error}", $"{context.User.Username}#{context.User.Discriminator}", info.Value.Module.Name, info.Value.Name, result.Error.ToString(), result.ErrorReason);
            }
        }

        public async Task Register(Assembly assembly)
        {
            await _commandService.AddModulesAsync(assembly, _services);
        }

        private async Task OnMessageReceived(SocketMessage m)
        {
            // Ignore system messages
            if (m is not SocketUserMessage message) return;
            
            // Ignore messages from self
            if (message.Author.Id == _client.CurrentUser.Id) return;
            
            // Ignore messages from bots
            if (message.Author.IsBot) return;
            
            // Check if the message starts with the correct prefix
            var argPos = 0;
            if (!(message.HasStringPrefix(_config["Discord:Prefix"], ref argPos) || message.HasMentionPrefix(_client.CurrentUser, ref argPos))) return;

            // Create command context
            var context = new SocketCommandContext(_client, message);
            
            // Execute command
            await _commandService.ExecuteAsync(context, argPos, _services);
        }
        
        private Task OnLog(LogMessage message)
        {
            _log.Log(message.GetLogLevel(), message.Exception, "{Source}: {Message}", message.Source, message.Message);
            return Task.CompletedTask;
        }
    }
}