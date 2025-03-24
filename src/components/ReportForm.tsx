import { useState } from 'react';
import { Shield, Lock, Upload } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useNavigate } from 'react-router-dom';

interface FormData {
  description: string;
  location: string;
  date: string;
  type: string;
  image_url?: string;
}

export default function ReportForm() {
  const [formData, setFormData] = useState<FormData>({
    description: '',
    location: '',
    date: '',
    type: 'harassment'
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const navigate = useNavigate();

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (file.size > 5 * 1024 * 1024) {
        setError('Image size must be less than 5MB');
        return;
      }
      setImageFile(file);
      setError(null);
    }
  };

  const uploadImage = async (file: File): Promise<string> => {
    const fileExt = file.name.split('.').pop();
    const fileName = `${Math.random()}.${fileExt}`;
    const filePath = `${fileName}`;

    const { error: uploadError, data } = await supabase.storage
      .from('report-images')
      .upload(filePath, file, {
        onUploadProgress: (progress) => {
          setUploadProgress((progress.loaded / progress.total) * 100);
        },
      });

    if (uploadError) {
      throw new Error('Failed to upload image');
    }

    const { data: { publicUrl } } = supabase.storage
      .from('report-images')
      .getPublicUrl(filePath);

    return publicUrl;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);
    
    try {
      // First, verify the report using the backend service
      const verifyResponse = await fetch(`${window.location.protocol}//${window.location.hostname}:5000/verify`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ description: formData.description }),
      });

      if (!verifyResponse.ok) {
        throw new Error('Failed to verify report');
      }

      const verificationData = await verifyResponse.json();
      
      let image_url = undefined;
      if (imageFile) {
        image_url = await uploadImage(imageFile);
      }

      // Submit the report with verification data
      const { error: supabaseError } = await supabase
        .from('reports')
        .insert([{
          ...formData,
          image_url,
          verified: verificationData.data.verified,
          verification_result: verificationData.data.verificationResult
        }]);

      if (supabaseError) throw supabaseError;
      
      setSubmitted(true);
      
      setTimeout(() => {
        setSubmitted(false);
        setFormData({
          description: '',
          location: '',
          date: '',
          type: 'harassment'
        });
        setImageFile(null);
        setUploadProgress(0);
      }, 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to submit report');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAdminLogin = () => {
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100">
      <div className="max-w-4xl mx-auto px-4 py-12">
        <div className="flex justify-end mb-6">
          <button
            onClick={handleAdminLogin}
            className="flex items-center gap-2 bg-gray-800 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors"
          >
            <Lock className="h-4 w-4" />
            Admin Login
          </button>
        </div>

        <div className="text-center mb-12">
          <div className="flex justify-center mb-4">
            <Shield className="h-12 w-12 text-indigo-600" />
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Anonymous Crime Reporting
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Report incidents safely and anonymously. Your privacy is our priority.
            All reports are encrypted and handled with utmost confidentiality.
          </p>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-8">
          {submitted ? (
            <div className="text-center py-8">
              <div className="flex justify-center mb-4">
                <div className="bg-green-100 p-3 rounded-full">
                  <Shield className="h-8 w-8 text-green-600" />
                </div>
              </div>
              <h2 className="text-2xl font-semibold text-gray-900 mb-2">
                Report Submitted Successfully
              </h2>
              <p className="text-gray-600">
                Thank you for your report. It will be handled with confidentiality.
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
                  {error}
                </div>
              )}
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Type of Incident
                </label>
                <select
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                >
                  <option value="harassment">Harassment</option>
                  <option value="discrimination">Discrimination</option>
                  <option value="assault">Assault</option>
                  <option value="other">Other</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={4}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  placeholder="Please provide details about the incident..."
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Location
                </label>
                <input
                  type="text"
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  placeholder="Where did this occur?"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Date of Incident
                </label>
                <input
                  type="date"
                  value={formData.date}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Upload Image (Optional)
                </label>
                <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-lg">
                  <div className="space-y-1 text-center">
                    <Upload className="mx-auto h-12 w-12 text-gray-400" />
                    <div className="flex text-sm text-gray-600">
                      <label
                        htmlFor="image-upload"
                        className="relative cursor-pointer bg-white rounded-md font-medium text-indigo-600 hover:text-indigo-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-indigo-500"
                      >
                        <span>Upload a file</span>
                        <input
                          id="image-upload"
                          name="image-upload"
                          type="file"
                          accept="image/*"
                          className="sr-only"
                          onChange={handleImageChange}
                        />
                      </label>
                      <p className="pl-1">or drag and drop</p>
                    </div>
                    <p className="text-xs text-gray-500">
                      PNG, JPG, GIF up to 5MB
                    </p>
                  </div>
                </div>
                {imageFile && (
                  <p className="mt-2 text-sm text-gray-600">
                    Selected: {imageFile.name}
                  </p>
                )}
                {uploadProgress > 0 && uploadProgress < 100 && (
                  <div className="mt-2">
                    <div className="bg-gray-200 rounded-full h-2.5">
                      <div
                        className="bg-indigo-600 h-2.5 rounded-full"
                        style={{ width: `${uploadProgress}%` }}
                      ></div>
                    </div>
                  </div>
                )}
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className={`w-full py-3 px-4 border border-transparent rounded-lg text-white font-medium 
                  ${isSubmitting 
                    ? 'bg-indigo-400 cursor-not-allowed' 
                    : 'bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500'
                  }`}
              >
                {isSubmitting ? 'Submitting...' : 'Submit Report'}
              </button>
            </form>
          )}
        </div>

        <div className="mt-8 text-center text-sm text-gray-500">
          In case of emergency, please contact your local emergency services immediately.
        </div>
      </div>
    </div>
  );
}