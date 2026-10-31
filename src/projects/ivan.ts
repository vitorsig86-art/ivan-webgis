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
// heightOffsetMeters 0 até conferir a altura com modelAlignment; sem clipping e
// sem terrainCutout até desenhar o recorte com cropAuthoring.
const modelo: ProjectLayerConfig = {
  id: "modelo", name: "Modelo 3D", description: "Modelo 3D (Agisoft Metashape)", kind: "3d-tiles", defaultVisible: false,
  source: { format: "3d-tiles", source: "ion", assetId: 5030184, tokenEnv: "VITE_CESIUM_ION_TOKEN", heightOffsetMeters: 0 },
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
  // PROVISÓRIA: vista de cima sobre os dados do orto (canto sudeste do BoundingBox,
  // tiles 14/6150-6151/7169-7170). Substitua por
  // "Capturar Home" (cameraCapture). Ângulos em graus; altura em metros sobre o elipsoide.
  initialCamera: { longitude: -44.852, latitude: -21.895, height: 5500, heading: 0, pitch: -90, roll: 0 },
  // Ordem = empilhamento: o último item fica por cima.
  layers: [
    basemap,
    orto,
    derived("mdt", "mdt", "Modelo Digital de Terreno", "dtm"),
    derived("mds", "mds", "Modelo Digital de Superfície", "dsm"),
    derived("declividade", "decli", "Declividade", "slope"),
    derived("aspecto", "aspect", "Orientação de Vertentes", "aspect"),
    modelo,
  ],
  scenes: [],
  diagnostic: { steps: [] },
  // Ferramentas só aparecem em npm run dev. modelAlignment e cropAuthoring: conferir
  // a altura e desenhar o recorte do modelo; desligue todas ao finalizar.
  developmentTools: { modelAlignment: true, cropAuthoring: true, cameraCapture: true },
};
