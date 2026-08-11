# 🥾 Caminhos de Leopoldina

[![React Native](https://img.shields.io/badge/React_Native-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)](https://reactnative.dev/)
[![Expo](https://img.shields.io/badge/Expo-1B1F23?style=for-the-badge&logo=expo&logoColor=white)](https://expo.dev/)
[![Node.js](https://img.shields.io/badge/Node.js-43853D?style=for-the-badge&logo=node.js&logoColor=white)](https://nodejs.org/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-316192?style=for-the-badge&logo=postgresql&logoColor=white)](https://www.postgresql.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)

O **Caminhos de Leopoldina** é um aplicativo móvel voltado para o mapeamento participativo das trilhas e para a valorização da memória histórica local do município de **Leopoldina (MG)**.

O projeto integra a documentação de caminhos rurais e rotas de ecoturismo com a preservação da memória coletiva e a educação patrimonial.

Através da plataforma, a comunidade pode explorar percursos de trekking e ciclismo, acessar dados históricos, utilizar guias e contribuir ativamente sugerindo novas rotas.

---

## ✨ Funcionalidades

- **📍 Exploração de Rotas**
  - Mapa interativo e listagem de trilhas da região.
  - Visualização dos percursos disponíveis.

- **📊 Dados Técnicos**
  - Distância.
  - Altimetria acumulada.
  - Nível de dificuldade.
  - Duração estimada.

- **🏛️ História e Patrimônio**
  - Descrição dos aspectos culturais e ecológicos de cada caminho.
  - Informações históricas.
  - Registro de ruínas e patrimônios históricos.
  - Valorização da memória local.

- **🎧 Guias de Áudio**
  - Narrações relacionadas aos pontos históricos.
  - Conteúdo educativo e cultural durante o percurso.

- **🤝 Contribuição da Comunidade**
  - Sugestão de novas rotas.
  - Adição de fotos.
  - Relatos sobre as condições das trilhas.
  - Participação no mapeamento colaborativo.

---

## 🛠️ Tecnologias Utilizadas

### 📱 Frontend — Mobile

- **React Native**
- **Expo**
- **Expo Router**
- **TypeScript**
- **StyleSheet**

### ⚙️ Backend — API

- **Node.js**
- **Express**
- **TypeORM**
- **TypeScript**

### 🗄️ Banco de Dados

- **PostgreSQL**
- **pgAdmin**

---

## 🚀 Como Rodar o Projeto Localmente

### 📋 Pré-requisitos

Antes de começar, você precisará ter instalado em sua máquina:

- [Node.js](https://nodejs.org/)
- [PostgreSQL](https://www.postgresql.org/)
- [pgAdmin](https://www.pgadmin.org/)
- [Git](https://git-scm.com/)
- [Expo Go](https://expo.dev/go) instalado no seu celular Android ou iOS.

---

## 1️⃣ Clonar o Repositório

Clone o projeto utilizando:

    git clone https://github.com/johnatanduarte/caminhos-de-leopoldina.git

Entre na pasta do projeto:

    cd caminhos-de-leopoldina

---

## 2️⃣ Configurar o Banco de Dados

O projeto utiliza **PostgreSQL** como banco de dados.

### Criar o banco de dados

1. Abra o **pgAdmin**.
2. Conecte-se ao servidor PostgreSQL.
3. Crie um novo banco de dados.
4. Utilize o nome:

    caminhos_leopoldina

A estrutura das tabelas será gerenciada pelo **TypeORM**.

---

## 3️⃣ Configurar o Backend

O backend precisa ser iniciado antes do aplicativo mobile.

Acesse a pasta do backend:

    cd backend

Instale as dependências:

    npm install

### 🔐 Configurar as variáveis de ambiente

Crie um arquivo `.env` dentro da pasta `backend` com as credenciais do PostgreSQL:

    DB_HOST=localhost
    DB_PORT=5432
    DB_USER=postgres
    DB_PASS=sua_senha_aqui
    DB_NAME=caminhos_leopoldina

> ⚠️ **Importante:** nunca envie o arquivo `.env` para o GitHub. Adicione `.env` ao seu `.gitignore`.

### ▶️ Iniciar o servidor

Execute:

    npm run dev

O servidor será iniciado e ficará disponível para receber as requisições do aplicativo.

O **TypeORM** será responsável pelo gerenciamento das entidades e tabelas configuradas no projeto.

---

## 4️⃣ Configurar o Frontend

Mantenha o backend rodando e abra uma **nova aba do terminal**.

Volte para a raiz do projeto:

    cd ..

Entre na pasta do frontend:

    cd frontend

Instale as dependências:

    npm install

### ▶️ Iniciar o Expo

Execute:

    npx expo start

Após a inicialização, o Expo exibirá um **QR Code** no terminal.

Abra o aplicativo **Expo Go** no seu celular e escaneie o QR Code para executar o aplicativo.

---

## 🔄 Fluxo da Aplicação

    ┌─────────────────────────┐
    │                         │
    │      📱 Expo App        │
    │    React Native + TS    │
    │                         │
    └────────────┬────────────┘
                 │
                 │ HTTP / REST API
                 ▼
    ┌─────────────────────────┐
    │                         │
    │     ⚙️ Node + Express   │
    │                         │
    │       TypeScript        │
    │        TypeORM          │
    │                         │
    └────────────┬────────────┘
                 │
                 │ SQL
                 ▼
    ┌─────────────────────────┐
    │                         │
    │      🗄️ PostgreSQL      │
    │                         │
    └─────────────────────────┘

---

## 🌎 Objetivo do Projeto

O **Caminhos de Leopoldina** busca utilizar a tecnologia como ferramenta para:

- Preservar a memória histórica de Leopoldina.
- Incentivar o turismo rural e o ecoturismo.
- Facilitar o acesso às trilhas da região.
- Valorizar patrimônios históricos e culturais.
- Incentivar a participação da comunidade.
- Registrar e documentar caminhos rurais.
- Promover educação patrimonial.
- Conectar tecnologia, história, cultura e meio ambiente.

---

## 🎓 Contexto Acadêmico

O projeto é desenvolvido no âmbito **acadêmico e de extensão do CEFET-MG — Campus Leopoldina**, buscando unir conhecimentos de desenvolvimento de software, banco de dados e desenvolvimento mobile com a valorização do patrimônio histórico e cultural da região.

---

## 📌 Status do Projeto

🚧 **Em desenvolvimento**

O projeto está em desenvolvimento e novas funcionalidades, melhorias na interface e recursos relacionados às trilhas e ao patrimônio histórico serão adicionados ao longo do desenvolvimento.

---

## 📄 Licença

Este projeto é desenvolvido no âmbito acadêmico e de extensão do **CEFET-MG — Campus Leopoldina**.
