import { cloneElement, isValidElement, useId } from 'react';

export function Field({ label, children }) {
  const generatedId = useId();
  const fieldId = isValidElement(children) && children.props.id ? children.props.id : generatedId;
  const control = isValidElement(children)
    ? cloneElement(children, {
        id: fieldId,
        'aria-label': children.props['aria-label'] || label,
      })
    : children;

  return (
    <label className="field" htmlFor={fieldId}>
      <span>{label}</span>
      {control}
    </label>
  );
}
