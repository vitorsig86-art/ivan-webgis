import type { ProjectConfig, ProjectLayerConfig } from "./types";
import { templateProject } from "./template";

// Valores reais do projeto ivan. template.ts guarda só exemplos genéricos
// usados por npm run check: não coloque dados da propriedade nele.
// Passo a passo: docs/NOVO-PROJETO.md (exemplo real comentado: projeto Cyro).
const basemap = templateProject.layers[0];

const r2 = "https://pub-f3f08cfa758947f583f5cfa82934b628.r2.dev";
const credit = "Cardeal Map";

// Entradas geradas com scripts/raster-from-xml.cjs (TMS, EPSG:3857, PNG 256x256).
// Os bounds de cada camada são o BoundingBox do XML: tiles inteiros do nível
// mínimo, não o contorno dos dados. Servem só para limitar as requisições.
const orto: ProjectLayerConfig = {
  id: "orto", name: "Ortomosaico", description: "Ortomosaico", kind: "orthomosaic", defaultVisible: true,
  source: {
    format: "tms", url: `${r2}/orto/{z}/{x}/{reverseY}.png`, credit,
    bounds: [-45, -21.9430456, -44.8242187, -21.7799053],
    minimumLevel: 11, maximumLevel: 20, tileWidth: 256, tileHeight: 256,
  },
};

// Derivados do relevo: legenda desenhada no próprio raster, um por vez sobre o orto.
const derivedBounds: [number, number, number, number] = [-45, -21.9430456, -43.5937499, -20.6327842];
const derived = (id: string, folder: string, name: string, kind: ProjectLayerConfig["kind"]): ProjectLayerConfig => ({
  id, name, description: name, kind, defaultVisible: false,
  legendMode: "embedded", exclusiveGroup: "derivados",
  source: {
    format: "tms", url: `${r2}/${folder}/{z}/{x}/{reverseY}.png`, credit,
    bounds: derivedBounds, minimumLevel: 8, maximumLevel: 17, tileWidth: 256, tileHeight: 256,
  },
});

// Modelo 3D do Agisoft Metashape no Cesium ion. VITE_CESIUM_3D_TOKEN é igual a
// VITE_CESIUM_ION_TOKEN no .env.local, então o modelo usa o token principal.
const modelo: ProjectLayerConfig = {
  id: "modelo", name: "Modelo 3D", description: "Modelo 3D (Agisoft Metashape)", kind: "3d-tiles", defaultVisible: false,
  source: {
    format: "3d-tiles", source: "ion", assetId: 5030184, tokenEnv: "VITE_CESIUM_ION_TOKEN",
    // 0: modelo assenta no World Terrain sem offset; referencial vertical do asset a confirmar no ion
    heightOffsetMeters: 0,
    // Recorte desenhado com cropAuthoring (lon, lat em graus): mostra só o interior do polígono.
    clipping: {
      enabled: true,
      inverse: true,
      positions: [
        [-44.8381981, -21.8947421],
        [-44.8422660, -21.8860875],
        [-44.8437372, -21.8849261],
        [-44.8503949, -21.8833502],
        [-44.8646316, -21.8893870],
        [-44.8584773, -21.9022867],
        [-44.8573668, -21.9024460],
      ],
    },
    terrainCutout: false,
  },
};

// Vetores: GeoJSON em CRS84, sem Z, com id único (sem uniqueFeatureIds).
const geojson = (file: string) => `${r2}/geojson/${file}`;

const contours = (id: string, file: string, name: string): ProjectLayerConfig => ({
  id, name, description: name, kind: "contours", defaultVisible: false, exclusiveGroup: "curvas",
  source: {
    format: "geojson", url: geojson(file), autoZoom: false,
    style: { stroke: "#000000", strokeWidth: 1, clampToGround: true, zIndex: 5 },
    popup: { title: "Curva de nível", fields: [{ property: "cota_m", label: "Cota", suffix: " m", format: "integer" }] },
  },
});

// Uma cor por microbacia pelo atributo "cor" (0 a 9): preenchimento e contorno iguais.
const microbaciaColors = ["#E6194B", "#3CB44B", "#FFE119", "#4363D8", "#F58231", "#911EB4", "#42D4F4", "#F032E6", "#BFEF45", "#FABED4"];
const microbacias: ProjectLayerConfig = {
  id: "microbacias", name: "Microbacias", description: "Microbacias", kind: "vector", defaultVisible: false, opacityControl: true,
  source: {
    format: "geojson", url: geojson("microbacias.geojson"), autoZoom: false,
    style: {
      stroke: "#FFFFFF", strokeWidth: 1.5, fillOpacity: 0.35, clampToGround: true, zIndex: 3,
      // stroke na classe só serve de reserva do contorno se "cor" vier como texto ("3"):
      // o outline usa o índice numérico; a classificação aceita os dois.
      classification: { property: "cor", classes: Object.fromEntries(microbaciaColors.map((color, index) => [String(index), { fill: color, stroke: color }])) },
      outline: { property: "cor", colors: microbaciaColors, width: 1.5 },
    },
    popup: { titleProperty: "nome", fields: [
      { property: "area_ha", label: "Área", decimals: 2, suffix: " ha" },
      { property: "perimetro_km", label: "Perímetro", decimals: 2, suffix: " km" },
    ] },
  },
};

// Ordem de Strahler por classificação simples (sem a symbology simulated-drainage-strahler).
const drenagem: ProjectLayerConfig = {
  id: "drenagem", name: "Drenagem", description: "Drenagem", kind: "drainage", defaultVisible: false,
  source: {
    format: "geojson", url: geojson("drenagem.geojson"), autoZoom: false,
    style: {
      stroke: "#00E5FF", strokeWidth: 1, clampToGround: true, zIndex: 10,
      classification: { property: "STRAHLER", classes: {
        1: { stroke: "#00E5FF", strokeWidth: 1, zIndex: 10 },
        2: { stroke: "#14B8F0", strokeWidth: 1.6, zIndex: 11 },
        3: { stroke: "#1E88E5", strokeWidth: 2.4, zIndex: 12 },
        4: { stroke: "#1546D8", strokeWidth: 3.4, zIndex: 13 },
        5: { stroke: "#0B2A9E", strokeWidth: 4.4, zIndex: 14 },
      } },
    },
    popup: { title: "Drenagem", fields: [
      { property: "STRAHLER", label: "Ordem de Strahler", format: "integer" },
      { property: "area_contribuicao_ha", label: "Área de contribuição", decimals: 2, suffix: " ha" },
    ] },
  },
};

const estradas: ProjectLayerConfig = {
  id: "estradas", name: "Estradas", description: "Estradas", kind: "vector", defaultVisible: false,
  source: {
    format: "geojson", url: geojson("estradas.geojson"), autoZoom: false,
    // Polígonos preenchidos, sem contorno (stroke só atende ao tipo).
    style: { stroke: "#8B5A2B", strokeWidth: 1, fill: "#8B5A2B", fillOpacity: 0.6, polygonOutline: false, clampToGround: true, zIndex: 15 },
  },
};

const matriculas: ProjectLayerConfig = {
  id: "matriculas", name: "Matrículas", description: "Matrículas", kind: "property-boundary", defaultVisible: true,
  source: {
    format: "geojson", url: geojson("perimetros.geojson"), autoZoom: false,
    style: { stroke: "#FFD400", strokeWidth: 2.5, fillOpacity: 0, clampToGround: true, zIndex: 20 },
    popup: { titleProperty: "nome", fields: [] },
  },
};

// Área de estudo com a simulação 3D de café keyline, como no Jurema. Estilo do Jurema
// (3 px, preenchimento 0.18, zIndex 25) em laranja, para não confundir com o amarelo
// das matrículas. O botão abre a simulação sobre o mapa sem mover a câmera
// (flyTo false) e, ao fechar, a câmera fica onde estava (onClose "keep");
// a origem está liberada em embeddedPages.
const simulationUrl = "https://cafe-keyline-3d.vercel.app/";
const areaEstudo: ProjectLayerConfig = {
  id: "area-estudo", name: "Área de Estudo", description: "Simulação 3D de café keyline", kind: "vector", defaultVisible: true, opacityControl: true,
  source: {
    format: "geojson", url: geojson("area_estudo.geojson"), autoZoom: false,
    style: { stroke: "#FF6A00", strokeWidth: 3, fill: "#FF6A00", fillOpacity: 0.18, clampToGround: true, zIndex: 25 },
    popup: {
      titleProperty: "nome",
      fields: [
        { property: "area_ha", label: "Área", decimals: 2, suffix: " ha" },
        { property: "perimetro_km", label: "Perímetro", decimals: 2, suffix: " km" },
      ],
      actions: [{ label: "Entrar na simulação 3D", url: simulationUrl, flyTo: false, onClose: "keep" }],
      // Abre sozinho na abertura e a cada Home, com o botão da simulação visível.
      openOnHome: true,
    },
  },
};

export const project: ProjectConfig = {
  ...templateProject,
  id: "ivan",
  name: "Ivan",
  location: "Cruzília-MG",
  // Sem bounds = sem limite de navegação. Desligado de propósito: o BoundingBox
  // dos XMLs é de tiles inteiros, não o contorno dos dados. Capture os bounds
  // reais com "Capturar bounds da vista" (npm run dev) e preencha aqui.
  // bounds: [W, S, E, N],
  // Abertura e Home, capturadas com "Capturar Home" (cameraCapture).
  // Ângulos em graus; altura em metros sobre o elipsoide.
  initialCamera: { longitude: -44.8585743, latitude: -21.8817342, height: 1810.6, heading: 156.20, pitch: -35.23, roll: 0.00 },
  // Ordem = empilhamento: o último item fica por cima.
  layers: [
    basemap,
    orto,
    derived("mdt", "mdt", "Modelo Digital de Terreno", "dtm"),
    derived("mds", "mds", "Modelo Digital de Superfície", "dsm"),
    derived("declividade", "decli", "Declividade", "slope"),
    derived("aspecto", "aspect", "Orientação de Vertentes", "aspect"),
    microbacias,
    contours("curvas2", "curvas_2m.geojson", "Curvas de Nível (2 m)"),
    contours("curvas3", "curvas_3m.geojson", "Curvas de Nível (3 m)"),
    drenagem,
    estradas,
    matriculas,
    areaEstudo,
    modelo,
  ],
  // Páginas que os popups podem abrir sobre o mapa (simulação 3D da área de estudo).
  embeddedPages: { allowedOrigins: [new URL(simulationUrl).origin] },
  scenes: [],
  diagnostic: { steps: [] },
  // Ferramentas de desenvolvimento desligadas: Home, altura e recorte já definidos.
  developmentTools: { modelAlignment: false, cropAuthoring: false, cameraCapture: false },
};
