import type { KitComponent } from './types';
import {
  TexoButton,
  TexoCheckbox,
  TexoChart,
  TexoInput,
  TexoLabel,
  TexoRect,
  TexoStack,
  TexoSvg,
  TexoTable,
} from './components';

/**
 * The built-in component vocabulary an LLM may invoke.
 *
 * `grid` is intentionally absent: it is a layout directive owned by the reconciler
 * (see `LAYOUT_DIRECTIVES` in `@texo-ui/react`), which resolves cell geometry and the
 * mount protocol before the registry is consulted.
 *
 * Names are registered unprefixed only. The parser strips a leading `texo-` from directive
 * names before resolution, so `:> texo-button` and `:> button` both resolve to `button`.
 */
export function createBuiltInComponents(): Record<string, KitComponent> {
  return {
    stack: TexoStack,
    button: TexoButton,
    checkbox: TexoCheckbox,
    input: TexoInput,
    label: TexoLabel,
    table: TexoTable,
    chart: TexoChart,
    rect: TexoRect,
    svg: TexoSvg,
  };
}
