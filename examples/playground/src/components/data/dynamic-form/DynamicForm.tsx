import { useMemo, useState } from 'react';
import type { DirectiveComponentProps } from '../../shared';
import { useDirectiveAction } from '../../shared';
import { evaluateCondition } from './ConditionEvaluator';
import type { DynamicField, DynamicFormAttributes } from './types';

function Field({
  field,
  value,
  onChange,
}: {
  field: DynamicField;
  value: unknown;
  onChange: (value: unknown) => void;
}): JSX.Element {
  if (field.type === 'textarea') {
    return (
      <textarea
        rows={field.rows ?? 4}
        value={String(value ?? '')}
        onChange={(e) => onChange(e.target.value)}
      />
    );
  }
  if (field.type === 'select') {
    return (
      <select value={String(value ?? '')} onChange={(e) => onChange(e.target.value)}>
        <option value="">Select</option>
        {(field.options ?? []).map((opt) => (
          <option key={opt}>{opt}</option>
        ))}
      </select>
    );
  }
  if (field.type === 'checkbox' || field.type === 'toggle') {
    return (
      <input
        type="checkbox"
        checked={Boolean(value)}
        onChange={(e) => onChange(e.target.checked)}
      />
    );
  }
  return (
    <input
      type={field.type === 'number' ? 'number' : field.type === 'date' ? 'date' : 'text'}
      value={String(value ?? '')}
      onChange={(e) => onChange(e.target.value)}
      readOnly={field.readonly}
    />
  );
}

export function DynamicForm({
  attributes,
  onAction,
}: DirectiveComponentProps<DynamicFormAttributes>): JSX.Element {
  const emit = useDirectiveAction(onAction);
  const initialValues = useMemo(() => {
    const map: Record<string, unknown> = {};
    for (const section of attributes.sections ?? []) {
      for (const field of section.fields) {
        map[field.name] = field.value ?? '';
      }
    }
    return map;
  }, [attributes.sections]);
  const [values, setValues] = useState<Record<string, unknown>>(initialValues);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const submit = (): void => {
    const nextErrors: Record<string, string> = {};
    for (const key of attributes.validation?.required ?? []) {
      if (!values[key]) {
        nextErrors[key] = 'Required';
      }
    }
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length === 0) {
      emit({ type: 'submit', directive: 'dynamic-form', value: values });
    }
  };

  return (
    <section style={{ border: '1px solid #ddd', borderRadius: 12, padding: 16 }}>
      <h3>{attributes.title ?? 'Dynamic Form'}</h3>
      <p>{attributes.description}</p>
      {(attributes.sections ?? [])
        .filter((section) => evaluateCondition(section.condition, values))
        .map((section) => (
          <fieldset key={section.title} style={{ marginBottom: 14 }}>
            <legend>{section.title}</legend>
            {section.fields
              .filter((field) => evaluateCondition(field.condition, values))
              .map((field) => (
                <label key={field.name} style={{ display: 'grid', marginBottom: 8 }}>
                  {field.label}
                  <Field
                    field={field}
                    value={values[field.name]}
                    onChange={(value) => setValues((prev) => ({ ...prev, [field.name]: value }))}
                  />
                  {errors[field.name] ? (
                    <small style={{ color: '#dc2626' }}>{errors[field.name]}</small>
                  ) : null}
                </label>
              ))}
          </fieldset>
        ))}
      <button type="button" onClick={submit}>
        Submit
      </button>
    </section>
  );
}
