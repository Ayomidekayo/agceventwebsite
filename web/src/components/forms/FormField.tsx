import type { ChangeEvent, HTMLInputTypeAttribute } from 'react';

export type FormFieldOption = string | { value: string; label: string };

type FormFieldProps = {
  label: string;
  name: string;
  value: string;
  onChange: (value: string) => void;
  type?: HTMLInputTypeAttribute;
  required?: boolean;
  placeholder?: string;
  options?: FormFieldOption[];
  full?: boolean;
};

export default function FormField({
  label,
  name,
  value,
  onChange,
  type = 'text',
  required = false,
  placeholder,
  options,
  full = false,
}: FormFieldProps) {
  const id = `field-${name}`;
  const handleInput = (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    onChange(event.target.value);
  };

  return (
    <label className={`field ${full ? 'field-full' : ''}`} htmlFor={id}>
      <span>{label}{required && <b aria-hidden="true"> *</b>}</span>
      {options ? (
        <select id={id} name={name} value={value} onChange={handleInput} required={required}>
          <option value="">Select an option</option>
          {options.map((option) => {
            const optionValue = typeof option === 'string' ? option : option.value;
            const optionLabel = typeof option === 'string' ? option : option.label;
            return <option key={optionValue} value={optionValue}>{optionLabel}</option>;
          })}
        </select>
      ) : type === 'textarea' ? (
        <textarea id={id} name={name} value={value} onChange={handleInput} required={required} placeholder={placeholder} rows={4} />
      ) : (
        <input
          id={id}
          name={name}
          value={value}
          onChange={handleInput}
          type={type}
          required={required}
          placeholder={placeholder}
          autoComplete={name === 'email' ? 'email' : name === 'phone' ? 'tel' : name === 'fullName' ? 'name' : 'on'}
        />
      )}
    </label>
  );
}
