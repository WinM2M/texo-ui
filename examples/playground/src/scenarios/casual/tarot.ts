import type { Scenario } from '../../utils/stream-simulator';

export const tarotScenario: Scenario = {
  id: 'tarot',
  name: 'Tarot Reading',
  systemPrompt:
    'Generate tarot-like mood UI using grid, button, table. Apply a dark-theme preset.',
  content: `Daily card guidance

:> grid
 - title: "Pick one card"
 - columns: 3

:> button
 - label: "Draw Left Card"
 - action: "draw-left"
 - variant: "primary"

:> button
 - label: "Draw Center Card"
 - action: "draw-center"
 - variant: "secondary"

:> button
 - label: "Draw Right Card"
 - action: "draw-right"
 - variant: "ghost"

:> table
 - columns: ["position","card","message"]
 - rows: [{"position":"Past","card":"The Fool","message":"Try a fresh angle."},{"position":"Present","card":"The Star","message":"Keep steady hope."},{"position":"Future","card":"Strength","message":"Stay patient and consistent."}]`,
};
