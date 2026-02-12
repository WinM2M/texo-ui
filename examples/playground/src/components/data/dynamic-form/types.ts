export interface DynamicField {
  name: string;
  label: string;
  type:
    | 'text'
    | 'number'
    | 'select'
    | 'date'
    | 'textarea'
    | 'file'
    | 'checkbox'
    | 'radio'
    | 'toggle';
  value?: unknown;
  options?: string[];
  readonly?: boolean;
  rows?: number;
  condition?: string;
}

export interface DynamicSection {
  title: string;
  condition?: string;
  fields: DynamicField[];
}

export interface DynamicFormAttributes {
  title?: string;
  description?: string;
  sections: DynamicSection[];
  validation?: { required?: string[] };
}
