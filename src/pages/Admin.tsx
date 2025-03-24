import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useNavigate } from 'react-router-dom';

interface Report {
  id: string;
  type: string;
  description: string;
  location: string;
  date: string;
  verified: boolean;
  verification_result: string | null;
  created_at: string;
  image_url?: string;
  severity: 'low' | 'medium' | 'high';
}

export default function Admin() {
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    checkAuth();
  }, []);

  async function checkAuth() {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate('/login');
        return;
      }

      // First try to fetch admin data
      const { data: adminData, error: adminError } = await supabase
        .from('admins')
        .select('id')
        .eq('id', session.user.id)
        .maybeSingle();

      // If not an admin, try to register as one
      if (!adminData && !adminError) {
        const { error: insertError } = await supabase
          .from('admins')
          .insert([
            { id: session.user.id, email: session.user.email }
          ])
          .select()
          .single();

        if (insertError) {
          throw new Error('Failed to register as admin');
        }
      } else if (adminError) {
        throw new Error('Failed to verify admin status');
      }

      // Fetch reports after confirming admin status
      await fetchReports();
    } catch (err) {
      console.error('Auth error:', err);
      navigate('/login');
    }
  }

  async function fetchReports() {
    try {
      const { data, error } = await supabase
        .from('reports')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      setReports(data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch reports');
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(id: string) {
    try {
      const { error } = await supabase
        .from('reports')
        .delete()
        .eq('id', id);

      if (error) throw error;
      setReports(reports.filter(report => report.id !== id));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete report');
    }
  }

  async function handleLogout() {
    await supabase.auth.signOut();
    navigate('/login');
  }

  function getSeverityColor(severity: string) {
    switch (severity) {
      case 'high':
        return 'bg-red-100 text-red-800';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800';
      case 'low':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-xl">Loading reports...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
          <button
            onClick={handleLogout}
            className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors"
          >
            Logout
          </button>
        </div>

        {error && (
          <div className="bg-red-50 text-red-600 p-4 rounded-lg mb-6">
            {error}
          </div>
        )}

        {reports.length === 0 ? (
          <div className="bg-white rounded-lg shadow-md p-6 text-center text-gray-500">
            No reports found.
          </div>
        ) : (
          <div className="grid gap-6">
            {reports.map((report) => (
              <div key={report.id} className="bg-white rounded-lg shadow-md p-6">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-xl font-semibold text-gray-900">
                      {report.location}
                    </h3>
                    <p className="text-sm text-gray-500">
                      Reported on {new Date(report.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className={`px-3 py-1 rounded-full text-sm font-medium capitalize ${getSeverityColor(report.severity)}`}>
                      {report.severity}
                    </span>
                    <button
                      onClick={() => handleDelete(report.id)}
                      className="bg-red-100 text-red-600 px-3 py-1 rounded-md hover:bg-red-200 transition-colors"
                    >
                      Delete
                    </button>
                  </div>
                </div>

                <p className="text-gray-700 mb-4">{report.description}</p>

                {report.image_url && (
                  <div className="mb-4">
                    <img
                      src={report.image_url}
                      alt="Report evidence"
                      className="rounded-lg max-h-96 w-auto"
                    />
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="font-medium text-gray-500">Type:</span>{' '}
                    <span className="capitalize">{report.type}</span>
                  </div>
                  <div>
                    <span className="font-medium text-gray-500">Date of Incident:</span>{' '}
                    {new Date(report.date).toLocaleDateString()}
                  </div>
                  <div className="col-span-2">
                    <span className="font-medium text-gray-500">Verification:</span>{' '}
                    <span className={report.verified ? 'text-green-600' : 'text-yellow-600'}>
                      {report.verified ? 'Verified' : 'Pending'}
                    </span>
                  </div>
                  {report.verification_result && (
                    <div className="col-span-2">
                      <span className="font-medium text-gray-500">AI Assessment:</span>{' '}
                      <span className="text-gray-700">{report.verification_result}</span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}