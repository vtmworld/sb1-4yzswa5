import React, { useState } from 'react';
import { ArrowLeft } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { read, utils, write } from 'xlsx';

export const AdminUpload: React.FC = () => {
  const navigate = useNavigate();
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setError(null);

    try {
      const reader = new FileReader();
      reader.onload = async (e) => {
        try {
          const data = e.target?.result;
          const workbook = read(data, { type: 'array' });
          const worksheet = workbook.Sheets[workbook.SheetNames[0]];
          const jsonData = utils.sheet_to_json(worksheet);

          console.log('Parsed Excel:', jsonData);
          alert('Excel file uploaded successfully! In a real application, this would update the jobs database.');
          navigate('/');
        } catch (error) {
          setError('Error parsing Excel file. Please check the format.');
        } finally {
          setUploading(false);
        }
      };

      reader.onerror = () => {
        setError('Error reading file');
        setUploading(false);
      };

      reader.readAsArrayBuffer(file);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to upload Excel file');
      setUploading(false);
    }
  };

  const downloadTemplate = () => {
    try {
      // Sample job data for the template
      const templateData = [{
        id: '1',
        title: 'Sample Job Title',
        company: 'Sample Company',
        location: 'City, Country',
        type: 'FULL_TIME',
        description: 'Job description goes here...',
        requirements: 'Requirement 1\nRequirement 2\nRequirement 3',
        salaryMin: '50000',
        salaryMax: '100000',
        salaryCurrency: 'USD',
        postedDate: new Date().toISOString().split('T')[0],
        applicationUrl: 'https://example.com/apply',
        companyLogo: 'https://example.com/logo.png'
      }];

      // Create workbook and worksheet
      const ws = utils.json_to_sheet(templateData);
      const wb = utils.book_new();
      utils.book_append_sheet(wb, ws, 'Jobs');

      // Generate Excel file
      const excelBuffer = write(wb, { bookType: 'xlsx', type: 'array' });
      
      // Create Blob and download link
      const blob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'jobs_template.xlsx';
      
      // Trigger download
      document.body.appendChild(link);
      link.click();
      
      // Cleanup
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Error creating template:', err);
      setError('Failed to generate template file');
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <Link to="/" className="inline-flex items-center text-blue-600 hover:text-blue-800 mb-6">
        <ArrowLeft size={20} className="mr-2" />
        Back to Jobs
      </Link>

      <div className="bg-white rounded-lg shadow-lg p-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Upload Jobs Excel File</h1>

        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-4">
              Upload your jobs Excel file
            </label>
            
            <div className="mt-2 flex justify-center rounded-lg border border-dashed border-gray-900/25 px-6 py-10">
              <div className="text-center">
                <div className="mt-4 flex text-sm leading-6 text-gray-600">
                  <label
                    htmlFor="file-upload"
                    className="relative cursor-pointer rounded-md bg-white font-semibold text-blue-600 focus-within:outline-none focus-within:ring-2 focus-within:ring-blue-600 focus-within:ring-offset-2 hover:text-blue-500"
                  >
                    <span>Upload a file</span>
                    <input
                      id="file-upload"
                      name="file-upload"
                      type="file"
                      className="sr-only"
                      accept=".xlsx,.xls"
                      onChange={handleFileUpload}
                      disabled={uploading}
                    />
                  </label>
                  <p className="pl-1">or drag and drop</p>
                </div>
                <p className="text-xs leading-5 text-gray-600">Excel files only (.xlsx, .xls)</p>
              </div>
            </div>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-800">
              {error}
            </div>
          )}

          <div className="mt-4">
            <h2 className="text-lg font-semibold mb-2">Excel Format Requirements:</h2>
            <p className="text-sm text-gray-600 mb-4">
              Your Excel file should include the following columns:
            </p>
            <ul className="list-disc list-inside text-sm text-gray-600 space-y-1">
              <li>id (unique identifier)</li>
              <li>title (job title)</li>
              <li>company (company name)</li>
              <li>location (job location)</li>
              <li>type (FULL_TIME, PART_TIME, CONTRACT, or FREELANCE)</li>
              <li>description (job description)</li>
              <li>requirements (one per line)</li>
              <li>salaryMin (minimum salary)</li>
              <li>salaryMax (maximum salary)</li>
              <li>salaryCurrency (USD, EUR, etc.)</li>
              <li>postedDate (YYYY-MM-DD)</li>
              <li>applicationUrl (URL for job application)</li>
              <li>companyLogo (URL to company logo image)</li>
            </ul>
          </div>

          <div className="mt-4">
            <button
              onClick={downloadTemplate}
              className="text-blue-600 hover:text-blue-800 text-sm font-medium"
            >
              Download Excel template
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};