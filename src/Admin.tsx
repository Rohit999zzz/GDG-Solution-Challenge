import { useEffect, useState } from "react";

interface Report {
  id: number;
  type: string;
  description: string;
  location: string;
  date: string;
}

function Admin() {
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("http://localhost:5000/reports")
      .then((res) => {
        if (!res.ok) {
          throw new Error("Failed to fetch reports");
        }
        return res.json();
      })
      .then((data) => {
        setReports(data);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });
  }, []);

  const handleDelete = async (id: number) => {
    try {
      const response = await fetch(`http://localhost:5000/reports/${id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to delete report");
      }

      // Remove the deleted report from the state
      setReports((prevReports) => prevReports.filter((report) => report.id !== id));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete report");
    }
  };

  if (loading) {
    return <div>Loading reports...</div>;
  }

  if (error) {
    return <div>Error: {error}</div>;
  }

  return (
    <div className="p-8 bg-gray-100 min-h-screen">
      <h1 className="text-3xl font-bold mb-8">Admin Dashboard</h1>
      <div className="space-y-6">
        {reports.map((report) => (
          <div key={report.id} className="bg-white p-6 rounded-lg shadow-md">
            <h3 className="text-xl font-semibold mb-2">{report.location}</h3>
            <p className="text-gray-700 mb-4">{report.description}</p>
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-500">
                <span className="font-medium">Type:</span> {report.type} |{" "}
                <span className="font-medium">Date:</span> {report.date}
              </div>
              <button
                onClick={() => handleDelete(report.id)}
                className="bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 transition-colors"
              >
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default Admin;