#!/bin/bash

# Script de configuração do ChatStream
echo "🚀 Configurando ChatStream..."

# Verificar se Docker está instalado
if ! command -v docker &> /dev/null; then
    echo "❌ Docker não está instalado. Por favor, instale o Docker primeiro."
    exit 1
fi

if ! command -v docker-compose &> /dev/null; then
    echo "❌ Docker Compose não está instalado. Por favor, instale o Docker Compose primeiro."
    exit 1
fi

# Criar estrutura de diretórios
echo "📁 Criando estrutura de diretórios..."
mkdir -p backend
mkdir -p frontend/src/{components,contexts,services}
mkdir -p frontend/public

# Copiar arquivos de configuração do backend
echo "📝 Configurando backend..."

# Verificar se os arquivos já existem antes de criar
if [ ! -f "backend/Program.cs" ]; then
    echo "⚠️  Arquivos do backend não encontrados. Certifique-se de copiar os arquivos dos artifacts."
fi

if [ ! -f "frontend/src/App.tsx" ]; then
    echo "⚠️  Arquivos do frontend não encontrados. Certifique-se de copiar os arquivos dos artifacts."
fi

# Construir e iniciar os containers
echo "🐳 Construindo e iniciando containers..."
docker-compose down --remove-orphans
docker-compose up --build -d

# Aguardar o banco de dados estar pronto
echo "⏳ Aguardando banco de dados..."
sleep 30

# Verificar status dos containers
echo "📊 Status dos containers:"
docker-compose ps

echo ""
echo "✅ Configuração concluída!"
echo ""
echo "🌐 Aplicação disponível em:"
echo "   Frontend: http://localhost:3000"
echo "   Backend API: http://localhost:5000"
echo "   Swagger UI: http://localhost:5000/swagger"
echo ""
echo "📋 Para visualizar logs:"
echo "   docker-compose logs -f [backend|frontend|sqlserver]"
echo ""
echo "🛑 Para parar a aplicação:"
echo "   docker-compose down"
echo ""
echo "🔧 Para reconstruir:"
echo "   docker-compose up --build"