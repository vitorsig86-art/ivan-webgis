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
    modelo,
  ],
  scenes: [],
  diagnostic: { steps: [] },
  // Ferramentas de desenvolvimento desligadas: Home, altura e recorte já definidos.
  developmentTools: { modelAlignment: false, cropAuthoring: false, cameraCapture: false },
};
