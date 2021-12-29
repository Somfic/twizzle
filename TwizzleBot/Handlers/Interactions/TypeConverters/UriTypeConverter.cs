using System;
using System.Threading.Tasks;
using Discord;
using Discord.Interactions;

namespace TwizzleBot.Handlers.Interactions.TypeConverters;

public class UriTypeConverter : TypeConverter<Uri>
{
    public override ApplicationCommandOptionType GetDiscordType() => ApplicationCommandOptionType.String;

    public override Task<TypeConverterResult> ReadAsync(IInteractionContext context, IApplicationCommandInteractionDataOption option, IServiceProvider services)
    {
        if (!Uri.TryCreate((string) option.Value, UriKind.Absolute, out var uri))
        {
            return Task.FromResult(TypeConverterResult.FromError(InteractionCommandError.ConvertFailed, $"{option.Value} is not a valid link"));
        }
            
        return Task.FromResult(TypeConverterResult.FromSuccess(uri));
    }
}