// Test file to check server connectivity
// You can run this in the browser console to test if your server is accessible

const testServerConnection = async () => {
  try {
    // Test 1: Check if the server is running
    console.log('Testing server connection...');
    const response = await fetch('http://localhost:5000/');
    const data = await response.json();
    console.log('✅ Server is running:', data);
    
    // Test 2: Check if auth token exists
    const token = localStorage.getItem('token');
    console.log('🔑 Auth token exists:', !!token);
    console.log('Token value:', token ? 'Present' : 'Missing');
    
    // Test 3: Check workspace API endpoint
    if (token) {
      try {
        const workspaceResponse = await fetch('http://localhost:5000/api/workspaces', {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
        console.log('📁 Workspace API status:', workspaceResponse.status);
        if (workspaceResponse.ok) {
          const workspaces = await workspaceResponse.json();
          console.log('✅ Workspaces:', workspaces);
        } else {
          const error = await workspaceResponse.text();
          console.log('❌ Workspace API error:', error);
        }
      } catch (workspaceError) {
        console.log('❌ Workspace API failed:', workspaceError);
      }
    }
    
    return { success: true, serverRunning: true };
  } catch (error) {
    console.log('❌ Server connection failed:', error);
    console.log('💡 Make sure your server is running on port 5000');
    console.log('💡 Run: cd server && npm start');
    return { success: false, serverRunning: false };
  }
};

// Auto-run the test
testServerConnection();

export default testServerConnection;
