import React, { useCallback, useState } from 'react';
import { Upload, X, Image as ImageIcon } from 'lucide-react';
import toast from 'react-hot-toast';

export interface ImageFile {
  file: File;
  preview: string;
  isPrimary: boolean;
}

interface ImageUploadProps {
  images: ImageFile[];
  onImagesChange: (images: ImageFile[]) => void;
  maxImages?: number;
  maxSizeMB?: number;
}

const ImageUpload: React.FC<ImageUploadProps> = ({ 
  images, 
  onImagesChange, 
  maxImages = 6,
  maxSizeMB = 5 
}) => {
  const [isDragging, setIsDragging] = useState(false);

  const validateImage = (file: File): boolean => {
    // Check file type
    if (!file.type.startsWith('image/')) {
      toast.error(`${file.name} is not an image file`);
      return false;
    }

    // Check file size
    const sizeMB = file.size / (1024 * 1024);
    if (sizeMB > maxSizeMB) {
      toast.error(`${file.name} is too large. Max size is ${maxSizeMB}MB`);
      return false;
    }

    return true;
  };

  const processFiles = useCallback((files: FileList | File[]) => {
    const fileArray = Array.from(files);
    
    if (images.length + fileArray.length > maxImages) {
      toast.error(`You can only upload up to ${maxImages} images`);
      return;
    }

    const validFiles = fileArray.filter(validateImage);
    
    const newImages: ImageFile[] = validFiles.map((file, index) => ({
      file,
      preview: URL.createObjectURL(file),
      isPrimary: images.length === 0 && index === 0
    }));

    onImagesChange([...images, ...newImages]);
    
    if (validFiles.length > 0) {
      toast.success(`${validFiles.length} image${validFiles.length > 1 ? 's' : ''} added`);
    }
  }, [images, maxImages, onImagesChange, maxSizeMB]);

  const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      processFiles(files);
    }
  }, [processFiles]);

  const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      processFiles(files);
    }
    // Reset input value to allow selecting the same file again
    e.target.value = '';
  }, [processFiles]);

  const removeImage = useCallback((index: number) => {
    const newImages = images.filter((_, i) => i !== index);
    
    // If we removed the primary image and there are still images, make the first one primary
    if (images[index].isPrimary && newImages.length > 0) {
      newImages[0].isPrimary = true;
    }
    
    // Revoke the object URL to free memory
    URL.revokeObjectURL(images[index].preview);
    
    onImagesChange(newImages);
    toast.success('Image removed');
  }, [images, onImagesChange]);

  const setPrimaryImage = useCallback((index: number) => {
    const newImages = images.map((img, i) => ({
      ...img,
      isPrimary: i === index
    }));
    onImagesChange(newImages);
    toast.success('Primary image updated');
  }, [images, onImagesChange]);

  return (
    <div className="space-y-4">
      {/* Drop Zone */}
      <div
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        className={`relative border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
          isDragging
            ? 'border-purple-500 bg-purple-50'
            : 'border-gray-300 hover:border-gray-400 bg-gray-50'
        }`}
      >
        <input
          type="file"
          id="image-upload"
          multiple
          accept="image/*"
          onChange={handleFileInput}
          className="hidden"
        />
        
        <label
          htmlFor="image-upload"
          className="cursor-pointer flex flex-col items-center space-y-3"
        >
          <div className={`p-4 rounded-full ${isDragging ? 'bg-purple-100' : 'bg-gray-200'}`}>
            <Upload className={`h-8 w-8 ${isDragging ? 'text-purple-600' : 'text-gray-500'}`} />
          </div>
          
          <div>
            <p className="text-lg font-medium text-gray-700">
              {isDragging ? 'Drop images here' : 'Drag & drop images here'}
            </p>
            <p className="text-sm text-gray-500 mt-1">
              or click to browse (max {maxImages} images, {maxSizeMB}MB each)
            </p>
          </div>
          
          <button
            type="button"
            className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
          >
            Select Images
          </button>
        </label>
      </div>

      {/* Image Preview Grid */}
      {images.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {images.map((image, index) => (
            <div key={index} className="relative group">
              <div className="aspect-square rounded-lg overflow-hidden border-2 border-gray-200 bg-gray-100">
                <img
                  src={image.preview}
                  alt={`Upload ${index + 1}`}
                  className="w-full h-full object-cover"
                />
              </div>
              
              {/* Primary Badge */}
              {image.isPrimary && (
                <div className="absolute top-2 left-2 bg-green-500 text-white text-xs px-2 py-1 rounded-full font-semibold shadow-md">
                  Primary
                </div>
              )}
              
              {/* Action Buttons */}
              <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-40 transition-all rounded-lg flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100">
                {!image.isPrimary && (
                  <button
                    type="button"
                    onClick={() => setPrimaryImage(index)}
                    className="p-2 bg-white text-gray-700 rounded-full hover:bg-gray-100 transition-colors shadow-md"
                    title="Set as primary"
                  >
                    <ImageIcon className="h-4 w-4" />
                  </button>
                )}
                
                <button
                  type="button"
                  onClick={() => removeImage(index)}
                  className="p-2 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors shadow-md"
                  title="Remove image"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
              
              {/* Image number */}
              <div className="absolute bottom-2 right-2 bg-black bg-opacity-60 text-white text-xs px-2 py-1 rounded">
                {index + 1}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Helper Text */}
      {images.length > 0 && (
        <p className="text-sm text-gray-600 text-center">
          {images.length} / {maxImages} images uploaded
          {images.length < maxImages && ` • You can add ${maxImages - images.length} more`}
        </p>
      )}
    </div>
  );
};

export default ImageUpload;
