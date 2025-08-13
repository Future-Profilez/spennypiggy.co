// Safe wrapper for Headless UI Transition to prevent JSX runtime conflicts
const SafeTransition = ({ children, show, enter, enterFrom, leave, leaveTo, ...props }) => {
    // Simple conditional rendering instead of using Headless UI Transition
    // which might be causing JSX runtime conflicts
    if (!show) {
        return null;
    }

    // Apply simple fade transition using CSS classes
    const className = `transition-opacity duration-300 ${show ? 'opacity-100' : 'opacity-0'}`;
    
    return (
        <div className={className} {...props}>
            {children}
        </div>
    );
};

export default SafeTransition;
