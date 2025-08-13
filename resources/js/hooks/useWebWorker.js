import { useCallback, useEffect, useRef, useState } from 'react';

/**
 * Hook for managing Web Workers to offload heavy computations
 * This helps reduce Total Blocking Time (TBT) by moving CPU-intensive work off the main thread
 */
export const useWebWorker = () => {
    const workerRef = useRef(null);
    const [isSupported, setIsSupported] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);

    useEffect(() => {
        // Check if Web Workers are supported
        if (typeof Worker !== 'undefined') {
            setIsSupported(true);
            // Create worker instance
            try {
                workerRef.current = new Worker('/js/workers/computationWorker.js');
                
                workerRef.current.onerror = (error) => {
                    console.error('Worker error:', error);
                    setError(error);
                    setIsLoading(false);
                };

            } catch (err) {
                console.error('Failed to create worker:', err);
                setIsSupported(false);
                setError(err);
            }
        }

        return () => {
            if (workerRef.current) {
                workerRef.current.terminate();
            }
        };
    }, []);

    const runWorkerTask = useCallback(async (taskType, data, options = {}) => {
        if (!isSupported || !workerRef.current) {
            // Fallback to main thread if worker not available
            return runOnMainThread(taskType, data);
        }

        return new Promise((resolve, reject) => {
            setIsLoading(true);
            setError(null);

            const timeout = options.timeout || 30000; // 30 second default timeout
            let timeoutId;

            const handleMessage = (e) => {
                const { type, taskType: responseTaskType, result, error } = e.data;

                if (responseTaskType === taskType) {
                    clearTimeout(timeoutId);
                    workerRef.current.removeEventListener('message', handleMessage);
                    setIsLoading(false);

                    if (type === 'SUCCESS') {
                        resolve(result);
                    } else if (type === 'ERROR') {
                        reject(new Error(error));
                    } else if (type === 'PROGRESS' && options.onProgress) {
                        options.onProgress(e.data.progress);
                    }
                }
            };

            workerRef.current.addEventListener('message', handleMessage);

            // Set timeout
            timeoutId = setTimeout(() => {
                workerRef.current.removeEventListener('message', handleMessage);
                setIsLoading(false);
                reject(new Error('Worker task timed out'));
            }, timeout);

            // Send task to worker
            workerRef.current.postMessage({
                type: taskType,
                data
            });
        });
    }, [isSupported]);

    // Specific task methods
    const processLargeDataset = useCallback(async (items, transformFn, options = {}) => {
        return runWorkerTask('PROCESS_LARGE_DATASET', { items, transformFn }, options);
    }, [runWorkerTask]);

    const calculateStatistics = useCallback(async (numbers, calculateOptions = {}) => {
        return runWorkerTask('CALCULATE_STATISTICS', { numbers, calculateOptions });
    }, [runWorkerTask]);

    const filterAndSort = useCallback(async (items, filters, sortBy, sortOrder = 'asc') => {
        return runWorkerTask('FILTER_AND_SORT', { items, filters, sortBy, sortOrder });
    }, [runWorkerTask]);

    const processImageData = useCallback(async (imageData, operation, options = {}) => {
        return runWorkerTask('IMAGE_PROCESSING', { imageData, operation, options });
    }, [runWorkerTask]);

    const createSearchIndex = useCallback(async (items, searchFields) => {
        return runWorkerTask('SEARCH_INDEXING', { items, searchFields });
    }, [runWorkerTask]);

    const aggregateData = useCallback(async (items, groupBy, aggregations) => {
        return runWorkerTask('DATA_AGGREGATION', { items, groupBy, aggregations });
    }, [runWorkerTask]);

    const processChartData = useCallback(async (rawData, chartType, options = {}) => {
        return runWorkerTask('CHART_DATA_PROCESSING', { rawData, chartType, options });
    }, [runWorkerTask]);

    return {
        isSupported,
        isLoading,
        error,
        processLargeDataset,
        calculateStatistics,
        filterAndSort,
        processImageData,
        createSearchIndex,
        aggregateData,
        processChartData,
        runWorkerTask
    };
};

// Fallback functions for when Web Workers are not supported
const runOnMainThread = (taskType, data) => {
    return new Promise((resolve) => {
        // Use setTimeout to avoid blocking the main thread completely
        setTimeout(() => {
            try {
                let result;
                
                switch (taskType) {
                    case 'PROCESS_LARGE_DATASET':
                        result = processLargeDatasetMainThread(data);
                        break;
                    case 'CALCULATE_STATISTICS':
                        result = calculateStatisticsMainThread(data);
                        break;
                    case 'FILTER_AND_SORT':
                        result = filterAndSortMainThread(data);
                        break;
                    default:
                        result = data;
                }
                
                resolve(result);
            } catch (error) {
                resolve(null);
            }
        }, 0);
    });
};

// Simplified main thread fallbacks
const processLargeDatasetMainThread = ({ items, transformFn }) => {
    if (!transformFn) return items;
    
    try {
        const transform = new Function('item', transformFn);
        return items.map(transform);
    } catch {
        return items;
    }
};

const calculateStatisticsMainThread = ({ numbers }) => {
    if (!Array.isArray(numbers) || numbers.length === 0) return null;
    
    const sum = numbers.reduce((acc, val) => acc + val, 0);
    const mean = sum / numbers.length;
    const sorted = [...numbers].sort((a, b) => a - b);
    
    return {
        count: numbers.length,
        sum,
        mean,
        min: sorted[0],
        max: sorted[sorted.length - 1],
        median: sorted.length % 2 === 0
            ? (sorted[sorted.length / 2 - 1] + sorted[sorted.length / 2]) / 2
            : sorted[Math.floor(sorted.length / 2)]
    };
};

const filterAndSortMainThread = ({ items, filters, sortBy, sortOrder }) => {
    let result = items;
    
    // Basic filtering (simplified)
    if (filters && Array.isArray(filters)) {
        result = items.filter(item => {
            return filters.every(filter => {
                const value = item[filter.field];
                switch (filter.operator) {
                    case 'eq': return value === filter.value;
                    case 'contains': return String(value).includes(filter.value);
                    default: return true;
                }
            });
        });
    }
    
    // Basic sorting
    if (sortBy) {
        result.sort((a, b) => {
            const aVal = a[sortBy];
            const bVal = b[sortBy];
            let comparison = aVal > bVal ? 1 : aVal < bVal ? -1 : 0;
            return sortOrder === 'desc' ? comparison * -1 : comparison;
        });
    }
    
    return result;
};

/**
 * Hook for batching heavy operations to reduce TBT
 */
export const useBatchedOperations = () => {
    const [queue, setQueue] = useState([]);
    const [isProcessing, setIsProcessing] = useState(false);
    const processingRef = useRef(false);

    const addToQueue = useCallback((operation, data, callback) => {
        setQueue(prev => [...prev, { operation, data, callback, id: Date.now() }]);
    }, []);

    const processBatch = useCallback(async () => {
        if (processingRef.current || queue.length === 0) return;
        
        processingRef.current = true;
        setIsProcessing(true);

        const batch = queue.slice(0, 10); // Process 10 at a time
        setQueue(prev => prev.slice(10));

        // Use requestIdleCallback if available
        if (window.requestIdleCallback) {
            window.requestIdleCallback(async () => {
                for (const item of batch) {
                    try {
                        const result = await item.operation(item.data);
                        item.callback(null, result);
                    } catch (error) {
                        item.callback(error, null);
                    }
                }
                processingRef.current = false;
                setIsProcessing(false);
            });
        } else {
            // Fallback to setTimeout
            setTimeout(async () => {
                for (const item of batch) {
                    try {
                        const result = await item.operation(item.data);
                        item.callback(null, result);
                    } catch (error) {
                        item.callback(error, null);
                    }
                }
                processingRef.current = false;
                setIsProcessing(false);
            }, 0);
        }
    }, [queue]);

    useEffect(() => {
        if (queue.length > 0 && !processingRef.current) {
            processBatch();
        }
    }, [queue, processBatch]);

    return {
        addToQueue,
        queueLength: queue.length,
        isProcessing
    };
};
