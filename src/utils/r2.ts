import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1';

export const uploadToR2 = async (file: File): Promise<string> => {
  try {
    // 1. Get presigned URL from backend
    const { data } = await axios.get(`${API_URL}/storage/presigned-url`, {
      params: {
        file_name: file.name,
        file_type: file.type
      }
    });

    const { upload_url, final_url } = data;

    // 2. Perform the actual upload to R2
    // We MUST use a clean axios instance to avoid global Authorization headers 
    // that the backend interceptor might have added.
    await axios.create().put(upload_url, file, {
      headers: {
        'Content-Type': file.type
      }
    });

    return final_url;
  } catch (error: any) {
    console.error('R2 upload error:', error.response?.data || error.message);
    throw new Error('Failed to upload to Cloudflare R2.');
  }
};
