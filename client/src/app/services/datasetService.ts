import { Dataset, DatasetResponse, DatasetVersion, DatasetMetadata, ChangeMetadata } from '../types/datasetVersions';
import { buildApiUrl } from '../utils/apiConfig';

class DatasetService {  private async makeRequest(url: string, options: RequestInit = {}) {
    const token = localStorage.getItem('token');
    console.log('Making API request to:', url);
    console.log('Request options:', options);
    
    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
        ...options.headers,
      },
    });

    console.log('Response status:', response.status);
    console.log('Response statusText:', response.statusText);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('API Error response:', errorText);
      console.error('Response headers:', Object.fromEntries(response.headers.entries()));
      throw new Error(`HTTP error! status: ${response.status} - ${errorText}`);
    }

    const result = await response.json();
    console.log('API Response:', result);
    return result;
  }  async uploadDataset(
    content: string, 
    fileName: string, 
    type: 'csv' | 'excel',
    workspaceId: string
  ): Promise<DatasetResponse> {
    const result = await this.makeRequest(buildApiUrl(`api/workspaces/${workspaceId}/datasets`), {
      method: 'POST',
      body: JSON.stringify({
        content,
        fileName,
        type
      })
    });

    return result.data;
  }

  async uploadMultipleDatasets(
    files: { content: string; fileName: string; type: 'csv' | 'excel' }[],
    workspaceId: string
  ): Promise<{ dataset: Dataset; isNewDataset: boolean; version: number }[]> {
    const results = await Promise.all(
      files.map(file => this.uploadDataset(file.content, file.fileName, file.type, workspaceId))
    );
    return results;
  }  async getDataset(workspaceId: string, datasetId: string): Promise<Dataset | undefined> {
    try {
      const result = await this.makeRequest(buildApiUrl(`api/workspaces/${workspaceId}/datasets/${datasetId}`));
      return result.data;
    } catch (error) {
      console.error('Error fetching dataset:', error);
      return undefined;
    }
  }

  async getAllDatasets(workspaceId: string): Promise<Dataset[]> {
    try {
      const result = await this.makeRequest(buildApiUrl(`api/workspaces/${workspaceId}/datasets`));
      return result.data;
    } catch (error) {
      console.error('Error fetching datasets:', error);
      return [];
    }
  }

  async getDatasetVersions(workspaceId: string, datasetId: string): Promise<DatasetVersion[] | undefined> {
    const dataset = await this.getDataset(workspaceId, datasetId);
    return dataset?.versions;
  }  async deleteDatasetVersion(workspaceId: string, datasetId: string, versionId: string): Promise<{ success: boolean; dataset?: Dataset }> {
    try {
      const result = await this.makeRequest(buildApiUrl(`api/workspaces/${workspaceId}/datasets/${datasetId}/versions/${versionId}`), {
        method: 'DELETE'
      });
      return { success: true, dataset: result.data };
    } catch (error) {
      console.error('Error deleting dataset version:', error);
      return { success: false };
    }
  }
}export const datasetService = new DatasetService();
