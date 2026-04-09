import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1';

export const uploadToR2 = async (file: File): Promise<string> => {
  try {
    // Upload through the backend proxy to avoid browser SSL issues with R2's S3 endpoint.
    const formData = new FormData();
    formData.append('file', file);

    const authHeader = localStorage.getItem('access_token');
    const { data } = await axios.post(`${API_URL}/storage/upload`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
        ...(authHeader ? { Authorization: `Bearer ${authHeader}` } : {}),
      },
    });

    return data.url;
  } catch (error: any) {
    console.error('R2 upload error:', error.response?.data || error.message);
    throw new Error('Failed to upload to Cloudflare R2.');
  }
};
