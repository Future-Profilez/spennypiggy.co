const ReactDebugTest = () => {
    
    // Enhanced React inspection
    // Check React version

    
    // Check for multiple React instances
    const reactInstances = [];
    if (window.React) reactInstances.push('window.React');
    if (typeof global !== 'undefined' && global.React) reactInstances.push('global.React');
    
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
