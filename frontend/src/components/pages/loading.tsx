import { Spinner } from '@frontend/components/ui/spinner';

interface LoadingPageProps {
  message?: string;
}

function LoadingPage({ message = 'Loading...' }: LoadingPageProps) {
  return (
    <div className="flex h-full w-full flex-col items-center justify-center p-6 gap-6">
      <Spinner className="size-10 text-primary" />
      <p className="text-foreground font-medium">{message}</p>
    </div>
  );
}

export default LoadingPage;
