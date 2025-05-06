'use client';

import { useState, useRef, useEffect } from 'react';

interface ImageCaptureProps {
  onImageCaptured: (imageData: Blob | string) => void;
  onError: (error: string) => void;
}

export default function ImageCapture({ onImageCaptured, onError }: ImageCaptureProps) {
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [isCapturing, setIsCapturing] = useState(false);
  const [imageStats, setImageStats] = useState<{ size: number; width: number; height: number } | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, [stream]);

  useEffect(() => {
    if (stream && videoRef.current) {
      videoRef.current.srcObject = stream;
      videoRef.current.onloadedmetadata = () => {
        videoRef.current?.play().catch(error => {
          console.error('Error playing video:', error);
          onError('Failed to start video feed. Please try again.');
        });
      };
    }
  }, [stream]);

  const startCamera = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({ 
        video: { 
          width: { ideal: 1280 },
          height: { ideal: 720 },
          facingMode: 'user'
        } 
      });
      setStream(mediaStream);
      setIsCapturing(true);
    } catch (error) {
      console.error('Camera access error:', error);
      onError('Failed to access camera. Please make sure you have granted camera permissions.');
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
    setIsCapturing(false);
  };

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const compressedBlob = await compressImage(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64data = reader.result as string;
        setCapturedImage(base64data);
        setImageStats({
          size: compressedBlob.size,
          width: 0, // Will be updated when image loads
          height: 0,
        });
      };
      reader.readAsDataURL(compressedBlob);
    } catch (error) {
      onError('Failed to process the selected image.');
    }
  };

  const captureImage = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      const context = canvas.getContext('2d');

      if (context) {
        // Set canvas dimensions to match video
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        context.drawImage(video, 0, 0, canvas.width, canvas.height);

        // Get the image data and compress it
        canvas.toBlob(
          async (blob) => {
            if (blob) {
              const compressedBlob = await compressImage(blob);
              const reader = new FileReader();
              reader.onloadend = () => {
                const base64data = reader.result as string;
                setCapturedImage(base64data);
                setImageStats({
                  size: compressedBlob.size,
                  width: canvas.width,
                  height: canvas.height,
                });
              };
              reader.readAsDataURL(compressedBlob);
            }
          },
          'image/jpeg',
          0.7
        );
      }
    }
  };

  const compressImage = async (input: Blob | File): Promise<Blob> => {
    return new Promise((resolve) => {
      const img = new Image();
      img.src = URL.createObjectURL(input);
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;
        let quality = 0.7;

        // Calculate dimensions to maintain aspect ratio
        const maxDimension = 800;
        if (width > height && width > maxDimension) {
          height = Math.round((height * maxDimension) / width);
          width = maxDimension;
        } else if (height > maxDimension) {
          width = Math.round((width * maxDimension) / height);
          height = maxDimension;
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx?.drawImage(img, 0, 0, width, height);

        // Adjust quality until size is under 40KB
        const compressWithQuality = (q: number) => {
          canvas.toBlob(
            (blob) => {
              if (blob) {
                if (blob.size > 40 * 1024 && q > 0.1) {
                  // If still too large and quality can be reduced, try again
                  compressWithQuality(q - 0.1);
                } else {
                  resolve(blob);
                }
              } else {
                resolve(input);
              }
            },
            'image/jpeg',
            q
          );
        };

        compressWithQuality(quality);
      };
    });
  };

  const usePhoto = async () => {
    if (!capturedImage) return;
    // If capturedImage is base64, convert to Blob for consistency
    const response = await fetch(capturedImage);
    const blob = await response.blob();
    onImageCaptured(blob);
    stopCamera();
  };

  const retakePhoto = () => {
    setCapturedImage(null);
    setImageStats(null);
    startCamera();
  };

  return (
    <div className="space-y-4">
      {!isCapturing && !capturedImage && (
        <div className="space-y-4">
          <button
            onClick={startCamera}
            className="btn-primary w-full"
          >
            Start Camera
          </button>
          <div className="relative">
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileSelect}
              accept="image/*"
              className="hidden"
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              className="btn-secondary w-full"
            >
              Upload Photo
            </button>
          </div>
        </div>
      )}

      {isCapturing && !capturedImage && (
        <div className="space-y-4">
          <div className="relative aspect-video bg-gray-800 rounded-lg overflow-hidden">
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-full object-cover"
              style={{ transform: 'scaleX(-1)' }} // Mirror the video feed
            />
            <canvas ref={canvasRef} className="hidden" />
          </div>
          <div className="flex space-x-4">
            <button
              onClick={captureImage}
              className="btn-primary flex-1"
            >
              Capture Photo
            </button>
            <button
              onClick={stopCamera}
              className="btn-secondary flex-1"
            >
              Stop Camera
            </button>
          </div>
        </div>
      )}

      {capturedImage && (
        <div className="space-y-4">
          <div className="relative aspect-video bg-gray-800 rounded-lg overflow-hidden">
            <img
              src={capturedImage}
              alt="Captured"
              className="w-full h-full object-cover"
              onLoad={(e) => {
                const img = e.target as HTMLImageElement;
                setImageStats(prev => prev ? {
                  ...prev,
                  width: img.naturalWidth,
                  height: img.naturalHeight
                } : null);
              }}
            />
          </div>
          {imageStats && (
            <div className="text-sm text-gray-300 bg-gray-800/50 p-3 rounded-lg">
              <p>Size: {(imageStats.size / 1024).toFixed(2)} KB</p>
              <p>Dimensions: {imageStats.width} x {imageStats.height}</p>
            </div>
          )}
          <div className="flex space-x-4">
            <button
              onClick={retakePhoto}
              className="btn-secondary flex-1"
            >
              Retake Photo
            </button>
            <button
              onClick={usePhoto}
              className="btn-primary flex-1"
              disabled={!capturedImage}
            >
              Use Photo
            </button>
          </div>
        </div>
      )}
    </div>
  );
} 