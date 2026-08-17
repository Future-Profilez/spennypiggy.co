/**
 * Simple Chart Component
 * This is a placeholder component to resolve the build error
 */
const Chart = ({ data, type = 'line', className = '' }) => {
    return (
        <div className={`chart-container ${className}`}>
            <div className="bg-gray-100 p-4 rounded-box   ">
                <h3 className="text-lg font-medium text-gray-900 mb-2">Chart Component</h3>
                <p className="text-gray-600">Chart visualization will be implemented here</p>
                <div className="mt-2 text-sm text-gray-500">
                    Type: {type}, Data points: {data?.length || 0}
                </div>
            </div>
        </div>
    );
};

export default Chart;
