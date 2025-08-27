# ChatStream

Uma aplicação completa de chat em tempo real e streaming de vídeo construída com ASP.NET Core, React e SignalR.

## 🚀 Funcionalidades

### Chat em Tempo Real
- **Login de usuário** com autenticação JWT
- **Login como convidado** sem necessidade de cadastro
- **Salas de chat** múltiplas com histórico de mensagens
- **Notificações** de usuários entrando/saindo
- **Interface responsiva** para desktop e mobile

### Streaming de Vídeo
- **Transmissão ao vivo** via WebRTC
- **Chat da stream** em tempo real
- **Contador de viewers** dinâmico
- **Lista de streams ativas**
- **Interface de controle** para streamers

### Recursos Técnicos
- **Autenticação JWT** com suporte a guests
- **SignalR** para comunicação em tempo real
- **WebRTC** para streaming de vídeo P2P
- **Entity Framework** com SQL Server
- **Docker** para deploy completo

## 🏗️ Arquitetura

### Backend (ASP.NET Core 8)
- **Controllers**: Auth, Chat, Stream
- **Services**: AuthService, ChatService, StreamService
- **Hubs**: ChatHub para SignalR
- **Models**: User, ChatRoom, ChatMessage, StreamSession
- **Data**: ApplicationDbContext com Entity Framework

### Frontend (React + TypeScript)
- **Contexts**: AuthContext, SignalRContext
- **Components**: Login, Chat, Stream, Navigation
- **Services**: API integration
- **Styling**: CSS modules responsivos

### Database (SQL Server)
- **Users**: Usuários e perfis
- **ChatRooms**: Salas de chat
- **ChatMessages**: Mensagens com histórico
- **StreamSessions**: Sessions de streaming

## 📦 Instalação e Deploy

### Pré-requisitos
- Docker e Docker Compose
- Git

### Setup Rápido

1. **Clone o repositório**:
```bash
git clone <seu-repositorio>
cd chatstream
```

2. **Execute o script de configuração**:
```bash
chmod +x setup.sh
./setup.sh
```

3. **Acesse a aplicação**:
- Frontend: http://localhost:3000
- Backend API: http://localhost:5000
- Swagger: http://localhost:5000/swagger

### Setup Manual

1. **Criar estrutura de diretórios**:
```
chatstream/
├── backend/
├── frontend/
└── docker-compose.yml
```

2. **Copiar arquivos** dos artifacts fornecidos para suas respectivas pastas

3. **Configurar CSS**: Criar os arquivos CSS dos componentes conforme documentado

4. **Executar com Docker**:
```bash
docker-compose up --build
```

## 🛠️ Desenvolvimento

### Backend
```bash
cd backend
dotnet restore
dotnet run
```

### Frontend
```bash
cd frontend
npm install
npm start
```

### Database
O banco é criado automaticamente via Entity Framework migrations.

## 🔧 Configuração

### Variáveis de Ambiente

**Backend (appsettings.json)**:
```json
{
  "ConnectionStrings": {
    "DefaultConnection": "Server=localhost;Database=ChatStreamDB;..."
  },
  "JwtSettings": {
    "Secret": "YourSecretKey"
  }
}
```

**Frontend**:
As URLs da API são configuradas em `src/services/api.ts`.

## 📱 Como Usar

### Chat
1. **Login**: Crie uma conta ou entre como convidado
2. **Salas**: Navegue entre diferentes salas de chat
3. **Mensagens**: Envie mensagens em tempo real
4. **Usuários**: Veja quem está online

### Streaming
1. **Criar Stream**: Usuários logados podem iniciar transmissões
2. **Assistir**: Qualquer usuário pode assistir streams ativas
3. **Interagir**: Chat integrado durante a transmissão
4. **Gerenciar**: Streamers podem encerrar suas transmissões

## 🔒 Segurança

- **JWT Tokens** para autenticação
- **CORS** configurado corretamente
- **Validações** no backend e frontend
- **Sanitização** de inputs
- **HTTPS** pronto para produção

## 📊 Monitoramento

### Logs
```bash
# Todos os serviços
docker-compose logs -f

# Serviço específico
docker-compose logs -f backend
docker-compose logs -f frontend
```

### Health Checks
- Backend: http://localhost:5000/health
- Database: Verificar status via logs

## 🚀 Deploy em Produção

### Configurações Recomendadas

1. **SSL/TLS**: Configurar certificados
2. **Environment**: Usar `appsettings.Production.json`
3. **Secrets**: Usar Azure Key Vault ou similar
4. **Scaling**: Load balancer para múltiplas instâncias
5. **Database**: SQL Server em produção

### Docker em Produção
```bash
# Build otimizado
docker-compose -f docker-compose.yml -f docker-compose.prod.yml up -d

# Backup do banco
docker exec chatstream-db /opt/mssql-tools/bin/sqlcmd \
  -S localhost -U SA -P "YourPassword" \
  -Q "BACKUP DATABASE ChatStreamDB TO DISK = '/tmp/backup.bak'"
```

## 🐛 Solução de Problemas

### Problemas Comuns

**Container não inicia**:
```bash
# Verificar logs
docker-compose logs <service-name>

# Reconstruir
docker-compose down
docker-compose up --build
```

**Database connection issues**:
- Verificar senha do SA no docker-compose.yml
- Aguardar inicialização completa do SQL Server
- Verificar connection string

**WebRTC não funciona**:
- Verificar permissões de câmera/microfone
- Testar em HTTPS (necessário para produção)
- Verificar firewall/NAT

**SignalR desconectado**:
- Verificar URL do hub
- Verificar token JWT válido
- Verificar CORS policy

## 🤝 Contribuição

1. Fork o projeto
2. Crie uma branch para sua feature
3. Commit suas mudanças
4. Push para a branch
5. Abra um Pull Request

## 📄 Licença

Este projeto está sob licença MIT. Veja o arquivo LICENSE para mais detalhes.

## 📞 Suporte

Para suporte ou dúvidas:
- Abra uma issue no GitHub
- Consulte a documentação da API (Swagger)
- Verifique os logs dos containers

## 🎯 Roadmap

- [ ] Notificações push
- [ ] Upload de arquivos no chat
- [ ] Gravação de streams
- [ ] Moderação avançada
- [ ] Integração com APIs externas
- [ ] App mobile nativo
- [ ] Múltiplos idiomas

---

Desenvolvido com ❤️ usando ASP.NET Core, React e Docker.