import { Dataset, DatasetResponse, DatasetVersion, DatasetMetadata, ChangeMetadata } from '../types/datasetVersions';

class DatasetService {
  private datasets: Map<string, Dataset> = new Map();

  private generateId(): string {
    return Math.random().toString(36).substr(2, 9);
  }

  private getContentMetadata(content: string, type: 'csv' | 'excel'): DatasetMetadata {
    if (type === 'csv') {
      const lines = content.trim().split('\n');
      const headers = lines[0].split(',');
      const dataTypes: { [column: string]: string } = {};
      
      // Detect data types from the first data row
      if (lines.length > 1) {
        const firstDataRow = lines[1].split(',');
        headers.forEach((header, index) => {
          const value = firstDataRow[index];
          if (!isNaN(Number(value))) {
            dataTypes[header] = 'number';
          } else if (Date.parse(value)) {
            dataTypes[header] = 'date';
          } else {
            dataTypes[header] = 'string';
          }
        });
      }

      return {
        columnCount: headers.length,
        rowCount: lines.length - 1,
        headers,
        dataTypes
      };
    } else {
      try {
        const data = JSON.parse(content);
        const sheets = Object.keys(data.sheets);
        const primarySheet = data.sheets[data.primarySheet];
        const dataTypes: { [column: string]: string } = {};

        // Detect data types from the first row
        if (primarySheet.rows.length > 0) {
          primarySheet.headers.forEach((header: string, index: number) => {
            const value = primarySheet.rows[0][index];
            if (!isNaN(Number(value))) {
              dataTypes[header] = 'number';
            } else if (Date.parse(value)) {
              dataTypes[header] = 'date';
            } else {
              dataTypes[header] = 'string';
            }
          });
        }

        return {
          columnCount: primarySheet.headers.length,
          rowCount: primarySheet.rows.length,
          sheets,
          headers: primarySheet.headers,
          dataTypes
        };
      } catch (e) {
        return {
          columnCount: 0,
          rowCount: 0,
          headers: []
        };
      }
    }
  }

  private detectChanges(previousVersion: DatasetVersion, newContent: string, type: 'csv' | 'excel'): ChangeMetadata {
    const changes: ChangeMetadata = {
      addedRows: 0,
      removedRows: 0,
      modifiedRows: 0,
      addedColumns: [],
      removedColumns: [],
      modifiedColumns: []
    };

    const oldContent = previousVersion.content;
    const newMetadata = this.getContentMetadata(newContent, type);
    
    // Compare row counts
    changes.addedRows = Math.max(0, newMetadata.rowCount - previousVersion.metadata.rowCount);
    changes.removedRows = Math.max(0, previousVersion.metadata.rowCount - newMetadata.rowCount);

    // Compare columns
    const oldHeaders = previousVersion.metadata.headers;
    const newHeaders = newMetadata.headers;

    changes.addedColumns = newHeaders.filter(h => !oldHeaders.includes(h));
    changes.removedColumns = oldHeaders.filter(h => !newHeaders.includes(h));

    // Compare data for modified columns
    if (type === 'csv') {
      const oldLines = oldContent.trim().split('\n');
      const newLines = newContent.trim().split('\n');
      const commonHeaders = oldHeaders.filter(h => newHeaders.includes(h));
      
      // Check each column for modifications
      commonHeaders.forEach(header => {
        const oldIndex = oldHeaders.indexOf(header);
        const newIndex = newHeaders.indexOf(header);
        let isModified = false;

        // Compare values in each row
        for (let i = 1; i < Math.min(oldLines.length, newLines.length); i++) {
          const oldValue = oldLines[i].split(',')[oldIndex];
          const newValue = newLines[i].split(',')[newIndex];
          if (oldValue !== newValue) {
            isModified = true;
            changes.modifiedRows++;
            break;
          }
        }

        if (isModified) {
          changes.modifiedColumns.push(header);
        }
      });
    }

    // Generate change description
    const descriptions: string[] = [];
    if (changes.addedRows > 0) descriptions.push(`Added ${changes.addedRows} rows`);
    if (changes.removedRows > 0) descriptions.push(`Removed ${changes.removedRows} rows`);
    if (changes.modifiedRows > 0) descriptions.push(`Modified ${changes.modifiedRows} rows`);
    if (changes.addedColumns.length > 0) descriptions.push(`Added columns: ${changes.addedColumns.join(', ')}`);
    if (changes.removedColumns.length > 0) descriptions.push(`Removed columns: ${changes.removedColumns.join(', ')}`);
    if (changes.modifiedColumns.length > 0) descriptions.push(`Modified columns: ${changes.modifiedColumns.join(', ')}`);

    changes.changeDescription = descriptions.join('. ');
    return changes;
  }

  private isSimilarStructure(existingDataset: Dataset, newContent: string, type: 'csv' | 'excel'): boolean {
    const latestVersion = existingDataset.versions[existingDataset.versions.length - 1];
    const existingMetadata = latestVersion.metadata;
    const newMetadata = this.getContentMetadata(newContent, type);

    if (!existingMetadata?.headers || !newMetadata?.headers) return false;

    const headerSimilarity = existingMetadata.headers.filter(h => 
      newMetadata.headers?.includes(h)
    ).length / existingMetadata.headers.length;

    return headerSimilarity >= 0.8; // 80% similarity threshold
  }

  async uploadDataset(
    content: string, 
    fileName: string, 
    type: 'csv' | 'excel',
    userId: string
  ): Promise<DatasetResponse> {
    const baseName = fileName.replace(/\.[^/.]+$/, "");
    const existingDataset = Array.from(this.datasets.values()).find(dataset => 
      dataset.name === baseName || this.isSimilarStructure(dataset, content, type)
    );

    if (existingDataset) {
      const previousVersion = existingDataset.versions[existingDataset.versions.length - 1];
      const metadata = this.getContentMetadata(content, type);
      const changeMetadata = this.detectChanges(previousVersion, content, type);

      // Create new version
      const newVersion: DatasetVersion = {
        id: this.generateId(),
        version: existingDataset.currentVersion + 1,
        fileName,
        createdAt: new Date().toISOString(),
        userId,
        content,
        type,
        metadata,
        changeMetadata,
        parentVersionId: previousVersion.id
      };

      existingDataset.versions.push(newVersion);
      existingDataset.currentVersion++;
      existingDataset.updatedAt = new Date().toISOString();

      return {
        dataset: existingDataset,
        isNewDataset: false,
        version: newVersion.version
      };
    }

    // Create new dataset
    const newDataset: Dataset = {
      id: this.generateId(),
      name: baseName,
      currentVersion: 1,
      versions: [{
        id: this.generateId(),
        version: 1,
        fileName,
        createdAt: new Date().toISOString(),
        userId,
        content,
        type,
        metadata: this.getContentMetadata(content, type)
      }],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      userId
    };

    this.datasets.set(newDataset.id, newDataset);

    return {
      dataset: newDataset,
      isNewDataset: true,
      version: 1
    };
  }

  getDataset(id: string): Dataset | undefined {
    return this.datasets.get(id);
  }

  getAllDatasets(): Dataset[] {
    return Array.from(this.datasets.values());
  }

  getDatasetVersions(id: string): DatasetVersion[] | undefined {
    return this.datasets.get(id)?.versions;
  }

  deleteDatasetVersion(datasetId: string, versionId: string): { success: boolean; dataset?: Dataset } {
    const dataset = this.datasets.get(datasetId);
    if (!dataset) return { success: false };

    // Don't allow deleting if only one version remains
    if (dataset.versions.length <= 1) return { success: false };

    const versionIndex = dataset.versions.findIndex(v => v.id === versionId);
    if (versionIndex === -1) return { success: false };

    // Remove the version
    dataset.versions.splice(versionIndex, 1);

    // Reorder version numbers
    dataset.versions.forEach((version, index) => {
      version.version = index + 1;
    });

    // Update currentVersion
    dataset.currentVersion = dataset.versions.length;

    // Update timestamps
    dataset.updatedAt = new Date().toISOString();

    return { success: true, dataset };
  }
}

export const datasetService = new DatasetService();
