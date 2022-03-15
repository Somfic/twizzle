FROM mcr.microsoft.com/dotnet/runtime:6.0 AS base
WORKDIR /app

FROM mcr.microsoft.com/dotnet/sdk:6.0 AS build
WORKDIR /src
COPY ["TwizzleBot/TwizzleBot.csproj", "TwizzleBot/"]
RUN dotnet restore "TwizzleBot/TwizzleBot.csproj"
COPY . .
WORKDIR "/src/TwizzleBot"
RUN dotnet build "TwizzleBot.csproj" -c Release -o /app/build

FROM build AS publish
RUN dotnet publish "TwizzleBot.csproj" -c Release -o /app/publish

FROM base AS final
WORKDIR /app
COPY --from=publish /app/publish .
ENTRYPOINT ["dotnet", "TwizzleBot.dll"]
