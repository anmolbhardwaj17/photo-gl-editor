import { Simulation } from '../store/simulationsSlice'
import { EditorParams } from '../store/editorSlice'
import { loadCubeLUT } from '../services/lutLoader'

// Default simulation parameters
const defaultSimulationParams: Partial<EditorParams> = {
  exposure: 0,
  wbTemp: 5500,
  wbTint: 0,
  contrast: 0,
  hsl: {
    hue: 0,
    saturation: 0,
    luminance: 0,
  },
}

// Simulation definitions - Fujifilm Film Simulations
export const simulationDefinitions: Omit<Simulation, 'lutData'>[] = [
  {
    id: 'provia',
    name: 'PROVIA / STANDARD',
    desc: 'balanced neutral everyday',
    year: 1990,
    thumbnailUrl: '/images/simulations/provia.png',
    lutSize: 32,
    defaultParams: { ...defaultSimulationParams },
  },
  {
    id: 'velvia',
    name: 'Velvia / VIVID',
    desc: 'punchy saturated landscape',
    year: 1991,
    thumbnailUrl: '/images/simulations/velvia.png',
    lutSize: 32,
    defaultParams: { ...defaultSimulationParams },
  },
  {
    id: 'astia',
    name: 'ASTIA / SOFT',
    desc: 'soft gentle skin-tones',
    year: 2000,
    thumbnailUrl: '/images/simulations/astia.png',
    lutSize: 64,
    defaultParams: { ...defaultSimulationParams },
  },
  {
    id: 'classic-chrome',
    name: 'CLASSIC CHROME',
    desc: 'muted documentary contrast',
    year: 2014,
    thumbnailUrl: '/images/simulations/classic chrome.png',
    lutSize: 32,
    defaultParams: { ...defaultSimulationParams },
  },
  {
    id: 'pro-neg-hi',
    name: 'PRO Neg. Hi',
    desc: 'crisp contrast portrait',
    year: 2012,
    thumbnailUrl: '/images/simulations/pro negative high.png',
    lutSize: 32,
    defaultParams: { ...defaultSimulationParams },
  },
  {
    id: 'pro-neg-std',
    name: 'PRO Neg. Std',
    desc: 'soft neutral portrait',
    year: 2012,
    thumbnailUrl: '/images/simulations/pro negative standard.png',
    lutSize: 32,
    defaultParams: { ...defaultSimulationParams },
  },
  {
    id: 'classic-neg',
    name: 'CLASSIC Neg.',
    desc: 'retro punchy consumer-film',
    year: 2019,
    thumbnailUrl: '/images/simulations/classic negative.png',
    lutSize: 32,
    defaultParams: { ...defaultSimulationParams },
  },
  {
    id: 'nostalgic-neg',
    name: 'NOSTALGIC Neg.',
    desc: 'warm vintage cinema',
    year: 2022,
    thumbnailUrl: '/images/simulations/nostalgic negative.png',
    lutSize: 32,
    defaultParams: { ...defaultSimulationParams },
  },
  {
    id: 'eterna',
    name: 'ETERNA / CINEMA',
    desc: 'flat cinematic soft',
    year: 2017,
    thumbnailUrl: '/images/simulations/eterna.png',
    lutSize: 32,
    defaultParams: { ...defaultSimulationParams },
  },
  {
    id: 'eterna-bleach-bypass',
    name: 'ETERNA Bleach Bypass',
    desc: 'desaturated high contrast',
    year: 2020,
    thumbnailUrl: '/images/simulations/eterna bleach bypass.png',
    lutSize: 32,
    defaultParams: { ...defaultSimulationParams },
  },
  {
    id: 'reala-ace',
    name: 'REALA ACE',
    desc: 'neutral faithful punch',
    year: 2024,
    thumbnailUrl: '/images/simulations/reala.png',
    lutSize: 32,
    defaultParams: { ...defaultSimulationParams },
  },
  {
    id: 'acros',
    name: 'ACROS',
    desc: 'clean refined monochrome',
    year: 1964,
    lutSize: 33,
    defaultParams: { ...defaultSimulationParams },
  },
  {
    id: 'acros-ye',
    name: 'ACROS + Ye Filter',
    desc: 'slightly lighter skies',
    year: 1964,
    lutSize: 33,
    defaultParams: { ...defaultSimulationParams },
  },
  {
    id: 'acros-r',
    name: 'ACROS + R Filter',
    desc: 'dramatic dark skies',
    year: 1964,
    lutSize: 33,
    defaultParams: { ...defaultSimulationParams },
  },
  {
    id: 'acros-g',
    name: 'ACROS + G Filter',
    desc: 'better skin balance',
    year: 1964,
    lutSize: 33,
    defaultParams: { ...defaultSimulationParams },
  },
  {
    id: 'monochrome',
    name: 'MONOCHROME',
    desc: 'plain neutral black-white',
    year: 1930,
    lutSize: 33,
    defaultParams: { ...defaultSimulationParams },
  },
  {
    id: 'monochrome-ye',
    name: 'MONOCHROME + Ye Filter',
    desc: 'mild contrast boost',
    year: 1930,
    lutSize: 33,
    defaultParams: { ...defaultSimulationParams },
  },
  {
    id: 'monochrome-r',
    name: 'MONOCHROME + R Filter',
    desc: 'hard dark sky look',
    year: 1930,
    lutSize: 33,
    defaultParams: { ...defaultSimulationParams },
  },
  {
    id: 'monochrome-g',
    name: 'MONOCHROME + G Filter',
    desc: 'smooth skin contrast',
    year: 1930,
    lutSize: 33,
    defaultParams: { ...defaultSimulationParams },
  },
  {
    id: 'sepia',
    name: 'SEPIA',
    desc: 'warm brown vintage',
    year: 1880,
    lutSize: 33,
    defaultParams: { ...defaultSimulationParams },
  },
]

// Map simulation IDs to actual filenames (handles spaces and special characters)
function getCubeFileName(id: string): string {
  // Convert ID back to filename format
  // IDs use hyphens, filenames may have spaces
  const filenameMap: Record<string, string> = {}
  
  // Return mapped filename or default to ID.cube
  return filenameMap[id] || `${id}.cube`
}

// Helper to check if LUT is identity (no transformation)
function isIdentityLUT(lutData: Float32Array, size: number): boolean {
  const step = 1.0 / (size - 1)
  const tolerance = 0.001
  
  for (let b = 0; b < size; b++) {
    for (let g = 0; g < size; g++) {
      for (let r = 0; r < size; r++) {
        const index = (b * size * size + g * size + r) * 3
        const expectedR = r * step
        const expectedG = g * step
        const expectedB = b * step
        
        if (
          Math.abs(lutData[index] - expectedR) > tolerance ||
          Math.abs(lutData[index + 1] - expectedG) > tolerance ||
          Math.abs(lutData[index + 2] - expectedB) > tolerance
        ) {
          return false
        }
      }
    }
  }
  return true
}

// Load simulations with LUT data
export async function loadSimulations(): Promise<Simulation[]> {
  const simulations: Simulation[] = []
  
  for (const def of simulationDefinitions) {
    try {
      let lutData: Float32Array | null = null
      let lutSize = def.lutSize
      let hasRealLUT = false
      
      try {
        // Try to load actual .cube file
        const cubeFileName = getCubeFileName(def.id)
        // Construct URL relative to current file location
        const baseUrl = import.meta.url.replace(/\/[^/]*$/, '/')
        const cubeUrl = new URL(cubeFileName, baseUrl).href
        const lutResult = await loadCubeLUT(cubeUrl)
        lutData = lutResult.data
        lutSize = lutResult.size
        
        // Check if it's a real LUT or identity
        hasRealLUT = !isIdentityLUT(lutData, lutSize)
      } catch (error) {
        // File doesn't exist or failed to load - skip this simulation
        console.warn(`Failed to load LUT for ${def.id}, skipping simulation:`, error)
        continue
      }
      
      // Only add simulation if it has real LUT data
      if (hasRealLUT && lutData) {
        simulations.push({
          ...def,
          lutData,
          lutSize,
        })
      }
    } catch (error) {
      console.error(`Failed to load simulation ${def.id}:`, error)
      // Skip simulations that fail to load
    }
  }
  
  return simulations
}

