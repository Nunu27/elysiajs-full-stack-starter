import { Button } from '@frontend/components/ui/button';
import { useRouter } from '@tanstack/react-router';
import { HomeIcon, ArrowLeftIcon } from 'lucide-react';

function NotFoundPage() {
  const router = useRouter();

  const handleGoBack = () => {
    router.history.back();
  };

  const handleGoHome = () => {
    router.navigate({ to: '/' });
  };

  return (
    <div className="relative flex min-h-svh flex-col items-center justify-center overflow-hidden bg-linear-to-br from-background via-muted/30 to-background p-6">
      <div className="relative z-10 w-full max-w-2xl text-center space-y-8">
        {/* Main 404 Display */}
        <div className="space-y-4">
          <div className="text-[12rem] md:text-[16rem] font-bold leading-none bg-linear-to-br from-primary via-primary/80 to-primary/60 bg-clip-text text-transparent drop-shadow-2xl">
            404
          </div>

          <div className="space-y-2">
            <h1 className="text-3xl md:text-4xl font-bold tracking-tight">
              Page Not Found
            </h1>
            <p className="text-muted-foreground text-lg md:text-xl max-w-md mx-auto">
              The page you are looking for does not exist or has been moved to a
              different location.
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center pt-4">
          <Button
            onClick={handleGoBack}
            variant="outline"
            size="lg"
            className="w-full sm:w-auto"
          >
            <ArrowLeftIcon />
            Go Back
          </Button>
          <Button onClick={handleGoHome} size="lg" className="w-full sm:w-auto">
            <HomeIcon />
            Go to Home
          </Button>
        </div>

        {/* Additional helpful text */}
        <p className="text-muted-foreground text-sm pt-8">
          If you believe this is an error, please contact support.
        </p>
      </div>
    </div>
  );
}

export default NotFoundPage;
