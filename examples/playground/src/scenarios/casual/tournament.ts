import type { Scenario } from '../../utils/stream-simulator';

export const tournamentScenario: Scenario = {
  id: 'tournament',
  name: 'Lunch Tournament',
  systemPrompt:
    'Generate a lunch vote flow with stack, input, button, table. Apply a dark-theme preset.',
  content: `Lunch decision round

:> theme
 - preset: "midnight-dark"

:> stack
 - title: "Lunch Tournament Lite"
 - direction: "column"
 - gap: 12

:> input
 - label: "Candidate A"
 - name: "candidateA"
 - placeholder: "Bibimbap"

:> input
 - label: "Candidate B"
 - name: "candidateB"
 - placeholder: "Kalguksu"

:> button
 - label: "Vote Candidate A"
 - action: "vote-a"
 - variant: "primary"

:> button
 - label: "Vote Candidate B"
 - action: "vote-b"
 - variant: "secondary"

:> table
 - columns: ["option","votes"]
 - rows: [{"option":"Candidate A","votes":12},{"option":"Candidate B","votes":9}]`,
  chunkDelay: 30,
  chunkSize: 5,
};
