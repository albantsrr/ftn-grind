import { useState, useEffect } from 'react';

interface ImageSelectorProps {
  currentImage: string;
  onImageChange: (imageUrl: string) => void;
}

export default function ImageSelector({ currentImage, onImageChange }: ImageSelectorProps) {
  const [previewUrl, setPreviewUrl] = useState(currentImage);
  const [fileName, setFileName] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  // Update preview when currentImage prop changes
  useEffect(() => {
    setPreviewUrl(currentImage);
    if (currentImage !== '/default_image.jpg') {
      setFileName('Custom image');
    }
  }, [currentImage]);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setIsUploading(true);
      setFileName(file.name);

      // Read file as base64
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64 = reader.result as string;
        // Update preview
        setPreviewUrl(base64);
        // Send base64 to parent component to store in database
        onImageChange(base64);
        setIsUploading(false);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleReset = () => {
    setPreviewUrl('/default_image.jpg');
    onImageChange('/default_image.jpg');
    setFileName(null);
  };

  return (
    <div className="space-y-3">
      <div className="flex items-start gap-6">
        {/* Image Preview */}
        <div className="relative w-40 h-40 rounded-xl overflow-hidden bg-gradient-to-br from-gray-200 to-gray-300 dark:from-gray-700 dark:to-gray-600 flex-shrink-0 shadow-md">
          <img
            src={previewUrl}
            alt="Routine"
            className="w-full h-full object-cover"
            onError={(e) => {
              // Fallback to default image if URL is invalid
              (e.target as HTMLImageElement).src = '/default_image.jpg';
            }}
          />
          {isUploading && (
            <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
            </div>
          )}
        </div>

        {/* Controls */}
        <div className="flex-1 space-y-3">
          <label className="block">
            <input
              type="file"
              accept="image/*"
              onChange={handleFileSelect}
              className="hidden"
              id="image-upload"
              disabled={isUploading}
            />
            <span className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white px-5 py-2.5 rounded-lg font-medium cursor-pointer transition-all shadow-md hover:shadow-lg text-sm">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              {isUploading ? 'Uploading...' : 'Choose Image'}
            </span>
          </label>

          {/* Success Feedback */}
          {fileName && !isUploading && (
            <div className="flex items-center gap-2 text-green-600 dark:text-green-400 text-sm bg-green-50 dark:bg-green-900/20 px-3 py-2 rounded-lg">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <span className="font-medium truncate">{fileName}</span>
            </div>
          )}

          {previewUrl !== '/default_image.jpg' && (
            <button
              type="button"
              onClick={handleReset}
              className="flex items-center gap-2 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-200 px-4 py-2 rounded-lg font-medium transition-colors text-sm"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Reset to Default
            </button>
          )}

          <p className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Recommended: Square image, min 300x300px
          </p>
        </div>
      </div>
    </div>
  );
}
