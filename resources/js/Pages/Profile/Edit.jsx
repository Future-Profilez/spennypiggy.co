import { Head } from '@inertiajs/react';

export default function Edit({ auth, mustVerifyEmail, status }) {
    return (
        <div>
            <Head title="Profile" />
            <div style={{ 
                padding: '20px', 
                fontFamily: 'Arial, sans-serif',
                backgroundColor: '#f5f5f5',
                minHeight: '100dvh'
            }}>
                <h1 style={{ color: '#333' }}>Profile Page - Minimal Debug Mode</h1>
                <p style={{ color: '#666' }}>Testing without AuthenticatedLayout to isolate JSX runtime issue.</p>
                <div style={{ 
                    backgroundColor: 'white', 
                    padding: '20px', 
                    borderRadius: '8px',
                    marginTop: '20px',
                }}>
                    <h2 style={{ color: '#333' }}>User Information</h2>
                    <p style={{ color: '#666' }}>User: {auth?.user?.name || 'Unknown'}</p>
                    <p style={{ color: '#666' }}>Email: {auth?.user?.email || 'Unknown'}</p>
                    <p style={{ color: '#666' }}>ID: {auth?.user?.id || 'Unknown'}</p>
                </div>
                <div style={{ 
                    backgroundColor: '#e8f5e8', 
                    padding: '15px', 
                    borderRadius: '8px',
                    marginTop: '20px',
                    border: '1px solid #4caf50'
                }}>
                    <p style={{ color: '#2e7d32', margin: 0 }}>✅ If you can see this page without errors, the basic React rendering is working.</p>
                </div>
            </div>
        </div>
    );
}
