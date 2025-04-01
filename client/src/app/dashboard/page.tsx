'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import styles from './dashboard.module.css';
import { useAuth } from '../context/AuthContext';

interface Workspace {
  _id: string;
  name: string;
  description: string;
  createdAt: string;
  updatedAt: string;
}

export default function Dashboard() {
  const router = useRouter();
  const { user, loading: authLoading, error: authError, logout } = useAuth();
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: ''
  });
  const [formSubmitting, setFormSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [editingWorkspace, setEditingWorkspace] = useState<string | null>(null);
  const [deleteConfirmWorkspace, setDeleteConfirmWorkspace] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [activeCard, setActiveCard] = useState<string | null>(null);

  useEffect(() => {
    // If not loading and no user, redirect to login
    if (!authLoading && !user) {
      router.push('/login');
      return;
    }

    // Fetch workspaces if user is logged in
    if (user) {
      fetchWorkspaces();
    }
  }, [user, authLoading, router]);

  const fetchWorkspaces = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:5000/api/workspaces', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to fetch workspaces');
      }

      setWorkspaces(data.data);
    } catch (err: any) {
      setError(err.message || 'An error occurred while fetching workspaces');
      console.error('Error fetching workspaces:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleCreateWorkspace = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setFormSubmitting(true);
    setFormError(null);

    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:5000/api/workspaces', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to create workspace');
      }

      // Close modal and reset form
      setModalOpen(false);
      setFormData({ name: '', description: '' });
      
      // Redirect to the new workspace page
      router.push(`/workspace/${data.data._id}`);
    } catch (err: any) {
      setFormError(err.message || 'An error occurred while creating workspace');
      console.error('Error creating workspace:', err);
    } finally {
      setFormSubmitting(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const handleEditTitle = async (workspaceId: string, newTitle: string) => {
    if (!newTitle.trim()) {
      setEditingWorkspace(null);
      return;
    }

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('No authentication token found');
      }

      const response = await fetch(`http://localhost:5000/api/workspaces/${workspaceId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ name: newTitle }),
      });

      // Handle 404 errors specifically
      if (response.status === 404) {
        throw new Error('Workspace not found. It may have been deleted.');
      }

      // Try to get the response text first
      const responseText = await response.text();

      let data;
      try {
        // Try to parse the response text as JSON
        data = JSON.parse(responseText);
      } catch (parseError) {
        console.error('Failed to parse response as JSON:', parseError);
        console.error('Raw response:', responseText);
        throw new Error('Server returned an invalid response. Please try again.');
      }

      if (!response.ok) {
        throw new Error(data.message || `Failed to update workspace: ${response.statusText}`);
      }

      // Update the workspace in the state
      setWorkspaces(workspaces.map(w => 
        w._id === workspaceId ? { ...w, name: newTitle } : w
      ));
      setEditingWorkspace(null);
      setError(null); // Clear any previous errors

      // Refresh the workspaces list to ensure we have the latest data
      fetchWorkspaces();
    } catch (err: any) {
      console.error('Error updating workspace title:', err);
      setError(err.message || 'An error occurred while updating workspace title');
      
      // If it's a 404 error, remove the workspace from the local state
      if (err.message.includes('Workspace not found')) {
        setWorkspaces(workspaces.filter(w => w._id !== workspaceId));
      }
      
      setEditingWorkspace(null);
    }
  };

  const handleDeleteWorkspace = async (workspaceId: string) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:5000/api/workspaces/${workspaceId}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || 'Failed to delete workspace');
      }

      setWorkspaces(workspaces.filter(w => w._id !== workspaceId));
      setDeleteConfirmWorkspace(null);
    } catch (err: any) {
      console.error('Error deleting workspace:', err);
      setError(err.message || 'An error occurred while deleting workspace');
    }
  };

  const startEditing = (workspace: Workspace, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setEditingWorkspace(workspace._id);
    setEditTitle(workspace.name);
  };

  const handleTitleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, workspaceId: string) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleEditTitle(workspaceId, editTitle);
    } else if (e.key === 'Escape') {
      setEditingWorkspace(null);
    }
  };

  const handleTitleBlur = (workspaceId: string) => {
    handleEditTitle(workspaceId, editTitle);
  };

  const handleWorkspaceClick = (workspaceId: string) => {
    router.push(`/workspace/${workspaceId}`);
  };

  const handleCardMouseEnter = (workspaceId: string) => {
    setActiveCard(workspaceId);
  };

  const handleCardMouseLeave = () => {
    setActiveCard(null);
  };

  if (authLoading) {
    return (
      <div className={styles.loading}>
        <h2>Loading...</h2>
      </div>
    );
  }

  if (authError) {
    return (
      <div className={styles.error}>
        <h2>Error</h2>
        <p>{authError}</p>
      </div>
    );
  }

  // If still loading or no user, don't render the main content
  if (!user) {
    return null;
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1>Finaxial Dashboard</h1>
        <button onClick={logout} className={styles.logoutButton}>
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
          </svg>
          Logout
        </button>
      </div>

      <div className={styles.content}>
        <div className={styles.userCard}>
          <h2>Welcome, {user.username}!</h2>
          <div className={styles.userInfo}>
            <p>
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
              <strong>Email:</strong> {user.email}
            </p>
            <p>
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <strong>Account Created:</strong> {new Date(user.createdAt).toLocaleDateString()}
            </p>
          </div>
        </div>

        {/* Workspaces Section */}
        <div className={styles.dashboardSection}>
          <div className={styles.sectionHeader}>
            <h3>Your Workspaces</h3>
            <button 
              onClick={() => setModalOpen(true)} 
              className={styles.createButton}
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              Create Session
            </button>
          </div>
          
          {loading ? (
            <p>Loading workspaces...</p>
          ) : error ? (
            <p className={styles.error}>{error}</p>
          ) : workspaces.length === 0 ? (
            <div className={styles.emptyState}>
              <h4>No sessions found</h4>
              <p>Create your first session to get started with Finaxial</p>

            </div>
          ) : (
            <div className={styles.workspaceGrid}>
              {workspaces.map((workspace) => (
                <div 
                  key={workspace._id} 
                  className={styles.workspaceCard}
                  onClick={() => handleWorkspaceClick(workspace._id)}
                  onMouseEnter={() => handleCardMouseEnter(workspace._id)}
                  onMouseLeave={handleCardMouseLeave}
                >
                  <div className={styles.workspaceActions}>
                    <button 
                      className={styles.actionButton}
                      onClick={(e) => startEditing(workspace, e)}
                      aria-label="Edit workspace title"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                    </button>
                    <button 
                      className={`${styles.actionButton} ${styles.deleteButton}`}
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        setDeleteConfirmWorkspace(workspace._id);
                      }}
                      aria-label="Delete workspace"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                  {editingWorkspace === workspace._id ? (
                    <input
                      className={styles.editTitleInput}
                      value={editTitle}
                      onChange={(e) => setEditTitle(e.target.value)}
                      onKeyDown={(e) => handleTitleKeyDown(e, workspace._id)}
                      onBlur={() => handleTitleBlur(workspace._id)}
                      autoFocus
                      onClick={(e) => e.preventDefault()}
                    />
                  ) : (
                    <h4 className={styles.workspaceTitle}>{workspace.name}</h4>
                  )}
                  <p className={styles.workspaceDesc}>
                    {workspace.description || 'No description provided'}
                  </p>
                  <div className={styles.workspaceFooter}>
                    <div className={styles.workspaceDate}>
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      Created {formatDate(workspace.createdAt)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        
      </div>

      {deleteConfirmWorkspace && (
        <div className={styles.confirmDialog} onClick={() => setDeleteConfirmWorkspace(null)}>
          <div className={styles.confirmBox} onClick={(e) => e.stopPropagation()}>
            <h3 className={styles.confirmTitle}>Delete Workspace</h3>
            <p>Are you sure you want to delete this workspace? This action cannot be undone.</p>
            <div className={styles.confirmButtons}>
              <button 
                className={styles.confirmCancel}
                onClick={() => setDeleteConfirmWorkspace(null)}
              >
                Cancel
              </button>
              <button 
                className={styles.confirmDelete}
                onClick={() => handleDeleteWorkspace(deleteConfirmWorkspace)}
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create Session Modal */}
      {modalOpen && (
        <div className={styles.modalOverlay} onClick={() => !formSubmitting && setModalOpen(false)}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h3 className={styles.modalTitle}>Create New Session</h3>
              <button 
                className={styles.closeButton} 
                onClick={() => !formSubmitting && setModalOpen(false)}
                disabled={formSubmitting}
                aria-label="Close modal"
              >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" width="24" height="24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            {formError && <p className={styles.error}>{formError}</p>}
            
            <form onSubmit={handleCreateWorkspace} className={styles.modalForm}>
              <div className={styles.formGroup}>
                <label htmlFor="name">Session Name</label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  required
                  placeholder="Enter a name for your session"
                  disabled={formSubmitting}
                />
              </div>
              <div className={styles.formGroup}>
                <label htmlFor="description">Description (Optional)</label>
                <textarea
                  id="description"
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  placeholder="Describe the purpose of this session"
                  disabled={formSubmitting}
                />
              </div>
              <button
                type="submit"
                className={styles.submitButton}
                disabled={formSubmitting}
              >
                {formSubmitting ? 'Creating...' : 'Create Session'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
} 