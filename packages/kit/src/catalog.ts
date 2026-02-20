import type { CatalogComponent } from './types';

export const BUILTIN_COMPONENT_CATALOG: CatalogComponent[] = [
  {
    name: 'stack',
    summary: 'Linear layout container for arranging child blocks.',
    props: [
      { name: 'direction', type: 'row|column', description: 'Main axis direction.' },
      { name: 'gap', type: 'number', description: 'Gap between child nodes.' },
      { name: 'title', type: 'string', description: 'Optional heading text.' },
    ],
    example: ':> stack\n - direction: "column"\n - gap: 12\n - title: "Profile"',
  },
  {
    name: 'button',
    summary: 'Action trigger button that emits an action payload.',
    props: [
      { name: 'label', type: 'string', required: true, description: 'Visible button text.' },
      { name: 'action', type: 'string', required: true, description: 'Action id to emit.' },
      { name: 'variant', type: 'primary|secondary|ghost', description: 'Visual style.' },
      {
        name: 'selected',
        type: 'boolean',
        description: 'Selection state for toggle-like button UIs.',
      },
      {
        name: 'stylePreset',
        type: 'compact|wide|raised|pill|flat|outline-bold',
        description: 'Optional shape/size/shadow preset.',
      },
    ],
    example:
      ':> button\n - label: "Save"\n - action: "save-form"\n - variant: "primary"\n - stylePreset: "raised"',
  },
  {
    name: 'input',
    summary: 'Labeled input field for text-like values.',
    props: [
      { name: 'label', type: 'string', required: true, description: 'Field label.' },
      { name: 'name', type: 'string', required: true, description: 'Field key.' },
      { name: 'inputType', type: 'text|number|email|date', description: 'HTML input type.' },
    ],
    example: ':> input\n - label: "Email"\n - name: "email"\n - inputType: "email"',
  },
  {
    name: 'checkbox',
    summary: 'Checkbox input that emits toggle action events.',
    props: [
      { name: 'label', type: 'string', required: true, description: 'Checkbox label text.' },
      { name: 'name', type: 'string', required: true, description: 'Field key.' },
      { name: 'checked', type: 'boolean', description: 'Initial checked value.' },
      { name: 'action', type: 'string', description: 'Action id emitted on change.' },
    ],
    example:
      ':> checkbox\n - label: "Receive alerts"\n - name: "alerts"\n - checked: true\n - action: "toggle-alerts"',
  },
  {
    name: 'grid',
    summary: 'Grid layout helper for presenting cards and stats.',
    props: [
      {
        name: 'id',
        type: 'string',
        required: true,
        description: 'Stable grid id for cell mounts.',
      },
      { name: 'rows', type: 'number', required: true, description: 'Number of rows.' },
      { name: 'columns', type: 'number', description: 'Number of columns.' },
      {
        name: 'cells',
        type: 'Array<{id,at,span?}>',
        description: 'Optional span overrides, e.g. {id:"main",at:"2:1",span:"1x8"}.',
      },
      { name: 'title', type: 'string', description: 'Optional heading text.' },
    ],
    example:
      ':> grid\n - id: "overview"\n - rows: 3\n - columns: 12\n - cells: [{"id":"main","at":"2:1","span":"1x8"},{"id":"side","at":"2:9","span":"1x4"}]\n - title: "Overview"',
  },
  {
    name: 'table',
    summary: 'Simple table renderer for row data.',
    props: [
      { name: 'columns', type: 'string[]', required: true, description: 'Ordered column keys.' },
      { name: 'rows', type: 'object[]', required: true, description: 'Data rows.' },
    ],
    example: ':> table\n - columns: ["name", "value"]\n - rows: [{"name":"CPU","value":42}]',
  },
  {
    name: 'chart',
    summary: 'Lightweight chart-like visualization for numeric series.',
    props: [
      {
        name: 'chartType',
        type: 'bar|line|pie|donut',
        required: true,
        description: 'Chart style.',
      },
      { name: 'labels', type: 'string[]', required: true, description: 'X-axis labels.' },
      {
        name: 'series',
        type: 'Array<{name:string,values:number[]}>',
        required: true,
        description: 'Numeric series by label index.',
      },
      {
        name: 'xAxisMode',
        type: 'label|index|date',
        description: 'Line chart x-axis mode.',
      },
      {
        name: 'xEditable',
        type: 'boolean',
        description: 'Enable interactive x-axis controls.',
      },
      {
        name: 'startDate',
        type: 'YYYY-MM-DD',
        description: 'Dataset start date when xAxisMode is date.',
      },
      {
        name: 'rangeStartDate',
        type: 'YYYY-MM-DD',
        description: 'Visible range start date for line chart.',
      },
      {
        name: 'rangeEndDate',
        type: 'YYYY-MM-DD',
        description: 'Visible range end date for line chart.',
      },
      {
        name: 'dayStep',
        type: 'number',
        description: 'Date increment step in days.',
      },
    ],
    example:
      ':> chart\n - chartType: "line"\n - xAxisMode: "date"\n - xEditable: true\n - startDate: "2026-02-01"\n - rangeStartDate: "2026-02-05"\n - rangeEndDate: "2026-02-20"\n - dayStep: 1\n - labels: ["1", "2", "3"]\n - series: [{"name":"Sales","values":[12,18,16]}]',
  },
  {
    name: 'rect',
    summary: 'Draw a simple rectangle block using SVG.',
    props: [
      { name: 'width', type: 'number', description: 'Rectangle width in px.' },
      { name: 'height', type: 'number', description: 'Rectangle height in px.' },
      { name: 'radius', type: 'number', description: 'Corner radius.' },
      { name: 'fill', type: 'string', description: 'Fill color.' },
      { name: 'stroke', type: 'string', description: 'Border color.' },
      { name: 'strokeWidth', type: 'number', description: 'Border thickness.' },
    ],
    example: ':> rect 240x120 #1d4ed8\n - radius: 12\n - stroke: "#93c5fd"\n - strokeWidth: 2',
  },
  {
    name: 'svg',
    summary: 'Render custom SVG shapes from a declarative list.',
    props: [
      { name: 'width', type: 'number', description: 'Rendered max width in px.' },
      { name: 'height', type: 'number', description: 'Rendered minimum height in px.' },
      { name: 'viewBox', type: 'string', description: 'SVG viewBox value.' },
      { name: 'background', type: 'string', description: 'Optional background fill.' },
      {
        name: 'shapes',
        type: 'Array<{type:string,...attrs}>',
        required: true,
        description: 'Supported types: rect,circle,ellipse,line,path,polyline,polygon,text.',
      },
    ],
    example:
      ':> svg 320x180\n - viewBox: "0 0 320 180"\n - shapes: [{"type":"rect","x":20,"y":20,"width":120,"height":80,"rx":10,"fill":"#0ea5e9"},{"type":"text","x":28,"y":66,"fill":"#ffffff","font-size":14,"text":"Hello SVG"}]',
  },
];
