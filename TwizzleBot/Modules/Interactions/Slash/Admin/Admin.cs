using System;
using System.Threading.Tasks;
using Discord;
using Discord.Interactions;
using Discord.WebSocket;
using Microsoft.Extensions.Configuration;
using TwizzleBot.Audio;

namespace TwizzleBot.Modules.Interactions.Slash.Admin;

public class Admin : InteractionModuleBase<SocketInteractionContext<SocketInteraction>>
{
    private readonly DiscordSocketClient _client;
    private readonly AudioPlayer _player;
    private readonly IConfiguration _config;

    public Admin(DiscordSocketClient client, AudioPlayer player, IConfiguration config)
    {
        _client = client;
        _player = player;
        _config = config;
    }
        
    [SlashCommand("reload", "Reloads the bot")]
    [RequireUserPermission(GuildPermission.Administrator)]
    public async Task Reload()
    {
        await DeferAsync();
        await FollowupAsync($"Reloading ... ");

        await _client.StopAsync();
        await _client.LogoutAsync();
        await _client.LoginAsync(TokenType.Bot, _config["Discord:Token"]);
        await _client.StartAsync();
    }
        
    [SlashCommand("restart", "Restarts the bot")]
    [RequireUserPermission(GuildPermission.Administrator)]
    public async Task Stop()
    {
        await DeferAsync();
        await FollowupAsync($"Restarting ... ");

        await _client.StopAsync();
        await _client.LogoutAsync();
           
        Environment.Exit(0);
    }
}