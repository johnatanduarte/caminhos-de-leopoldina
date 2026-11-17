# Aplicar a versão sem backend

Faça uma cópia de segurança da sua pasta atual antes de substituir arquivos.

1. Extraia este ZIP fora da pasta do projeto.
2. Dentro dele, abra caminhos-de-leopoldina-git.
3. Copie a pasta frontend para a raiz do seu projeto caminhos-de-leopoldina-git, aceitando substituir arquivos. Não coloque frontend dentro de frontend.
4. Copie também README.md e este guia para a raiz.
5. A pasta backend antiga pode permanecer guardada, mas não precisa ser executada. Este pacote não a utiliza.

O caminho correto do código é caminhos-de-leopoldina-git/frontend/src. Não copie node_modules, .expo ou .git entre projetos.

## Iniciar no Windows

```powershell
cd C:\Users\inaci\OneDrive\Documentos\caminhos-de-leopoldina-git\frontend
npm ci
npx expo start --web --clear
```

O aplicativo abre diretamente, sem cadastro. Use Sugerir para gravar ou desenhar, e Mapa para reabrir rotas salvas.

## Preparar o commit

Depois de testar, abra um terminal na raiz do seu repositório original:

```powershell
git status --short --branch
git diff --stat
git diff --check
```

Confira as alterações antes de adicionar arquivos. Não inclua node_modules, .expo, dist, ZIPs, credenciais ou arquivos .env. O .gitignore do frontend foi atualizado; arquivos já rastreados pelo Git precisam ser tratados separadamente.

Este ZIP não contém seu histórico .git e não cria commit nem faz push. Preserve a pasta .git original. Se o Git indicar conflito ou merge em andamento, resolva esse estado antes de iniciar outro commit.

Mensagem sugerida: feat: gravação local de rotas sem backend
