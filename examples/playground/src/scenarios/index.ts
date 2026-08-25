import { inventoryScenario } from './casual/inventory';
import { memeScenario } from './casual/meme';
import { seoulWeatherScenario } from './casual/seoul-weather';
import { tarotScenario } from './casual/tarot';
import { tournamentScenario } from './casual/tournament';
import { vibePickerScenario } from './casual/vibe-picker';
import type { Scenario } from '../utils/stream-simulator';

export const allScenarios: Scenario[] = [
  tournamentScenario,
  tarotScenario,
  memeScenario,
  seoulWeatherScenario,
  vibePickerScenario,
  inventoryScenario,
];

export function findScenario(id: string): Scenario | undefined {
  return allScenarios.find((scenario) => scenario.id === id);
}
