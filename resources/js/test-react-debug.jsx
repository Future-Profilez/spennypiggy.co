const ReactDebugTest = () => {
    console.log('=== React Debug Test ===');
    console.log('React available:', typeof React !== 'undefined');
    console.log('React object:', React);
    
    // Enhanced React inspection
    // Check React version
    

    // Check if this is development vs production
    console.log('NODE_ENV:', process.env.NODE_ENV);
    console.log('Development mode:', process.env.NODE_ENV !== 'production');
    
    // Check for multiple React instances
    const reactInstances = [];
    if (window.React) reactInstances.push('window.React');
    if (typeof global !== 'undefined' && global.React) reactInstances.push('global.React');
    console.log('React instances found:', reactInstances);
    
    return (
        <div style={{
            padding: '20px',
            border: '2px solid #f00',
            margin: '20px',
            backgroundColor: '#fff',
            color: '#000',
            fontFamily: 'monospace',
            fontSize: '12px'
        }}>
            <h3>React Debug Test Component</h3>
            <div>
            </div>
        </div>
    );
};

export default ReactDebugTest;
