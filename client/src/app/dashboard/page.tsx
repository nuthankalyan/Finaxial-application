'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import styles from './dashboard.module.css';
import { useAuth } from '../context/AuthContext';
import { buildApiUrl, fetchWithErrorHandling } from '../utils/apiConfig';
import { getActivityStats } from '../services/activityService';
import DescriptionPopup from '../components/DescriptionPopup';

interface Workspace {
  _id: string;
  name: string;
  description: string;
  createdAt: string;
  updatedAt: string;
}

// Activity interfaces for different activity types
interface Activity {
  id: string;
  type: 'workspace_created' | 'report_generated';
  timestamp: string;
}

interface WorkspaceActivity extends Activity {
  type: 'workspace_created';
  workspace: {
    id: string;
    name: string;
  };
}

interface ReportActivity extends Activity {
  type: 'report_generated';
  workspace: {
    id: string;
    name: string;
  };
  report: {
    fileName: string;
  };
}

type CombinedActivity = WorkspaceActivity | ReportActivity;

// Business Terms Component
interface BusinessTerm {
  term: string;
  definition: string;
}

const BUSINESS_TERMS: BusinessTerm[] = [
  {
    term: "ROI (Return on Investment)",
    definition: "A performance measure used to evaluate the efficiency of an investment."
  },
  {
    term: "EBITDA",
    definition: "Earnings Before Interest, Taxes, Depreciation, and Amortization - a measure of a company's overall financial performance."
  },
  {
    term: "Cash Flow",
    definition: "The net amount of cash moving into and out of a business."
  },
  {
    term: "Gross Margin",
    definition: "The difference between revenue and cost of goods sold, divided by revenue."
  },
  {
    term: "KPI (Key Performance Indicator)",
    definition: "A measurable value that demonstrates how effectively a company is achieving key business objectives."
  },
  {
    term: "Liquidity",
    definition: "The degree to which an asset can be quickly bought or sold without affecting its price."
  },
  {
    term: "Accounts Receivable",
    definition: "Money owed to a company by its debtors."
  },
  {
    term: "Accounts Payable",
    definition: "Money a company owes to its creditors."
  },
  {
    term: "Balance Sheet",
    definition: "A financial statement that reports a company's assets, liabilities, and shareholders' equity."
  },
  {
    term: "Income Statement",
    definition: "A financial statement that shows a company's revenues and expenses during a particular period."
  },
  {
    term: "Cash Flow Statement",
    definition: "A financial statement that shows how changes in balance sheet accounts and income affect cash and cash equivalents."
  },
  {
    term: "P/E Ratio",
    definition: "Price-to-Earnings Ratio - a company's share price divided by its earnings per share."
  },
  {
    term: "Market Capitalization",
    definition: "The total market value of a company's outstanding shares."
  },
  {
    term: "Depreciation",
    definition: "The decrease in the value of assets over time."
  },
  {
    term: "Equity",
    definition: "The value of an ownership interest in property, including shareholders' equity in a business."
  }
];

function BusinessTermsButton() {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTerm, setSelectedTerm] = useState<BusinessTerm | null>(null);
  const modalRef = useRef<HTMLDivElement>(null);

  const filteredTerms = searchTerm 
    ? BUSINESS_TERMS.filter(term => 
        term.term.toLowerCase().includes(searchTerm.toLowerCase()) || 
        term.definition.toLowerCase().includes(searchTerm.toLowerCase())
      )
    : BUSINESS_TERMS;
  
  // Handle click outside to close modal
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (modalRef.current && !modalRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    
    // Add event listener when modal is open
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    
    // Cleanup function to remove event listener
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);
  
  // Handle escape key to close modal
  useEffect(() => {
    function handleEscapeKey(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    }
    
    // Add event listener when modal is open
    if (isOpen) {
      document.addEventListener('keydown', handleEscapeKey);
    }
    
    // Cleanup function to remove event listener
    return () => {
      document.removeEventListener('keydown', handleEscapeKey);
    };
  }, [isOpen]);

  return (
    <>
      

      {isOpen && (
        <div 
          className={styles.termsModalOverlay}
          onClick={() => setIsOpen(false)}
        >
          <div 
            className={styles.termsModal} 
            onClick={(e) => e.stopPropagation()}
            ref={modalRef}
          >
            <div className={styles.termsModalHeader}>
              <h3>Common Business Terms</h3>
              <button 
                className={styles.closeButton}
                onClick={() => setIsOpen(false)}
              >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" width="24" height="24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <div className={styles.termsSearch}>
              <input
                type="text"
                placeholder="Search terms..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                autoFocus
                aria-label="Search terms"
                title="Search for business terms"
              />
            </div>
            
            <div className={styles.termsContent}>
              <div className={styles.termsList}>
                {filteredTerms.map((term, index) => (
                  <div 
                    key={index} 
                    className={`${styles.termItem} ${selectedTerm?.term === term.term ? styles.termItemSelected : ''}`}
                    onClick={() => setSelectedTerm(term)}
                  >
                    {term.term}
                  </div>
                ))}
                
                {filteredTerms.length === 0 && (
                  <div className={styles.noResults}>
                    No terms found matching "{searchTerm}"
                  </div>
                )}
              </div>
              
              <div className={styles.termDefinition}>
                {selectedTerm ? (
                  <>
                    <h4>{selectedTerm.term}</h4>
                    <p>{selectedTerm.definition}</p>
                  </>
                ) : (
                  <div className={styles.termPlaceholder}>
                    <p>Select a term to view its definition</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
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
  const [activities, setActivities] = useState<CombinedActivity[]>([]);
  const [activitySidebarOpen, setActivitySidebarOpen] = useState(false);
  const [avatarDropdownOpen, setAvatarDropdownOpen] = useState(false);
  const [selectedDescription, setSelectedDescription] = useState<string | null>(null);
  const [isDescriptionPopupOpen, setIsDescriptionPopupOpen] = useState(false);
  const avatarRef = useRef<HTMLDivElement>(null);
  const [activityStats, setActivityStats] = useState({
    reportsGenerated: 0,
    insightsGenerated: 0,
    reportsChange: 0,
    insightsChange: 0
  });

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
  
  // Close avatar dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (avatarRef.current && !avatarRef.current.contains(event.target as Node)) {
        setAvatarDropdownOpen(false);
      }
    }
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const fetchWorkspaces = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const token = localStorage.getItem('token');
      const response = await fetch(buildApiUrl('api/workspaces'), {
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
      const url = buildApiUrl('api/workspaces');
      console.log('Creating workspace at:', url);
      
      const data = await fetchWithErrorHandling(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(formData),
      });

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

      const response = await fetch(buildApiUrl(`api/workspaces/${workspaceId}`), {
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

  const handleDeleteWorkspace = async (workspaceId: string | null) => {
    if (!workspaceId) return;
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(buildApiUrl(`api/workspaces/${workspaceId}`), {
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

  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
    
    // Check if the date is today
    const today = new Date();
    const isToday = date.getDate() === today.getDate() && 
                   date.getMonth() === today.getMonth() && 
                   date.getFullYear() === today.getFullYear();
    
    // Check if the date is yesterday
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const isYesterday = date.getDate() === yesterday.getDate() && 
                       date.getMonth() === yesterday.getMonth() && 
                       date.getFullYear() === yesterday.getFullYear();
    
    // Format the time
    const timeString = date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: 'numeric',
      hour12: true
    });
    
    if (isToday) {
      return `Today at ${timeString}`;
    } else if (isYesterday) {
      return `Yesterday at ${timeString}`;
    } else {
      // For older dates, show the date and time
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      }) + ` at ${timeString}`;
    }
  };

  // Generate activities from workspaces and reports
  useEffect(() => {
    if (workspaces.length > 0) {
      // Create workspace creation activities
      const workspaceActivities: WorkspaceActivity[] = workspaces.map(workspace => ({
        id: `workspace-${workspace._id}`,
        type: 'workspace_created',
        timestamp: workspace.createdAt,
        workspace: {
          id: workspace._id,
          name: workspace.name
        }
      }));

      // Simulate some report generation activities (in a real app, these would come from the API)
      // In this example, we'll create a report activity for some of the workspaces
      const reportActivities: ReportActivity[] = workspaces
        .slice(0, Math.min(3, workspaces.length)) // Use up to 3 workspaces for demo
        .map((workspace, index) => {
          // Create a timestamp a bit after the workspace was created
          const reportDate = new Date(workspace.createdAt);
          reportDate.setHours(reportDate.getHours() + 2 + index); // 2+ hours after workspace creation
          
          return {
            id: `report-${workspace._id}-${index}`,
            type: 'report_generated',
            timestamp: reportDate.toISOString(),
            workspace: {
              id: workspace._id,
              name: workspace.name
            },
            report: {
              fileName: `financial-data-${index + 1}.csv`
            }
          };
        });

      // Combine all activities and sort by timestamp (newest first)
      const combinedActivities = [...workspaceActivities, ...reportActivities].sort(
        (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      );
      
      // Take only the 5 most recent activities
      setActivities(combinedActivities.slice(0, 5));
    }
  }, [workspaces]);

  // Check if there are any activities to show
  const hasActivities = activities.length > 0;

  // Fetch activity stats
  useEffect(() => {
    const fetchActivityStats = async () => {
      try {
        const stats = await getActivityStats();
        setActivityStats(stats);
      } catch (error) {
        console.error('Error fetching activity stats:', error);
      }
    };

    if (user) {
      fetchActivityStats();
    }
  }, [user]);

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
        <div className={styles.headerLeft}>
          <img 
            src="/finaxial-logooo.png" 
            alt="Finaxial Logo" 
            className={styles.headerLogo} 
          />
         
        </div>
        <div className={styles.headerRight}>
          <div className={styles.avatarContainer} ref={avatarRef}>           
             <button
              className={styles.avatar} 
              onClick={() => setAvatarDropdownOpen(!avatarDropdownOpen)}
              aria-label="Toggle user menu"
              aria-expanded={avatarDropdownOpen}
              aria-haspopup="menu"
            >              {user?.username?.charAt(0).toUpperCase() || 'U'}
            </button>
            {avatarDropdownOpen && (
              <div className={styles.avatarDropdown}>
                <div className={styles.dropdownItem}>
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" width="18" height="18">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                  <span>{user.username}</span>
                </div>
                <div className={styles.dropdownItem}>
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" width="18" height="18">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span>{formatDate(user.createdAt)}</span>
                </div>
                <hr className={styles.divider} />
                <div className={styles.dropdownItem} onClick={logout}>
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" width="18" height="18">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                  </svg>
                  <span>Logout</span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className={styles.content}>
        <div className={styles.welcomeSection}>
          <h2>Welcome, {user.username}!</h2>
        </div>

        {/* Dashboard Stats */}
        <div className={styles.dashboardStats}>
          <div className={styles.statCard}>
            <h4>Total Sessions</h4>
            <p className={styles.statValue}>{workspaces.length}</p>
            <div className={`${styles.statChange} ${styles.statChangePositive}`}>
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M12 7a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0V8.414l-4.293 4.293a1 1 0 01-1.414 0L8 10.414l-4.293 4.293a1 1 0 01-1.414-1.414l5-5a1 1 0 011.414 0L11 10.586 14.586 7H12z" clipRule="evenodd" />
              </svg>
              <span>12% this month</span>
            </div>
          </div>
          <div className={styles.statCard}>
            <h4>Data Analyzed</h4>
            <p className={styles.statValue}>2.4 GB</p>
            <div className={`${styles.statChange} ${styles.statChangePositive}`}>
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M12 7a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0V8.414l-4.293 4.293a1 1 0 01-1.414 0L8 10.414l-4.293 4.293a1 1 0 01-1.414-1.414l5-5a1 1 0 011.414 0L11 10.586 14.586 7H12z" clipRule="evenodd" />
              </svg>
              <span>8.3% this month</span>
            </div>
          </div>
          <div className={styles.statCard}>
            <h4>AI Insights Generated</h4>
            <p className={styles.statValue}>{activityStats.insightsGenerated}</p>
            <div className={`${styles.statChange} ${activityStats.insightsChange >= 0 ? styles.statChangePositive : styles.statChangeNegative}`}>
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d={activityStats.insightsChange >= 0 
                  ? "M12 7a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0V8.414l-4.293 4.293a1 1 0 01-1.414 0L8 10.414l-4.293 4.293a1 1 0 01-1.414-1.414l5-5a1 1 0 011.414 0L11 10.586 14.586 7H12z" 
                  : "M12 13a1 1 0 100 2h5a1 1 0 001-1V9a1 1 0 10-2 0v3.586l-4.293-4.293a1 1 0 00-1.414 0L8 9.586 3.707 5.293a1 1 0 00-1.414 1.414l5 5a1 1 0 001.414 0L11 9.414 14.586 13H12z"} 
                  clipRule="evenodd" />
              </svg>
              <span>{Math.abs(activityStats.insightsChange)}% this month</span>
            </div>
          </div>
          <div className={styles.statCard}>
            <h4>Reports Exported</h4>
            <p className={styles.statValue}>{activityStats.reportsGenerated}</p>
            <div className={`${styles.statChange} ${activityStats.reportsChange >= 0 ? styles.statChangePositive : styles.statChangeNegative}`}>
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d={activityStats.reportsChange >= 0 
                  ? "M12 7a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0V8.414l-4.293 4.293a1 1 0 01-1.414 0L8 10.414l-4.293 4.293a1 1 0 01-1.414-1.414l5-5a1 1 0 011.414 0L11 10.586 14.586 7H12z" 
                  : "M12 13a1 1 0 100 2h5a1 1 0 001-1V9a1 1 0 10-2 0v3.586l-4.293-4.293a1 1 0 00-1.414 0L8 9.586 3.707 5.293a1 1 0 00-1.414 1.414l5 5a1 1 0 001.414 0L11 9.414 14.586 13H12z"} 
                  clipRule="evenodd" />
              </svg>
              <span>{Math.abs(activityStats.reportsChange)}% this month</span>
            </div>
          </div>
        </div>


        {/* Workspaces Section */}
        <div className={styles.dashboardSection}>
          <div className={styles.sectionHeader}>
            <h3>Your Workspaces</h3>
          </div>
          
          {loading ? (
            <p>Loading workspaces...</p>
          ) : error ? (
            <p className={styles.error}>{error}</p>
          ) : (
            <div>
              {workspaces.length === 0 && (
                <div className={styles.emptyState}>
                  <h4>No sessions found</h4>
                  <p>Create your first session by clicking the card below</p>
                </div>
              )}
              
              <div className={styles.workspaceGrid}>
                {/* Create Workspace Card - Always show this */}                <button 
                  type="button"
                  className={`${styles.workspaceCard} ${styles.createCard}`}
                  onClick={() => setModalOpen(true)}
                  aria-label="Create new workspace"
                  title="Create new workspace"
                >
                  <div className={styles.createCardIcon}>
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                  </div>
                  <h4 className={styles.workspaceTitle}>Create Workspace</h4>
                </button>
                
                {/* Workspace Cards */}                {workspaces.map((workspace) => (
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
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        setSelectedDescription(workspace.description);
                        setIsDescriptionPopupOpen(true);
                      }}
                      aria-label="View workspace description"
                      title="View workspace description"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                    </button>
                    <button 
                      className={styles.actionButton}
                      onClick={(e) => startEditing(workspace, e)}
                      aria-label="Edit workspace title"
                      title="Edit workspace title"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                    </button>                    <button 
                      className={`${styles.actionButton} ${styles.deleteButton}`}
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        setDeleteConfirmWorkspace(workspace._id);
                      }}
                      aria-label="Delete workspace"
                      title="Delete workspace"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                  {editingWorkspace === workspace._id ? (                    <input
                      className={styles.editTitleInput}
                      value={editTitle}
                      onChange={(e) => setEditTitle(e.target.value)}
                      onKeyDown={(e) => handleTitleKeyDown(e, workspace._id)}
                      onBlur={() => handleTitleBlur(workspace._id)}
                      autoFocus
                      onClick={(e) => e.preventDefault()}
                      aria-label="Edit workspace title"
                      title="Edit workspace title"
                      placeholder="Enter workspace title"
                    />
                  ) : (
                    <h4 className={styles.workspaceTitle}>{workspace.name}</h4>
                  )}
                  
                  <div className={styles.workspaceFooter}>
                    <div className={styles.workspaceDate}>
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      Created {formatDate(workspace.createdAt)}
                    </div>
                    <button 
                      className={styles.descriptionButton}
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        setSelectedDescription(workspace.description);
                        setIsDescriptionPopupOpen(true);
                      }}
                      aria-label="View workspace description"
                      title="View workspace description"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h1m4 4h-1v-4h1m-9 8h10a2 2 0 002-2v-3H4v3a2 2 0 002 2zM16 4h-1V2h-4v2H8a2 2 0 00-2 2v3h12V6a2 2 0 00-2-2z" />
                      </svg>
                    </button>
                  </div>
                </div>
                ))}
              </div>
            </div>
          )}
        </div>
        
        {/* Activity Button */}
        <div className={styles.activityButton}>          <button 
            className={styles.activityButtonInner}
            onClick={() => setActivitySidebarOpen(true)}
            aria-label="Open activity history"
            title="View activity history"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            View Activity History
            {activities.length > 0 && <span className={styles.activityBadge}>{activities.length}</span>}
          </button>
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

      {/* Activity Sidebar */}
      <div className={`${styles.activityBackdrop} ${activitySidebarOpen ? styles.open : ''}`} 
           onClick={() => setActivitySidebarOpen(false)}>
      </div>
      
      {/* Description Popup */}
      <DescriptionPopup
        description={selectedDescription || ''}
        isOpen={isDescriptionPopupOpen}
        onClose={() => {
          setIsDescriptionPopupOpen(false);
          setSelectedDescription(null);
        }}
      />
      
      <div className={`${styles.activitySidebar} ${activitySidebarOpen ? styles.open : ''}`}>
        <div className={styles.activitySidebarHeader}>
          <h3>Activity History</h3>          <button 
            className={styles.closeActivitySidebar}
            onClick={() => setActivitySidebarOpen(false)}
            aria-label="Close activity sidebar"
            title="Close activity sidebar"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" width="20" height="20" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div className={styles.activitySidebarContent}>
          {activities.length > 0 ? (
            activities.map((activity) => (
              <div key={activity.id} className={styles.activityItem}>
                <div className={styles.activityIcon}>
                  {activity.type === 'workspace_created' ? (
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  )}
                </div>
                <div className={styles.activityContent}>
                  <p className={styles.activityTitle}>
                    {activity.type === 'workspace_created' ? (
                      <>New workspace created: "{activity.workspace.name}"</>
                    ) : (
                      <>Generated report on {activity.report.fileName} in "{activity.workspace.name}"</>
                    )}
                  </p>
                  <p className={styles.activityTime}>
                    {formatDateTime(activity.timestamp)}
                  </p>
                </div>
              </div>
            ))
          ) : (
            <div className={styles.emptyActivity}>
              <p>No activity records found.</p>
            </div>
          )}
        </div>
      </div>

      {/* Description Popup */}
      {isDescriptionPopupOpen && (
        <DescriptionPopup 
          description={selectedDescription || ''}
          onClose={() => setIsDescriptionPopupOpen(false)}
          isOpen={isDescriptionPopupOpen}
        />
      )}
    </div>
  );
}