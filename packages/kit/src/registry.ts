import type { KitComponent } from './types';
import {
  TexoButton,
  TexoChart,
  TexoGrid,
  TexoInput,
  TexoRect,
  TexoStack,
  TexoSvg,
  TexoTable,
} from './components';

export function createBuiltInComponents(): Record<string, KitComponent> {
  return {
    stack: TexoStack,
    grid: TexoGrid,
    button: TexoButton,
    input: TexoInput,
    table: TexoTable,
    chart: TexoChart,
    rect: TexoRect,
    svg: TexoSvg,
    'texo-stack': TexoStack,
    'texo-grid': TexoGrid,
    'texo-button': TexoButton,
    'texo-input': TexoInput,
    'texo-table': TexoTable,
    'texo-chart': TexoChart,
    'texo-rect': TexoRect,
    'texo-svg': TexoSvg,
  };
}
