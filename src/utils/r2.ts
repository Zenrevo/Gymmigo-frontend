import api from './api';

export const uploadToR2 = async (file: File): Promise<string> => {
  try {
    // Upload through the backend proxy to avoid browser SSL issues with R2's S3 endpoint.
    const formData = new FormData();
    formData.append('file', file);

    const { data } = await api.post(`/storage/upload`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });

    return data.url;
  } catch (error: any) {
    console.error('R2 upload error:', error.response?.data || error.message);
    throw new Error('Failed to upload to Cloudflare R2.');
  }
};
