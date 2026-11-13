import { Smartphone } from 'lucide-react';
import { EmptyState, PageHeader } from './kit';

/** Placeholder for app features whose web pages are still being built in this revamp. */
export default function WebSoon({ title, message }: { title: string; message?: string }) {
  return (
    <div className="flex flex-col gap-6">
      <PageHeader title={title} />
      <EmptyState
        icon={Smartphone}
        title="Coming to the web"
        message={message ?? 'This is available in the Gymmigo app today and is arriving on the web shortly.'}
        actionLabel="Back to Home"
        actionTo="/app/dashboard"
      />
    </div>
  );
}
