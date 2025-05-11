'use client';

import { buildApiUrl } from '../utils/apiConfig';

interface ActivityStats {
  reportsGenerated: number;
  insightsGenerated: number;
  reportsChange: number;
  insightsChange: number;
}

/**
 * Get activity statistics for the current user
 */
export async function getActivityStats(): Promise<ActivityStats> {
  try {
    const token = localStorage.getItem('token');
    if (!token) {
      throw new Error('Authentication required');
    }

    const response = await fetch(buildApiUrl('/api/activity/stats'), {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.message || 'Failed to fetch activity stats');
    }

    return result.data;
  } catch (error) {
    console.error('Error fetching activity stats:', error);
    // Return default values if there's an error
    return {
      reportsGenerated: 0,
      insightsGenerated: 0,
      reportsChange: 0,
      insightsChange: 0,
    };
  }
}

/**
 * Log report generation activity
 */
export async function logReportGeneration(workspaceId: string, insightId: string, reportType: string): Promise<void> {
  try {
    const token = localStorage.getItem('token');
    if (!token) {
      throw new Error('Authentication required');
    }

    const response = await fetch(buildApiUrl(`/api/workspaces/${workspaceId}/report`), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        insightId,
        reportType,
      }),
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.message || 'Failed to log report generation');
    }

    return result.data;
  } catch (error) {
    console.error('Error logging report generation:', error);
    throw error;
  }
} 