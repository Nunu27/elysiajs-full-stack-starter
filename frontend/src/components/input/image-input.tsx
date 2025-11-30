'use client';

import { useState } from 'react';
import {
  useFileUpload,
  type FileMetadata,
  type FileWithPreview,
} from '@frontend/hooks/use-file-upload';

import { Button } from '@frontend/components/ui/button';
import { FieldError } from '@frontend/components/ui/field';
import { CloudUpload, ImageIcon, Upload, XIcon } from 'lucide-react';
import { cn } from '@frontend/lib/utils';

interface ImageInputProps {
  maxSize?: number;
  accept?: string;
  className?: string;
  onImageChange?: (file: File | FileMetadata | null) => void;
  initialFile?: FileMetadata | null;
  placeholder?: React.ReactNode;
  errors?: Array<{ message?: string } | undefined> | undefined;
  onError?: (errors: string[]) => void;
}

export default function ImageInput({
  maxSize = 5 * 1024 * 1024, // 5MB default
  accept = 'image/*',
  className,
  onImageChange,
  initialFile,
  placeholder,
  errors: propErrors,
  onError,
}: ImageInputProps) {
  const [image, setImage] = useState<FileWithPreview | null>(
    initialFile
      ? { id: initialFile.id, file: initialFile, preview: initialFile.url }
      : null,
  );

  const [imageLoading, setImageLoading] = useState(true);

  const [
    { isDragging },
    {
      handleDragEnter,
      handleDragLeave,
      handleDragOver,
      handleDrop,
      openFileDialog,
      getInputProps,
    },
  ] = useFileUpload({
    maxFiles: 1,
    maxSize,
    accept,
    multiple: false,
    initialFiles: initialFile ? [initialFile] : [],
    onFilesChange: (files) => {
      if (files.length > 0) {
        setImageLoading(true);
        setImage(files[0]);
        onImageChange?.(files[0].file ?? null);
      }
    },
    onError,
  });

  const removeImage = () => {
    setImage(null);
    setImageLoading(false);
    onImageChange?.(null);
  };

  const hasImage = Boolean(image);

  return (
    <div className={cn('w-full', className)}>
      <div
        className={cn(
          'group relative overflow-hidden rounded-md transition-all duration-200 border border-border',
          isDragging
            ? 'border-dashed border-primary bg-primary/5'
            : hasImage
              ? 'border-border bg-background hover:border-primary/50'
              : 'border-dashed border-muted-foreground/25 bg-muted/30 hover:border-primary hover:bg-primary/5',
          propErrors &&
            propErrors.length > 0 &&
            'aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive',
        )}
        aria-invalid={propErrors && propErrors.length > 0}
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
      >
        <input
          {...getInputProps({ 'aria-label': 'Select image file' })}
          className="sr-only"
        />

        {hasImage ? (
          <div className="relative aspect-square w-full">
            {imageLoading && (
              <div className="absolute inset-0 animate-pulse bg-muted flex items-center justify-center">
                <div className="flex flex-col items-center gap-2 text-muted-foreground">
                  <ImageIcon className="size-5" />
                </div>
              </div>
            )}

            <img
              src={image?.preview}
              alt="Uploaded"
              className={cn(
                'h-full w-full object-cover transition-opacity duration-300',
                imageLoading ? 'opacity-0' : 'opacity-100',
              )}
              onLoad={() => setImageLoading(false)}
              onError={() => setImageLoading(false)}
            />

            <div className="absolute inset-0 bg-black/0 transition-all duration-200 group-hover:bg-black/40" />

            <div className="absolute inset-0 flex items-center justify-center opacity-0 transition-opacity duration-200 group-hover:opacity-100">
              <div className="flex gap-2">
                <Button
                  onClick={() => {
                    openFileDialog();
                  }}
                  variant="secondary"
                  size="sm"
                  type="button"
                  className="bg-white/90 text-gray-900 hover:bg-white"
                >
                  <Upload />
                  Change
                </Button>
                <Button onClick={removeImage} variant="destructive" size="sm">
                  <XIcon />
                </Button>
              </div>
            </div>
          </div>
        ) : (
          <div
            className="flex aspect-square w-full cursor-pointer flex-col items-center justify-center gap-4 p-4 text-center"
            onClick={() => {
              openFileDialog();
            }}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ' || e.key === 'Spacebar') {
                e.preventDefault();
                openFileDialog();
              }
            }}
          >
            <div className="rounded-full bg-primary/10 p-3">
              <CloudUpload className="size-8 text-primary" />
            </div>
            <div className="space-y-2">
              <h3 className="text-sm font-semibold">
                {placeholder ?? 'Upload Image'}
              </h3>
            </div>
          </div>
        )}
      </div>

      {propErrors && propErrors.length > 0 && (
        <FieldError className="mt-3" errors={propErrors} />
      )}
    </div>
  );
}
