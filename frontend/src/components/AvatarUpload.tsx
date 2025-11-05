import { useRef, useState } from 'react';
import type { ChangeEvent } from 'react';

interface AvatarUploadProps {
  currentAvatar?: string | null;
  onUpload: (base64Image: string) => Promise<void>;
  size?: 'sm' | 'md' | 'lg';
}

export default function AvatarUpload({ currentAvatar, onUpload, size = 'lg' }: AvatarUploadProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState<string | null>(currentAvatar || null);
  const [error, setError] = useState<string | null>(null);

  const sizeClasses = {
    sm: 'w-16 h-16',
    md: 'w-24 h-24',
    lg: 'w-32 h-32'
  };

  const iconSizes = {
    sm: 'w-6 h-6',
    md: 'w-8 h-8',
    lg: 'w-12 h-12'
  };

  const handleFileSelect = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setError('Please select an image file');
      return;
    }

    // Validate file size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      setError('Image size must be less than 2MB');
      return;
    }

    setError(null);
    setUploading(true);

    try {
      // Convert image to base64
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64String = reader.result as string;
        setPreview(base64String);

        try {
          await onUpload(base64String);
        } catch {
          setError('Failed to upload avatar');
          setPreview(currentAvatar || null);
        } finally {
          setUploading(false);
        }
      };
      reader.readAsDataURL(file);
    } catch {
      setError('Failed to process image');
      setUploading(false);
    }
  };

  const handleButtonClick = () => {
    fileInputRef.current?.click();
  };

  const getInitials = () => {
    // Return default initials if no avatar
    return '?';
  };

  return (
    <div className="flex flex-col items-center gap-3">
      <div className="relative group">
        {/* Avatar Display */}
        <div
          className={`${sizeClasses[size]} rounded-full overflow-hidden border-4 border-white dark:border-gray-700 shadow-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center cursor-pointer transition-all hover:scale-105 hover:shadow-2xl`}
          onClick={handleButtonClick}
        >
          {preview ? (
            <img
              src={preview}
              alt="Avatar"
              className="w-full h-full object-cover"
            />
          ) : (
            <span className="text-white font-bold text-2xl">{getInitials()}</span>
          )}

          {uploading && (
            <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-4 border-white border-t-transparent"></div>
            </div>
          )}
        </div>

        {/* Upload Overlay on Hover */}
        <div
          className="absolute inset-0 rounded-full bg-black bg-opacity-0 group-hover:bg-opacity-40 transition-all flex items-center justify-center cursor-pointer"
          onClick={handleButtonClick}
        >
          <svg
            className={`${iconSizes[size]} text-white opacity-0 group-hover:opacity-100 transition-opacity`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"
            />
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"
            />
          </svg>
        </div>

        {/* Hidden File Input */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileSelect}
          className="hidden"
        />
      </div>

      {/* Upload Button */}
      <button
        onClick={handleButtonClick}
        disabled={uploading}
        className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-400 text-white rounded-lg font-medium transition-colors text-sm"
      >
        {uploading ? 'Uploading...' : 'Change Avatar'}
      </button>

      {/* Error Message */}
      {error && (
        <p className="text-red-600 dark:text-red-400 text-sm">{error}</p>
      )}

      {/* Help Text */}
      <p className="text-gray-500 dark:text-gray-400 text-xs text-center">
        Supports JPG, PNG, GIF (max 2MB)
      </p>
    </div>
  );
}
