# Use a imagem oficial do .NET 8 SDK como base para build
FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build-env
WORKDIR /app

# Copiar arquivos do projeto e restaurar dependências
COPY *.csproj ./
RUN dotnet restore

# Copiar todo o código e fazer build
COPY . ./
RUN dotnet publish -c Release -o out

# Use a imagem runtime para a aplicação final
FROM mcr.microsoft.com/dotnet/aspnet:8.0
WORKDIR /app
COPY --from=build-env /app/out .

# Expor a porta
EXPOSE 80
EXPOSE 443

# Comando de entrada
ENTRYPOINT ["dotnet", "ChatStreamAPI.dll"]