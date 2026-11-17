# Caminhos de Leopoldina

Aplicativo de trilhas de Leopoldina/MG em React Native, Expo e TypeScript. Esta versão concentra o cadastro na aba Sugerir, preservando as cores e a navegação do projeto.

## Executar

Na pasta frontend:

```powershell
npm ci
npx expo start --web --clear
```

Para celular, use `npx expo start --clear` e um cliente compatível com Expo SDK 57.
Não execute o backend: não há dependência de PostgreSQL, Docker, login ou API própria. O Expo serve os arquivos da interface durante o desenvolvimento; ele não é um banco nem o antigo servidor de cadastro.

## Gravar uma rota

1. Abra Sugerir e escolha Gravar meu percurso.
2. Permita a localização e aguarde leituras precisas.
3. Caminhe com o aplicativo visível. Acompanhe percurso, distância, tempo ativo, velocidade atual/média e altitude atual/mínima/máxima.
4. Use Pausar/Continuar quando necessário. Finalize, dê um nome e salve.
5. Abra o percurso salvo na aba Mapa.

No notebook, a localização do navegador também pode acompanhar o deslocamento. Se ela não tiver precisão suficiente, use Desenhar no mapa, clique nos pontos na ordem do percurso e finalize. O desenho informa a distância entre os pontos; não inventa tempo, velocidade ou altitude.

## Armazenamento e limites

- Rotas, rascunhos e perfil são locais, usando AsyncStorage. Na web, ficam no armazenamento daquele navegador e endereço (origem).
- Não há publicação pública, sincronização nem contas nesta versão. Outros usuários não recebem as rotas. O armazenamento local não é uma área protegida por senha.
- Limpar dados do navegador ou desinstalar o aplicativo pode apagar as gravações.
- A gravação pausa ao sair da tela, ocultar a página ou colocar o aplicativo em segundo plano. No notebook, mantenha a página visível e o computador acordado.
- Localização web exige HTTPS ou localhost e permissão do navegador. Notebook pode fornecer posição imprecisa e nenhuma altitude.
- O percurso ignora leituras com erro horizontal acima de 35 m e saltos incompatíveis com a gravação. As velocidades são aproximadas; a média usa apenas tempo ativo. Pausas separam os segmentos, sem criar uma linha entre eles.
- Altitudes mínima/máxima exigem pelo menos três leituras com precisão vertical até 50 m; valores ausentes aparecem como traço. A altitude atual com precisão insuficiente é indicada como aproximada.
- A visualização do mapa depende de internet: OpenStreetMap/Esri na web e Android; Apple Maps no iOS.

## Verificação

Na pasta frontend:

```powershell
npm run typecheck
npm test
npx expo export --platform web --platform ios --platform android
```

Os testes cobrem localização web, permissões, filtros GPS, pausas, desenho, velocidades e persistência local. A exportação verifica os pacotes das plataformas; não substitui um percurso real com o aparelho.

## Código principal

- `frontend/src/features/gravacao/RoutesScreen.tsx`: fluxo de gravação, pausa, revisão e salvamento.
- `frontend/src/features/gravacao/routeMath.ts`: distância, velocidade, tempo e altitude.
- `frontend/src/features/gravacao/routeStorage.ts`: rotas e rascunhos locais.
- `frontend/src/features/gravacao/location.web.ts`: localização do navegador.
- `frontend/src/features/gravacao/TrailMap.web.tsx` e `mapHtml.ts`: mapa web e desenho.
- `frontend/src/services/localProfile.ts`: perfil local.
