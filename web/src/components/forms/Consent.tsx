import type { ReactNode } from 'react';

type ConsentProps = {
  checked: boolean;
  setChecked: (checked: boolean) => void;
  text: ReactNode;
};

export default function Consent({ checked, setChecked, text }: ConsentProps) {
  return (
    <label className="consent-row">
      <input type="checkbox" checked={checked} onChange={(event) => setChecked(event.target.checked)} required />
      <span>{text}</span>
    </label>
  );
}
