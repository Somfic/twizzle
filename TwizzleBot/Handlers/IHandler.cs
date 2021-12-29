using System.Reflection;
using System.Threading.Tasks;

namespace TwizzleBot.Handlers;

public interface IHandler
{
    Task Register(Assembly assembly);
}