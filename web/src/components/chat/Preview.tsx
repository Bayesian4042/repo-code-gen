import { useRef } from 'react';
import { Button } from '@/components/ui/button';

interface PreviewProps {
  previewUrl: string | null;
  previewLoading: boolean;
  previewError: string | null;
  onRefresh: () => void;
  onStartPreview: () => void;
  hasGeneratedFiles: boolean;
}

export function Preview({
  previewUrl,
  previewLoading,
  previewError,
  onRefresh,
  onStartPreview,
  hasGeneratedFiles
}: PreviewProps) {
  const iframeRef = useRef<HTMLIFrameElement>(null);

  if (previewLoading) {
    return (
      <div className="absolute inset-0 flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="mb-2">Starting preview server...</div>
          <div className="animate-pulse">This may take a moment</div>
        </div>
      </div>
    );
  }

  if (previewError) {
    return (
      <div className="absolute inset-0 flex items-center justify-center bg-red-50 p-6 text-red-800">
        <div className="text-center max-w-md">
          <h3 className="text-lg font-medium mb-2">Preview Error</h3>
          <p className="mb-4">{previewError}</p>
          <Button 
            onClick={onStartPreview}
            size="sm"
            className="bg-red-600 hover:bg-red-700 text-white"
          >
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  if (previewUrl) {
    return (
      <div className="h-full flex flex-col">
        <div className="bg-gray-100 border-b border-gray-200 px-4 py-2 text-sm font-medium flex justify-between items-center">
          <span>Live Preview</span>
          <Button 
            onClick={onRefresh}
            size="sm"
            variant="outline"
          >
            Refresh
          </Button>
        </div>
        <div className="flex-1 relative">
          <iframe
            ref={iframeRef}
            src={previewUrl}
            className="w-full h-full border-none"
            title="Application Preview"
            sandbox="allow-forms allow-modals allow-popups allow-presentation allow-same-origin allow-scripts"
          />
        </div>
      </div>
    );
  }

  return (
    <div className="absolute inset-0 flex items-center justify-center bg-gray-50 text-gray-500">
      <div className="text-center max-w-md p-6">
        <h3 className="text-lg font-medium mb-2">No Preview Available</h3>
        <p className="mb-4">Generate and run your code to see a live preview</p>
        {hasGeneratedFiles && (
          <Button 
            onClick={onStartPreview}
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            Start Preview
          </Button>
        )}
      </div>
    </div>
  );
}
