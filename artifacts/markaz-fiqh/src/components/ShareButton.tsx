import { Share2 } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';

type ShareButtonProps = {
  title: string;
  url?: string;
};

export function ShareButton({ title, url }: ShareButtonProps) {
  const handleClick = async () => {
    const target = url ?? window.location.href;
    if (navigator.share) {
      try {
        await navigator.share({ title, url: target });
      } catch (err) {
        if (err instanceof Error && err.name === 'AbortError') return;
        // other errors: fall through silently
      }
    } else {
      await navigator.clipboard.writeText(target);
      toast.success('Link disalin ke clipboard');
    }
  };

  return (
    <Button variant="outline" size="sm" onClick={handleClick} aria-label="Bagikan">
      <Share2 className="h-4 w-4 sm:mr-1.5" />
      <span className="hidden sm:inline">Bagikan</span>
    </Button>
  );
}
