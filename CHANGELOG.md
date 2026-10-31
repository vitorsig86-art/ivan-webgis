# Changelog

Mudanças do Cardeal Map template, da mais recente para a mais antiga. Projetos derivados registram suas próprias mudanças a partir do commit de origem anotado no AGENTS.md do clone.

## Ivan — mudanças do projeto derivado (desde o template da307e3)

### Adicionado — genérico, PORTAR AO TEMPLATE
- `VectorPopupConfig.openOnHome` (padrão `false`): o popup da camada abre sozinho na abertura e ao fim do voo do botão Home, sobre a primeira feição visível, com os botões de ação já visíveis. Espera a feição carregar e o terreno da vista (até 5 s); um clique no mapa antes disso cancela. Se a camada estiver desligada, não abre. Um por projeto: vale a primeira camada configurada.
  - `src/cesium/vectorPopup.ts`: `findHomePopupEntity` e `homePopupPoint` (centro da feição na altura do terreno, convertido em ponto de tela com `SceneTransforms.worldToWindowCoordinates`; só APIs públicas do Cesium 1.146).
  - `src/components/VectorPopup.tsx`: prop `homeRequest` (contador); obstáculos do posicionamento passam a incluir régua do tempo, selo de período, dica do modelo 3D e barra inferior.
  - `src/cesium/projectCamera.ts`: `flyToCamera(viewer, camera, duration?, onComplete?)`; `onComplete` só roda quando o voo chega à vista.
  - `src/components/NavigationControls.tsx`: prop `onHome`, chamada ao fim do voo do Home.
  - `src/components/mobileTabs.ts`: `initialMobileState(hasCampaigns, homePopup = false)`. Com `openOnHome` e sem campanhas, o celular abre com o mapa livre (painel fechado) para o popup aparecer; sem `openOnHome`, continua abrindo em "Camadas".
  - `src/App.tsx`: liga tudo só quando algum GeoJSON tem `popup.openOnHome`; no Home, fecha o painel inferior do celular antes de abrir o popup.
  - No celular o popup fica dentro do mapa (que termina acima da barra inferior) e desvia da barra: não a cobre.
  - Ao portar: incluir testes em `check-ui.cjs` (`initialMobileState(false, true)`) e um check de `findHomePopupEntity` com entidades sintéticas; documentar em `TEMPLATE_FEATURES.md`.

### Adicionado — abertura diferente no celular — genérico, PORTAR AO TEMPLATE
- `ProjectLayerConfig.defaultVisibleMobile` (padrão: `defaultVisible`): visibilidade inicial no layout mobile (mesma largura da barra inferior, `max-width: 760px`). Só a abertura muda; o painel continua ligando e desligando a camada.
- `VectorPopupConfig.openOnHome` aceita `"desktop"`: o popup abre sozinho na abertura e no Home só fora do layout mobile. No celular, tocar na feição abre o popup normalmente.
  - `src/components/mobileTabs.ts`: `MOBILE_MEDIA_QUERY` e `isMobileLayout()`; `Legend.tsx` passa a usar a mesma constante.
  - `src/projects/layerVisibility.ts`: `defaultLayerIds(layers, mobile)`.
  - `src/cesium/vectorPopup.ts`: `opensOnHome(popup, mobile)`; `findHomePopupEntity(viewer, mobile)`.
  - `src/App.tsx`: o layout é lido na carga da página (visibilidade inicial e aba inicial do celular) e em cada Home (popup). O Home não mexe nas camadas.
  - Sem popup na abertura do celular, vale a regra padrão do `initialMobileState`: painel "Camadas" aberto quando não há campanhas.
  - Ao portar: checks de `defaultLayerIds` e `opensOnHome` em `check-ui.cjs`/`check-embedded-pages.cjs`; documentar em `TEMPLATE_FEATURES.md`.

### Corrigido — genérico, PORTAR AO TEMPLATE
- Página embutida (ação de popup em overlay) não deixa mais a câmera longe. Causa: sem `flyTo` na ação, o padrão `true` rodava `viewer.flyTo` até a feição com `range 0`, e o Cesium escolhia a distância pela esfera envolvente da área, bem mais longe que a vista do usuário.
  - `VectorPopupAction.onClose`: `"keep"` (padrão) ou `"home"`. Ao abrir, a câmera é salva; ao fechar, `"keep"` restaura a posição salva sem animação (só se algo a moveu) e `"home"` vai direto para a `initialCamera`.
  - `VectorPopupAction.flyTo` aceita `"home"` (voo até a vista Home antes de abrir), como no Jurema; `false` mantém a câmera.
  - `src/cesium/projectCamera.ts`: `captureCamera`, `restoreCamera` e `flyToCameraSettled` (APIs públicas do Cesium 1.146: `positionWC`, `setView`, `cancelFlight`).
  - `src/App.tsx`: `closePage` aplica o `onClose`; `src/cesium/vectorPopup.ts` normaliza o padrão.
  - `scripts/check-projects.cjs`: `URL` disponível no contexto dos checks (configs que usam `new URL`).
  - Ao portar: estender `check-embedded-pages.cjs` com `onClose` (padrão `"keep"`) e `flyTo: "home"`; documentar em `TEMPLATE_FEATURES.md`.

### Projeto
- Área de Estudo (`area-estudo`) com `defaultVisibleMobile: false` e sem `popup.openOnHome`: o popup nunca abre sozinho (nem na abertura nem no Home, em nenhum aparelho), só ao clicar ou tocar no polígono. Desktop abre com Ortomosaico, Matrículas e Área de Estudo; celular, só com Ortomosaico e Matrículas (além do mapa base). O `openOnHome` (inclusive `"desktop"`) continua disponível no código genérico, sem uso no Ivan.
- Ação "Entrar na simulação 3D" com `flyTo: false` e `onClose: "keep"`: a câmera não se move ao abrir nem ao fechar a simulação.

## [3.0.0] — 2026-10-30 — Redesign visual do Jurema

A interface do Jurema vira o padrão do template: todo WebGIS novo já nasce com ela. Só o que é genérico veio; textos, camadas, campanhas, URLs e assets do Jurema ficaram no Jurema. Versão maior porque o padrão mobile mudou (barra inferior no lugar da gaveta) e porque `TemporalComparison` e o `LayerPanel` mudaram de props.

### Adicionado
- Tema em `src/theme.css` (cores creme/terracota/sálvia, raios, sombras) e fontes locais Figtree (variável 400–700) e Caprasimo em `public/fonts`, com as licenças OFL. Nenhum serviço externo de fontes.
- `src/components/icons.tsx`: conjunto único de ícones (Lucide), com marcador genérico de evento.
- Header de 52 px: marca, "Projeto · Município", "Camadas" (recolhe o painel no desktop), "Sobre os dados" e, com etapas de diagnóstico, o seletor Explorar/Diagnóstico.
- Diálogo "Sobre os dados": campanhas e eventos, modelo 3D, camadas por seção, notas de medição e créditos, lidos da configuração.
- Régua do tempo sobre o mapa, selo de período e "Comparar" na própria régua (os marcos escolhem "Antes" e "Depois"). Só aparecem quando há campanhas temporais.
- `temporalCampaign.eventAfter`: marcador de evento entre duas campanhas.
- `ProjectConfig.temporalLabels` (`timelineTitle`, padrão "Evolução da paisagem"; `layerName`, padrão "Ortomosaico").
- `panel.sectionTitles`: nomes das seções, com padrão genérico.
- `legendMode: "none"` e aviso "Legenda não fornecida" para raster temático sem `legend` nem `legendMode`, só em desenvolvimento; o build de produção não inclui o texto.
- Cartão de legenda com botão "Legenda · N".
- Popup com atributos legíveis primeiro e campos técnicos da fonte (ex.: `STREAM_ID`) em "Atributos da fonte".
- Dica de navegação sobre o mapa na primeira vez que o modelo 3D é ligado.
- Celular: barra inferior (Camadas, Tempo, Medir, Legenda) e painel inferior com alça (médio/alto). "Tempo" só com campanhas, "Legenda" só com legenda; aba inicial "Tempo" com campanhas e "Camadas" sem elas. Regras em `src/components/mobileTabs.ts`.
- Checks `scripts/check-temporal.cjs` e `scripts/check-ui.cjs` no `npm run check`.
- Ações em popups de vetor (`VectorPopupConfig.actions`): botão que abre uma página externa indicada por uma propriedade da feição (`urlProperty`) ou fixa na configuração (`url`), sobre o mapa (com voo até a feição) ou em nova aba. Uso previsto: simulação 3D de talhão gerada pelo pipeline de café keyline.
- `ProjectConfig.embeddedPages.allowedOrigins`: lista de origens https permitidas; sem ela nenhum botão aparece.
- Componente `EmbeddedPageOverlay` (carregado sob demanda): página em tela cheia com "Voltar ao mapa", Esc e "Abrir em nova aba".
- Exemplo inativo `plotSimulationExample` e contrato `scripts/check-embedded-pages.cjs` no `npm run check`.

### Alterado
- Padrão mobile: a gaveta lateral com backdrop e o botão "☰ Camadas" saíram; entram a barra inferior e o painel inferior.
- Coluna fixa de ferramentas à direita (bússola, zoom, Home, GPS, medição) em vez de controles reposicionados conforme as legendas. A lógica de navegação do template foi mantida (Home, limite, GPS fora da área, desligar GPS); no celular o zoom por botão some (pinça).
- Painel de camadas: interruptores no checkbox nativo, título "Camadas", busca com ícone (ainda desligada por padrão). Campanhas temporais viram um único interruptor na seção Mapa base, com o período ativo; o período é escolhido na régua. `TemporalSelector` saiu do painel.
- `TemporalComparison` não tem mais seletores próprios (`onChange`/`onExit` removidos); recebe `modelVisible` e avisa que o modelo 3D cobre as duas metades.
- `legendMode: "embedded"` não mostra mais a nota "Legenda incorporada ao mapa".
- Medição: nota "Sobre as altitudes" recolhível, com o texto do template.
- Atribuição do Cesium: conteúdo e diálogo nativos, mais discreta e compacta; no celular, acima da régua na aba "Tempo".
- Modo diagnóstico, cenas, página sobre o mapa e painéis de desenvolvimento no novo tema; o cartão de diagnóstico ocupa o canto do selo de período.
- `scripts/check-workspace.cjs` avalia `import.meta.env.DEV` como build de produção e cobre `sectionTitles`, o interruptor temporal e os modos de legenda.
- `.gitignore` inclui `.codex/`.
- O botão de fechar do popup ganhou a classe `vector-popup-close`; o CSS passou a mirar essa classe em vez de todo `button` do popup.

### Migração de projetos derivados
- Atualizar um projeto existente é opcional e manual: traga `src/theme.css`, `public/fonts`, `src/styles.css`, `src/App.tsx`, `src/components/` e os tipos novos de `src/projects/types.ts`, e rode os checks.
- Quem usava `TemporalComparison` com `onChange`/`onExit` ou o `TemporalSelector` dentro do painel deve seguir o novo `App.tsx`.
- Rasters temáticos sem legenda: defina `legend`, `legendMode: "embedded"` ou `legendMode: "none"` para não ver o aviso em desenvolvimento.

## Consolidação do Cyro — 2026-10-28

Lições do primeiro projeto derivado (Cyro) trazidas para o template.

### Adicionado
- `docs/NOVO-PROJETO.md`: roteiro passo a passo de um WebGIS (clonar → `.env.local` → rasters do XML do Global Mapper → teste de tile → Home com `cameraCapture` → modelo do ion → `modelAlignment` → `cropAuthoring` → desligar `developmentTools` → vetores com `prepare-geojson` → repositório privado e push), com as lições do Cyro e um exemplo comentado de `src/projects/<slug>.ts`. Referenciado no AGENTS.md (Projetos derivados), no README e no checklist.
- `scripts/prepare-geojson.cjs` (`npm run prepare-geojson`): GeoJSON do Global Mapper pronto para o R2 (sem Z, 7 casas, `KML_STYLE` → `id` sequencial); curvas com `cota_m` e `mestra` (a cada 15 m, configurável); drenagem com `STRAHLER` pela topologia e `comprimento_m`, abortando em trecho com mais de uma saída ou rede sem sentido definido. Teste sintético em `scripts/check-prepare-geojson.cjs`, incluído no `npm run check`.
- Opções de painel `ProjectConfig.panel` (portadas do Cyro): `showLayerSearch`, `sectionOrder`, `expandedSections`.
- `kind: "aspect"` (orientação de vertentes); o Cyro precisou usar `solar-orientation`.
- `credit` opcional em camadas GeoJSON (`GeoJsonDataSource` `credit`); aparece enquanto a camada estiver carregada, mesmo desligada.

### Alterado
- Padrão do painel: sem busca de camadas, ordem Mapa base, Modelo 3D, Rasters, Vetores (e Análise Macro), com Modelo 3D aberto. Projetos que queiram o comportamento anterior: `panel: { showLayerSearch: true, sectionOrder: ["basemap", "raster", "vector", "model"], expandedSections: [] }`.
- `scripts/new-project.ps1`: robocopy exclui por nome `node_modules`, `.git`, `dist`, `.vercel`, `.npm-cache`, `.vite`, `.verification`, `.env` e `.env.local` (exit code < 8 = sucesso); cria a branch `main` com o primeiro commit e lembra, no final, de preencher o `.env.local` e criar o repositório privado no GitHub.

### Corrigido
- `scripts/raster-from-xml.cjs`: o tile de teste é o do centro do BoundingBox, não o da borda. Com o BoundingBox de tiles inteiros do Global Mapper, a faixa de tiles ganhava uma linha/coluna vizinha (2×2 contado como 9). A saída avisa que esses bounds não são os do projeto.

## [Não lançado] — 2026-10-28

### Adicionado
- Limite de navegação a partir de `bounds` (margem `navigation.marginRatio`, padrão 25%; altura máxima `navigation.maximumZoomDistance`, padrão derivado dos bounds); `bounds` passa a ser opcional e sem ele não há limite.
- GPS fora da área: marcador visível, câmera mantida no limite e aviso curto.
- Cenas com `camera` opcional (voam até a vista salva).
- Painel de captura de câmera em DEV: Home, cena e bounds da vista, com chave para ignorar o limite.
- Título da aba "<nome do projeto> | Cardeal Map".
- Painel de camadas: `group`, `subsection`, busca sem acentos, seções recolhíveis com contadores ativo/total, mensagens de status, `legendMode: "embedded"` e `exclusiveGroup`.
- Cenas rápidas (`scenes`): botões que aplicam um conjunto exato de camadas.
- Série temporal (`temporalCampaign`) e comparação lado a lado (`temporalComparison`).
- Modo Diagnóstico (`diagnostic.steps`).
- Botão "Minha localização" (GPS).
- Ferramenta "Diferença de cota" (ΔZ, distâncias, inclinação e declividade, com procedência da superfície).
- Simbologia de drenagem simulada por Strahler (`symbology: "simulated-drainage-strahler"`).
- `uniqueFeatureIds` preserva o id original no atributo `source_id`, exibível no popup.
- `scripts/new-project.ps1`: cria um projeto derivado (cópia sem artefatos/segredos, skills como pasta real, `src/projects/<slug>.ts`, aviso no AGENTS.md, `git init`).
- `scripts/raster-from-xml.cjs`: gera a entrada de raster a partir do `tilemapresource.xml` e testa tile/CORS remotos.
- Documentação: `docs/CHECKLIST_NOVO_PROJETO.md`, `docs/R2_CORS.md` + `docs/r2-cors.json`, `docs/TEMPLATE_FEATURES.md`, pesquisa de Vector Tiles e plano da POC de drenagem.
- `CLAUDE.md` (importa o AGENTS.md); AGENTS.md com protocolo de compatibilidade Cesium, "Projetos derivados" e a lista de exceções de internals.

### Alterado
- Cesium fixado em `1.146.0` (sem `^`).
- Avisos de medição: cotas vêm do World Terrain ou do modelo 3D, não do MDT do projeto.
- Checks: `check-workspace` e `check-measurements` atualizados, `.env.example` tolerante a CRLF, `check-projects` aceita projetos derivados, novo `check-raster-xml`.
- README com os recursos novos; relatórios antigos movidos para `docs/historico/`.

### Removido
- `allowMissingTiles` (sem efeito), abertura por `bounds` inalcançável, prop `formatValue` da legenda, CSS sem uso, `public/favicon.svg`, logo duplicado na raiz e nomes de projetos anteriores nos docs.

## [2.0.0] — 2026-10-04 (`9144d32`)

Promoção da arquitetura de produção para o template. Detalhes em `docs/historico/TEMPLATE_V2_REPORT.md`.

- Popup Cardeal com seleção por prioridade, formatação pt-BR e campos ausentes omitidos.
- Classificação de polígonos/linhas por atributo, paleta de contorno por índice e bordas como polylines.
- `prepareGeoJson`: `ignoreAltitude` e `uniqueFeatureIds`.
- Modelo 3D por URL ou ion com token dedicado, `heightOffsetMeters`, recorte por polígono e `terrainCutout`.
- Ferramentas de desenvolvimento (altura, recorte, captura de câmera) só em DEV.
- Lacunas 404/410 de tiles recuperáveis e diagnóstico de fonte sem cobertura.

## [1.0.0] — 2026-10-03 (`d84948b`)

Template genérico sincronizado do projeto de referência. Detalhes em `docs/historico/SYNC_REPORT.md`.

- Viewer Cesium com Bing Aerial e World Terrain via ion, com fallback OpenStreetMap e elipsoide.
- Câmera inicial/Home, bússola e zoom; medições de coordenadas, distância e área.
- Rasters TMS/XYZ com opacidade, GeoJSON, 3D Tiles, legendas em imagem/gradiente.
- Layout desktop e mobile (drawer, backdrop, cabeçalho compacto) e atribuição nativa do Cesium.
- Skills CesiumJS para agentes.
