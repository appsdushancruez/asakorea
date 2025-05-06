"use client";
import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function AddStudentPage() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    // ... other fields ...
  });
  const [image, setImage] = useState<File | null>(null);
  const [imageStats, setImageStats] = useState<{ size: number; type: string } | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Compress the image
    const compressedImage = await compressImage(file);
    setImage(compressedImage);
    setImageStats({ size: compressedImage.size, type: compressedImage.type });
  };

  const compressImage = async (file: File): Promise<File> => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (event) => {
        const img = new Image();
        img.src = event.target?.result as string;
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const MAX_WIDTH = 800;
          const MAX_HEIGHT = 800;
          let width = img.width;
          let height = img.height;
          if (width > height) {
            if (width > MAX_WIDTH) {
              height *= MAX_WIDTH / width;
              width = MAX_WIDTH;
            }
          } else {
            if (height > MAX_HEIGHT) {
              width *= MAX_HEIGHT / height;
              height = MAX_HEIGHT;
            }
          }
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx?.drawImage(img, 0, 0, width, height);
          canvas.toBlob((blob) => {
            if (blob) {
              const compressedFile = new File([blob], file.name, { type: 'image/jpeg' });
              resolve(compressedFile);
            }
          }, 'image/jpeg', 0.7);
        };
      };
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const formDataToSend = new FormData();
      Object.entries(formData).forEach(([key, value]) => {
        formDataToSend.append(key, value);
      });
      if (image) {
        formDataToSend.append('image', image);
      }

      const response = await fetch('/api/students', {
        method: 'POST',
        body: formDataToSend,
      });

      if (!response.ok) {
        throw new Error('Failed to add student');
      }

      router.push('/dashboard/physical/students');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Add New Student</h1>
      <form onSubmit={handleSubmit} className="space-y-6">
        {error && (
          <div className="rounded-md bg-red-900/60 p-3">
            <div className="text-sm text-red-200">{error}</div>
          </div>
        )}
        <div className="space-y-4">
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-300">
              Name
            </label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              required
              className="input w-full"
            />
          </div>
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-300">
              Email
            </label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              required
              className="input w-full"
            />
          </div>
          <div>
            <label htmlFor="phone" className="block text-sm font-medium text-gray-300">
              Phone
            </label>
            <input
              type="tel"
              id="phone"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              required
              className="input w-full"
            />
          </div>
          <div>
            <label htmlFor="address" className="block text-sm font-medium text-gray-300">
              Address
            </label>
            <textarea
              id="address"
              name="address"
              value={formData.address}
              onChange={handleChange}
              required
              className="input w-full"
            />
          </div>
          <div>
            <label htmlFor="image" className="block text-sm font-medium text-gray-300">
              Image (Optional)
            </label>
            <input
              type="file"
              id="image"
              accept="image/*"
              onChange={handleImageChange}
              className="input w-full"
            />
            {image && (
              <div className="mt-2">
                <img
                  src={URL.createObjectURL(image)}
                  alt="Uploaded"
                  className="h-32 w-32 object-cover rounded"
                />
                <p className="text-sm text-gray-400">
                  Size: {imageStats && typeof imageStats.size === 'number' ? (imageStats.size / 1024).toFixed(2) : '--'} KB, Type: {imageStats?.type || '--'}
                </p>
              </div>
            )}
          </div>
        </div>
        <div>
          <button
            type="submit"
            disabled={loading}
            className="btn-primary w-full py-2 text-base font-semibold"
          >
            {loading ? 'Adding...' : 'Add Student'}
          </button>
        </div>
      </form>
    </div>
  );
} 