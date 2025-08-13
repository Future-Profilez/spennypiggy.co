// Minimal React test to diagnose Children property error
import { createElement, useState } from 'react';
import { createRoot } from 'react-dom/client';

// Test basic React functionality without complex dependencies
const TestApp = () => {
    const [count, setCount] =  useState(0);
    
    return  createElement('div', 
        { 
            style: { 
                padding: '20px', 
                backgroundColor: '#f0f0f0', 
                margin: '20px',
                border: '2px solid green'
            } 
        },
        createElement('h1', null, 'React Diagnosis Test'),
        createElement('p', null, `React-DOM available: ${typeof createRoot !== 'undefined' ? 'Yes' : 'No'}`),
        createElement('p', null, `Count: ${count}`),
        createElement('button', 
            { 
                onClick: () => setCount(c => c + 1),
                style: { padding: '10px', margin: '5px' }
            }, 
            'Increment Counter'
        ),
        createElement('p', null, 'If you can see this and the counter works, React is functioning correctly!')
    );
};

// Minimal test without JSX to avoid any JSX transform issues
function runReactTest() {
    try {
        console.log('🔍 Running React diagnosis...');
        console.log('React:', React);
        console.log('createRoot:', createRoot);
        
        // Create test container
        let testContainer = document.getElementById('react-test-container');
        if (!testContainer) {
            testContainer = document.createElement('div');
            testContainer.id = 'react-test-container';
            testContainer.style.cssText = 'border: 2px solid blue; margin: 10px; padding: 10px;';
            document.body.appendChild(testContainer);
        }
        
        // Create React root
        const root = createRoot(testContainer);
        console.log('✅ createRoot successful');
        
        // Render test component
        root.render( createElement(TestApp));
        console.log('✅ render successful');
        
        return true;
        
    } catch (error) {
        console.error('❌ React test failed:', error);
        
        // Create error display
        const errorDiv = document.createElement('div');
        errorDiv.style.cssText = 'border: 2px solid red; padding: 20px; margin: 20px; background: #ffebee;';
        errorDiv.innerHTML = `
            <h2>🚨 React Error Detected:</h2>
            <p><strong>Error Type:</strong> ${error.constructor.name}</p>
            <p><strong>Message:</strong> ${error.message}</p>
            <p><strong>Stack Trace:</strong></p>
            <pre style="background: #f5f5f5; padding: 10px; overflow: auto; font-size: 12px;">${error.stack}</pre>
        `;
        document.body.appendChild(errorDiv);
        
        return false;
    }
}

// Run test when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', runReactTest);
} else {
    runReactTest();
}

export default TestApp;
