import { CheckCircle2, CircleAlert, Info } from 'lucide-react';

export type Notice = {
  kind: 'success' | 'error' | 'info';
  text: string;
};

type NoticeBoxProps = { notice: Notice | null };

export default function NoticeBox({ notice }: NoticeBoxProps) {
  if (!notice) return null;
  const Icon = notice.kind === 'success' ? CheckCircle2 : notice.kind === 'error' ? CircleAlert : Info;
  return (
    <div className={`notice notice-${notice.kind}`} role={notice.kind === 'error' ? 'alert' : 'status'} aria-live="polite">
      <Icon size={18} aria-hidden="true" />
      <span>{notice.text}</span>
    </div>
  );
}
