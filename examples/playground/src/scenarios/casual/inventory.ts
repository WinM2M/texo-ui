import type { Scenario } from '../../utils/stream-simulator';

export const inventoryScenario: Scenario = {
  id: 'inventory',
  name: 'RPG Inventory',
  systemPrompt:
    'Generate inventory management UI using table, button, chart. Apply a dark-theme preset.',
  content: `Manage your inventory

:> table
 - columns: ["item","qty","rarity"]
 - rows: [{"item":"Health Potion","qty":3,"rarity":"common"},{"item":"Flame Sword","qty":1,"rarity":"legendary"},{"item":"Mana Elixir","qty":5,"rarity":"rare"}]

:> button
 - label: "Use Potion"
 - action: "use-potion"
 - variant: "primary"

:> button
 - label: "Inspect Sword"
 - action: "inspect-sword"
 - variant: "secondary"

:> chart
 - chartType: "bar"
 - labels: ["Common","Rare","Legendary"]
 - series: [{"name":"items","values":[10,6,2]}]`,
};
