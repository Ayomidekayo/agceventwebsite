import type { ReactNode } from 'react';

type PageIntroProps = { eyebrow: string; title: ReactNode; subtitle: string };

export default function PageIntro({ eyebrow, title, subtitle }: PageIntroProps) {
  return (
    <div className="form-page-intro">
      <div className="eyebrow"><span className="eyebrow-line" /> {eyebrow}</div>
      <h1>{title}</h1>
      <p>{subtitle}</p>
    </div>
  );
}
