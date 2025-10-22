import { useState } from 'react';

interface ImageSelectorProps {
  currentImage: string;
  onImageChange: (imageUrl: string) => void;
}

export default function ImageSelector({ currentImage, onImageChange }: ImageSelectorProps) {
  const [previewUrl, setPreviewUrl] = useState(currentImage);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Create a local URL for preview
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);

      // For now, we'll store the file name with a prefix
      // In a real app, you'd upload to a server
      onImageChange(`/uploaded/${file.name}`);

      // Store the file in localStorage as base64 for demo purposes
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64 = reader.result as string;
        localStorage.setItem(`routine-image-${file.name}`, base64);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleReset = () => {
    setPreviewUrl('/default_image.jpg');
    onImageChange('/default_image.jpg');
  };

  return (
    <div className="space-y-4">
      <label className="block text-sm font-semibold text-gray-700 dark:text-gray-200 mb-2">
        Routine Image
      </label>

      <div className="flex items-start gap-4">
        {/* Image Preview */}
        <div className="relative w-32 h-32 rounded-lg overflow-hidden bg-gray-200 dark:bg-gray-700 flex-shrink-0">
          <img
            src={previewUrl}
            alt="Routine"
            className="w-full h-full object-cover"
            onError={(e) => {
              // Fallback to default image if URL is invalid
              (e.target as HTMLImageElement).src = '/default_image.jpg';
            }}
          />
        </div>

        {/* Controls */}
        <div className="flex-1 space-y-2">
          <label className="block">
            <input
              type="file"
              accept="image/*"
              onChange={handleFileSelect}
              className="hidden"
              id="image-upload"
            />
            <span className="inline-block bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg font-medium cursor-pointer transition-colors text-sm">
              Choose Image
            </span>
          </label>

          {previewUrl !== '/default_image.jpg' && (
            <button
              type="button"
              onClick={handleReset}
              className="block bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-200 px-4 py-2 rounded-lg font-medium transition-colors text-sm"
            >
              Reset to Default
            </button>
          )}

          <p className="text-xs text-gray-500 dark:text-gray-400">
            Recommended: Square image, min 300x300px
          </p>
        </div>
      </div>
    </div>
  );
}
