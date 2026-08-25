import type { Scenario } from '../../utils/stream-simulator';

export const memeScenario: Scenario = {
  id: 'meme',
  name: 'Meme Editor',
  systemPrompt:
    'Generate a meme caption workflow using input, button, table. Apply a dark-theme preset.',
  content: `Caption board

:> stack
 - title: "Meme Caption Builder"
 - direction: "column"
 - gap: 10

:> input
 - label: "Top text"
 - name: "topText"
 - placeholder: "WHEN BUILD PASSES"

:> input
 - label: "Bottom text"
 - name: "bottomText"
 - placeholder: "ON FRIDAY NIGHT"

:> button
 - label: "Preview Caption"
 - action: "preview-caption"
 - variant: "primary"

:> button
 - label: "Export Meme"
 - action: "export-meme"
 - variant: "secondary"

:> table
 - columns: ["slot","value"]
 - rows: [{"slot":"Top","value":"WHEN BUILD PASSES"},{"slot":"Bottom","value":"ON FRIDAY NIGHT"}]`,
};
