'use client';

import React from 'react';
import { Dataset, DatasetVersion } from '../../types/datasetVersions';
import { datasetService } from '../../services/datasetService';
import styles from './DatasetVersions.module.css';

interface DatasetVersionsProps {
  dataset: Dataset;
  workspaceId: string;
  onVersionDelete?: (success: boolean, updatedDataset?: Dataset) => void;
  isDeleting?: boolean;
}

export const DatasetVersions: React.FC<DatasetVersionsProps> = ({ dataset, workspaceId, onVersionDelete, isDeleting }) => {
  const handleDelete = async (versionId: string) => {
    if (dataset.versions.length <= 1) {
      // Don't allow deleting the last version
      if (onVersionDelete) onVersionDelete(false);
      return;
    }

    const result = await datasetService.deleteDatasetVersion(workspaceId, dataset.id, versionId);
    if (onVersionDelete) onVersionDelete(result.success, result.dataset);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatMetadata = (version: DatasetVersion) => {
    const metadata = version.metadata;
    if (!metadata) return null;

    const parts = [];
    if (metadata.rowCount) parts.push(`${metadata.rowCount.toLocaleString()} rows`);
    if (metadata.columnCount) parts.push(`${metadata.columnCount} columns`);
    if (metadata.sheets?.length) parts.push(`${metadata.sheets.length} sheets`);

    return parts.join(' • ');
  };

  return (
    <div className={styles.container}>
      <table className={styles.table}>
        <thead>
          <tr className={styles.header}>
            <th>Version</th>
            <th>File Name</th>
            <th>Data Info</th>
            <th>Changes</th>
            <th>Type</th>
            <th>Created</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {dataset.versions.map((version) => (
            <tr key={version.id} className={styles.row}>
              <td>
                <span className={styles.version}>v{version.version}</span>
              </td>
              <td>{version.fileName}</td>
              <td>
                <div className={styles.metadata}>
                  {formatMetadata(version)}
                </div>
              </td>
              <td>
                {version.changeMetadata ? (
                  <div className={styles.changes}>
                    {version.changeMetadata.changeDescription || 'No changes detected'}
                    <div className={styles.changeCounts}>
                      {version.changeMetadata.addedRows > 0 && (
                        <span className={`${styles.changeChip} ${styles.added}`}>
                          +{version.changeMetadata.addedRows} rows
                        </span>
                      )}
                      {version.changeMetadata.modifiedRows > 0 && (
                        <span className={`${styles.changeChip} ${styles.modified}`}>
                          ~{version.changeMetadata.modifiedRows} rows
                        </span>
                      )}
                      {version.changeMetadata.removedRows > 0 && (
                        <span className={`${styles.changeChip} ${styles.removed}`}>
                          -{version.changeMetadata.removedRows} rows
                        </span>
                      )}
                    </div>
                  </div>
                ) : (
                  <span className={styles.chip}>Initial Version</span>
                )}
              </td>
              <td>
                <span className={styles.chip}>
                  {version.type.toUpperCase()}
                </span>
              </td>
              <td>
                <span className={styles.timestamp}>
                  {formatDate(version.createdAt)}
                </span>
              </td>
              <td>
                <button
                  onClick={() => handleDelete(version.id)}
                  disabled={isDeleting || dataset.versions.length <= 1}
                  className={styles.deleteButton}
                  aria-label="Delete version"
                >
                  {isDeleting ? (
                    <span className={styles.spinner} />
                  ) : (
                    <svg 
                      xmlns="http://www.w3.org/2000/svg" 
                      width="16" 
                      height="16" 
                      viewBox="0 0 24 24" 
                      fill="none" 
                      stroke="currentColor" 
                      strokeWidth="2" 
                      strokeLinecap="round" 
                      strokeLinejoin="round"
                    >
                      <path d="M3 6h18" />
                      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6" />
                      <path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                      <line x1="10" y1="11" x2="10" y2="17" />
                      <line x1="14" y1="11" x2="14" y2="17" />
                    </svg>
                  )}
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};
