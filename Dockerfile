# Usar uma imagem base Node.js
FROM node:18-alpine

# Criar diretório de trabalho
WORKDIR /app

# Copiar os arquivos do projeto
COPY ./app .

# Instalar dependências
RUN npm install

# Expor a porta do servidor
EXPOSE 3000

# Comando para iniciar o servidor
CMD ["node", "api.js"]