import { useState, useEffect } from 'react';
import { read, utils } from 'xlsx';
import { Job } from '../types/job';

interface RawJobData {
  id?: string | number;
  title?: string;
  company?: string;
  location?: string;
  type?: string;
  description?: string;
  requirements?: string;
  salaryMin?: string | number;
  salaryMax?: string | number;
  salaryCurrency?: string;
  postedDate?: string | number;
  applicationUrl?: string;
  companyLogo?: string;
}

const isValidDate = (dateString: string) => {
  try {
    const date = new Date(dateString);
    return date instanceof Date && !isNaN(date.getTime());
  } catch {
    return false;
  }
};

const validateAndParseJob = (row: RawJobData): Job | null => {
  try {
    // Check for required fields
    if (!row.id || !row.title || !row.company || !row.location) {
      console.error('Missing required fields:', row);
      return null;
    }

    // Ensure we have a valid date
    const postedDate = isValidDate(String(row.postedDate))
      ? new Date(String(row.postedDate)).toISOString().split('T')[0]
      : new Date().toISOString().split('T')[0];

    // Parse requirements - handle both string and array formats
    const requirements = typeof row.requirements === 'string'
      ? row.requirements.split('\n').filter(Boolean)
      : ['No requirements specified'];

    const job: Job = {
      id: String(row.id),
      title: String(row.title),
      company: String(row.company),
      location: String(row.location),
      type: (String(row.type || 'FULL_TIME')) as 'FULL_TIME' | 'PART_TIME' | 'CONTRACT' | 'FREELANCE',
      description: String(row.description || ''),
      requirements,
      salary: {
        min: Number(row.salaryMin) || 0,
        max: Number(row.salaryMax) || 0,
        currency: String(row.salaryCurrency || 'USD'),
      },
      postedDate,
      applicationUrl: String(row.applicationUrl || '#'),
      companyLogo: String(row.companyLogo || 'https://images.unsplash.com/photo-1560179707-f14e90ef3623?w=100&h=100&fit=crop'),
    };

    return job;
  } catch (error) {
    console.error('Error parsing job:', error);
    return null;
  }
};

export const useJobs = () => {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchJobs = async () => {
      try {
        const response = await fetch('/data/jobs.xlsx');
        if (!response.ok) {
          throw new Error('Failed to fetch jobs file');
        }

        const arrayBuffer = await response.arrayBuffer();
        const workbook = read(arrayBuffer, { type: 'array' });
        
        if (!workbook.SheetNames.length) {
          throw new Error('Excel file is empty');
        }

        const worksheet = workbook.Sheets[workbook.SheetNames[0]];
        const jsonData = utils.sheet_to_json<RawJobData>(worksheet, { 
          raw: false,
          defval: '' 
        });

        const parsedJobs = jsonData
          .map(validateAndParseJob)
          .filter((job): job is Job => job !== null);

        if (parsedJobs.length === 0) {
          throw new Error('No valid jobs found in the file');
        }

        setJobs(parsedJobs);
        setLoading(false);
      } catch (err) {
        console.error('Error fetching jobs:', err);
        setError(err instanceof Error ? err.message : 'Failed to fetch jobs');
        setLoading(false);
      }
    };

    fetchJobs();
  }, []);

  return { jobs, loading, error };
};