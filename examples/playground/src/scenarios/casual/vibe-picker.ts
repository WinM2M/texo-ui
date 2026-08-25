import type { Scenario } from '../../utils/stream-simulator';

export const vibePickerScenario: Scenario = {
  id: 'vibe-picker',
  name: 'Vibe Picker',
  systemPrompt:
    'Generate a preference picker with button and chart. Apply a dark-theme preset.',
  content: `Choose your interior vibe

:> theme
 - preset: "midnight-dark"

:> grid
 - title: "Select up to 2 vibes"
 - columns: 2

:> button
 - label: "Minimal"
 - action: "pick-minimal"
 - variant: "secondary"

:> button
 - label: "Vintage"
 - action: "pick-vintage"
 - variant: "secondary"

:> button
 - label: "Modern"
 - action: "pick-modern"
 - variant: "secondary"

:> button
 - label: "Natural"
 - action: "pick-natural"
 - variant: "secondary"

:> chart
 - chartType: "donut"
 - labels: ["Minimal","Vintage","Modern","Natural"]
 - series: [{"name":"votes","values":[16,9,13,7]}]`,
};
