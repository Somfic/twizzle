using System;
using System.Threading.Tasks;
using Discord.Commands;

namespace TwizzleBot.Modules.Commands;

public class Pong : ModuleBase<SocketCommandContext>
{
    [Command("ping")]
    public async Task PingAsync()
    {
        await ReplyAsync("Pong!");
    }
}