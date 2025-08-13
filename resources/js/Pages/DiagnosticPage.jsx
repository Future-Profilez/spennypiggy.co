const DiagnosticPage = () => {
    return (
        <div style={{ padding: '20px', fontFamily: 'Arial, sans-serif' }}>
            <h1 style={{ color: 'green' }}>React JSX Test Page</h1>
            <p>If you can see this page, React JSX is working correctly!</p>
            <div style={{ background: '#f0f0f0', padding: '10px', margin: '10px 0' }}>
                <h3>React Info:</h3>
                <ul>
                    <li>JSX Runtime: Classic</li>
                    <li>Environment: {process.env.NODE_ENV || 'development'}</li>
                </ul>
            </div>
            <button 
                onClick={() => alert('React event handling works!')}
                style={{
                    padding: '10px 20px',
                    backgroundColor: '#007bff',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer'
                }}
            >
                Test Event Handler
            </button>
        </div>
    );
};

export default DiagnosticPage;
