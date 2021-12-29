﻿using System.Threading.Tasks;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using TwizzleBot.Client;

var host = Host.CreateDefaultBuilder()
    .ConfigureServices(services => { services.AddTwizzleBot(); })
    .ConfigureAppConfiguration(config => { config.AddJsonFile("appsettings.json", false); })
    .ConfigureLogging(logging => logging.SetMinimumLevel(LogLevel.Trace))
    .Build();

await host.Services.GetRequiredService<Bot>().Run();

await Task.Delay(-1);
