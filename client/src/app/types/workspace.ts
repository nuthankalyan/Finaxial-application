export interface WorkspaceData {
  id: string;
  name: string;
  description?: string;
  fileContents: string;
  reports?: Array<{
    id: string;
    name: string;
    data: any;
    createdAt: string;
  }>;
  createdAt: string;
  updatedAt: string;
}

export interface WorkspaceResponse {
  success: boolean;
  data?: WorkspaceData;
  message?: string;
}
