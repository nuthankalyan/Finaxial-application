import React, { useState, useEffect } from 'react';
import { Dataset } from '../../types/datasetVersions';
import { DatasetVersions } from '../DatasetVersions/DatasetVersions';
import { datasetService } from '../../services/datasetService';
import styles from './WorkspaceDatasetManager.module.css';

interface WorkspaceDatasetManagerProps {
  workspaceId: string;
  userId: string;
}

export const WorkspaceDatasetManager: React.FC<WorkspaceDatasetManagerProps> = ({ 
  workspaceId, 
  userId 
}) => {
  const [datasets, setDatasets] = useState<Dataset[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDataset, setSelectedDataset] = useState<Dataset | null>(null);

  useEffect(() => {
    loadDatasets();
  }, [workspaceId]);

  const loadDatasets = async () => {
    try {
      setLoading(true);
      const fetchedDatasets = await datasetService.getAllDatasets(workspaceId);
      setDatasets(fetchedDatasets);
    } catch (error) {
      console.error('Error loading datasets:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpload = async (files: FileList) => {
    const uploadPromises = Array.from(files).map(async (file) => {
      const content = await file.text();
      const type = file.name.endsWith('.csv') ? 'csv' : 'excel';
      
      return datasetService.uploadDataset(content, file.name, type, workspaceId);
    });

    try {
      const results = await Promise.all(uploadPromises);
      
      // Reload datasets to get updated data
      await loadDatasets();
      
      // Optionally select the first uploaded dataset
      if (results.length > 0) {
        const firstResult = results[0];
        setSelectedDataset(firstResult.dataset);
      }
    } catch (error) {
      console.error('Error uploading datasets:', error);
    }
  };

  const handleVersionDelete = async (success: boolean, updatedDataset?: Dataset) => {
    if (success && updatedDataset) {
      // Update the datasets list with the updated dataset
      setDatasets(prev => 
        prev.map(dataset => 
          dataset.id === updatedDataset.id ? updatedDataset : dataset
        )
      );
      
      // Update selected dataset if it's the one that was modified
      if (selectedDataset?.id === updatedDataset.id) {
        setSelectedDataset(updatedDataset);
      }
    }
  };
  if (loading) {
    return <div className={styles.loading}>Loading datasets...</div>;
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h3>Dataset Management</h3>
      </div>

      <div className={styles.uploadSection}>
        <h4>Upload New Dataset</h4>
        <input
          type="file"
          multiple
          accept=".csv,.xlsx,.xls"
          onChange={(e) => e.target.files && handleUpload(e.target.files)}
          className={styles.uploadInput}
        />
      </div>

      {datasets.length === 0 ? (
        <div className={styles.emptyState}>
          <h4>No datasets found</h4>
          <p>Upload your first dataset to get started</p>
        </div>
      ) : (
        <>
          <div>
            <h4>Available Datasets:</h4>
            <div className={styles.datasetsList}>
              {datasets.map((dataset) => (
                <div 
                  key={dataset.id}
                  className={`${styles.datasetCard} ${selectedDataset?.id === dataset.id ? styles.selected : ''}`}
                  onClick={() => setSelectedDataset(dataset)}
                >
                  <div className={styles.datasetName}>{dataset.name}</div>
                  <div className={styles.datasetInfo}>
                    v{dataset.currentVersion} • {dataset.versions.length} versions
                  </div>
                  <div className={styles.datasetInfo}>
                    Updated: {new Date(dataset.updatedAt).toLocaleDateString()}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {selectedDataset && (
            <div className={styles.versionsSection}>
              <h4>Dataset Versions: {selectedDataset.name}</h4>
              <DatasetVersions
                dataset={selectedDataset}
                workspaceId={workspaceId}
                onVersionDelete={handleVersionDelete}
              />
            </div>
          )}
        </>
      )}
    </div>
  );
};
