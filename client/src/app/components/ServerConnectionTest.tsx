import React, { useState } from 'react';
import { buildApiUrl } from '../utils/apiConfig';

const ServerConnectionTest: React.FC = () => {
  const [testResult, setTestResult] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);

  const testConnection = async () => {
    setIsLoading(true);
    setTestResult('Testing...');

    try {
      // Test 1: Basic server connection
      const baseUrl = buildApiUrl('');
      console.log('Testing base URL:', baseUrl);
      
      const response = await fetch(baseUrl);
      const data = await response.json();
      
      if (response.ok) {
        setTestResult(`✅ Server connected: ${data.message}`);
      } else {
        setTestResult(`❌ Server responded with error: ${response.status}`);
      }

      // Test 2: Auth token
      const token = localStorage.getItem('token');
      console.log('Token exists:', !!token);

      // Test 3: Workspace API
      if (token) {
        const workspaceUrl = buildApiUrl('api/workspaces');
        console.log('Testing workspace URL:', workspaceUrl);
        
        const workspaceResponse = await fetch(workspaceUrl, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        if (workspaceResponse.ok) {
          const workspaces = await workspaceResponse.json();
          setTestResult(prev => prev + `\n✅ Workspace API working: ${workspaces.count || 0} workspaces found`);
        } else {
          const errorText = await workspaceResponse.text();
          setTestResult(prev => prev + `\n❌ Workspace API error: ${workspaceResponse.status} - ${errorText}`);
        }
      } else {
        setTestResult(prev => prev + '\n⚠️ No auth token found');
      }

    } catch (error) {
      setTestResult(`❌ Connection failed: ${error}`);
      console.error('Connection test failed:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div style={{ 
      padding: '1rem', 
      border: '1px solid #ccc', 
      borderRadius: '8px', 
      margin: '1rem 0',
      backgroundColor: '#f9f9f9'
    }}>
      <h3>🔧 Server Connection Test</h3>
      <button 
        onClick={testConnection}
        disabled={isLoading}
        style={{
          padding: '0.5rem 1rem',
          backgroundColor: '#007bff',
          color: 'white',
          border: 'none',
          borderRadius: '4px',
          cursor: isLoading ? 'not-allowed' : 'pointer'
        }}
      >
        {isLoading ? 'Testing...' : 'Test Connection'}
      </button>
      
      {testResult && (
        <pre style={{ 
          marginTop: '1rem', 
          padding: '0.5rem', 
          backgroundColor: '#000', 
          color: '#00ff00',
          borderRadius: '4px',
          fontSize: '0.875rem',
          whiteSpace: 'pre-wrap'
        }}>
          {testResult}
        </pre>
      )}
      
      <div style={{ marginTop: '1rem', fontSize: '0.875rem', color: '#666' }}>
        <strong>Quick fixes:</strong>
        <ul>
          <li>Make sure your server is running: <code>cd server && npm start</code></li>
          <li>Check if port 5000 is available</li>
          <li>Verify you're logged in (auth token exists)</li>
          <li>Check browser console for detailed errors</li>
        </ul>
      </div>
    </div>
  );
};

export default ServerConnectionTest;
