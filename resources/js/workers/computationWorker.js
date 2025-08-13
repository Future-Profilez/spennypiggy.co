// Web Worker for heavy computational tasks
// This helps reduce Total Blocking Time (TBT) by offloading CPU-intensive work

self.onmessage = function(e) {
    const { type, data } = e.data;
    
    try {
        let result;
        
        switch (type) {
            case 'PROCESS_LARGE_DATASET':
                result = processLargeDataset(data);
                break;
                
            case 'CALCULATE_STATISTICS':
                result = calculateStatistics(data);
                break;
                
            case 'FILTER_AND_SORT':
                result = filterAndSort(data);
                break;
                
            case 'IMAGE_PROCESSING':
                result = processImageData(data);
                break;
                
            case 'SEARCH_INDEXING':
                result = createSearchIndex(data);
                break;
                
            case 'DATA_AGGREGATION':
                result = aggregateData(data);
                break;
                
            case 'CHART_DATA_PROCESSING':
                result = processChartData(data);
                break;
                
            default:
                throw new Error(`Unknown task type: ${type}`);
        }
        
        // Send result back to main thread
        self.postMessage({
            type: 'SUCCESS',
            taskType: type,
            result: result
        });
        
    } catch (error) {
        // Send error back to main thread
        self.postMessage({
            type: 'ERROR',
            taskType: type,
            error: error.message
        });
    }
};

// Process large datasets without blocking the main thread
function processLargeDataset(data) {
    const { items, transformFn } = data;
    const result = [];
    
    // Process in chunks to avoid blocking
    const chunkSize = 100;
    for (let i = 0; i < items.length; i += chunkSize) {
        const chunk = items.slice(i, i + chunkSize);
        
        for (const item of chunk) {
            try {
                const transformed = transformItem(item, transformFn);
                if (transformed) {
                    result.push(transformed);
                }
            } catch (error) {
                console.warn('Error processing item:', error);
                continue;
            }
        }
        
        // Report progress
        if (i % 1000 === 0) {
            self.postMessage({
                type: 'PROGRESS',
                progress: Math.min((i / items.length) * 100, 100)
            });
        }
    }
    
    return result;
}

// Transform individual items based on transformation function
function transformItem(item, transformFnString) {
    if (!transformFnString) return item;
    
    try {
        // Create function from string (be careful with security)
        const transformFn = new Function('item', transformFnString);
        return transformFn(item);
    } catch (error) {
        return item; // Return original if transformation fails
    }
}

// Calculate complex statistics
function calculateStatistics(data) {
    const { numbers, calculateOptions } = data;
    
    if (!Array.isArray(numbers) || numbers.length === 0) {
        return null;
    }
    
    const sorted = numbers.slice().sort((a, b) => a - b);
    const sum = numbers.reduce((acc, val) => acc + val, 0);
    const mean = sum / numbers.length;
    
    // Calculate variance and standard deviation
    const variance = numbers.reduce((acc, val) => acc + Math.pow(val - mean, 2), 0) / numbers.length;
    const standardDeviation = Math.sqrt(variance);
    
    // Calculate median
    const median = sorted.length % 2 === 0
        ? (sorted[sorted.length / 2 - 1] + sorted[sorted.length / 2]) / 2
        : sorted[Math.floor(sorted.length / 2)];
    
    // Calculate quartiles
    const q1 = sorted[Math.floor(sorted.length * 0.25)];
    const q3 = sorted[Math.floor(sorted.length * 0.75)];
    
    return {
        count: numbers.length,
        sum,
        mean,
        median,
        variance,
        standardDeviation,
        min: sorted[0],
        max: sorted[sorted.length - 1],
        q1,
        q3,
        range: sorted[sorted.length - 1] - sorted[0]
    };
}

// Filter and sort large arrays
function filterAndSort(data) {
    const { items, filters, sortBy, sortOrder = 'asc' } = data;
    
    let filtered = items;
    
    // Apply filters
    if (filters && Array.isArray(filters)) {
        filtered = items.filter(item => {
            return filters.every(filter => {
                const { field, operator, value } = filter;
                const itemValue = getNestedValue(item, field);
                
                switch (operator) {
                    case 'eq':
                        return itemValue === value;
                    case 'ne':
                        return itemValue !== value;
                    case 'gt':
                        return itemValue > value;
                    case 'gte':
                        return itemValue >= value;
                    case 'lt':
                        return itemValue < value;
                    case 'lte':
                        return itemValue <= value;
                    case 'contains':
                        return String(itemValue).toLowerCase().includes(String(value).toLowerCase());
                    case 'startsWith':
                        return String(itemValue).toLowerCase().startsWith(String(value).toLowerCase());
                    default:
                        return true;
                }
            });
        });
    }
    
    // Apply sorting
    if (sortBy) {
        filtered.sort((a, b) => {
            const aVal = getNestedValue(a, sortBy);
            const bVal = getNestedValue(b, sortBy);
            
            let comparison = 0;
            if (aVal > bVal) comparison = 1;
            if (aVal < bVal) comparison = -1;
            
            return sortOrder === 'desc' ? comparison * -1 : comparison;
        });
    }
    
    return filtered;
}

// Get nested object value by path
function getNestedValue(obj, path) {
    return path.split('.').reduce((current, key) => current?.[key], obj);
}

// Process image data (for canvas operations, etc.)
function processImageData(data) {
    const { imageData, operation, options } = data;
    
    switch (operation) {
        case 'brightness':
            return adjustBrightness(imageData, options.factor);
        case 'contrast':
            return adjustContrast(imageData, options.factor);
        case 'grayscale':
            return convertToGrayscale(imageData);
        default:
            return imageData;
    }
}

// Adjust image brightness
function adjustBrightness(imageData, factor) {
    const data = imageData.data;
    
    for (let i = 0; i < data.length; i += 4) {
        data[i] = Math.min(255, data[i] * factor);     // Red
        data[i + 1] = Math.min(255, data[i + 1] * factor); // Green
        data[i + 2] = Math.min(255, data[i + 2] * factor); // Blue
        // Alpha channel (data[i + 3]) remains unchanged
    }
    
    return imageData;
}

// Adjust image contrast
function adjustContrast(imageData, factor) {
    const data = imageData.data;
    
    for (let i = 0; i < data.length; i += 4) {
        data[i] = ((data[i] / 255 - 0.5) * factor + 0.5) * 255;
        data[i + 1] = ((data[i + 1] / 255 - 0.5) * factor + 0.5) * 255;
        data[i + 2] = ((data[i + 2] / 255 - 0.5) * factor + 0.5) * 255;
    }
    
    return imageData;
}

// Convert to grayscale
function convertToGrayscale(imageData) {
    const data = imageData.data;
    
    for (let i = 0; i < data.length; i += 4) {
        const gray = data[i] * 0.299 + data[i + 1] * 0.587 + data[i + 2] * 0.114;
        data[i] = gray;     // Red
        data[i + 1] = gray; // Green
        data[i + 2] = gray; // Blue
    }
    
    return imageData;
}

// Create search index
function createSearchIndex(data) {
    const { items, searchFields } = data;
    const index = new Map();
    
    items.forEach((item, itemIndex) => {
        searchFields.forEach(field => {
            const value = getNestedValue(item, field);
            if (value) {
                const words = String(value).toLowerCase().split(/\s+/);
                words.forEach(word => {
                    if (word.length > 2) { // Skip very short words
                        if (!index.has(word)) {
                            index.set(word, []);
                        }
                        index.get(word).push({
                            itemIndex,
                            field,
                            value
                        });
                    }
                });
            }
        });
    });
    
    // Convert Map to object for JSON serialization
    return Object.fromEntries(index);
}

// Aggregate data for reports
function aggregateData(data) {
    const { items, groupBy, aggregations } = data;
    const groups = new Map();
    
    // Group items
    items.forEach(item => {
        const groupKey = groupBy.map(field => getNestedValue(item, field)).join('|');
        
        if (!groups.has(groupKey)) {
            groups.set(groupKey, []);
        }
        groups.get(groupKey).push(item);
    });
    
    // Apply aggregations
    const result = [];
    groups.forEach((groupItems, groupKey) => {
        const aggregated = {
            groupKey,
            count: groupItems.length,
            items: groupItems
        };
        
        aggregations.forEach(agg => {
            const { field, operation } = agg;
            const values = groupItems.map(item => getNestedValue(item, field)).filter(v => v != null);
            
            switch (operation) {
                case 'sum':
                    aggregated[`${field}_sum`] = values.reduce((acc, val) => acc + Number(val), 0);
                    break;
                case 'avg':
                    aggregated[`${field}_avg`] = values.reduce((acc, val) => acc + Number(val), 0) / values.length;
                    break;
                case 'min':
                    aggregated[`${field}_min`] = Math.min(...values);
                    break;
                case 'max':
                    aggregated[`${field}_max`] = Math.max(...values);
                    break;
            }
        });
        
        result.push(aggregated);
    });
    
    return result;
}

// Process chart data
function processChartData(data) {
    const { rawData, chartType, options } = data;
    
    switch (chartType) {
        case 'line':
            return processLineChartData(rawData, options);
        case 'bar':
            return processBarChartData(rawData, options);
        case 'pie':
            return processPieChartData(rawData, options);
        default:
            return rawData;
    }
}

// Process line chart data
function processLineChartData(rawData, options) {
    const { xField, yFields, dateFormat } = options;
    
    return rawData.map(item => ({
        x: xField && item[xField] ? new Date(item[xField]).toISOString() : item.x,
        ...yFields.reduce((acc, field) => {
            acc[field] = Number(item[field]) || 0;
            return acc;
        }, {})
    }));
}

// Process bar chart data
function processBarChartData(rawData, options) {
    const { categoryField, valueField } = options;
    
    const grouped = rawData.reduce((acc, item) => {
        const category = item[categoryField];
        const value = Number(item[valueField]) || 0;
        
        if (!acc[category]) {
            acc[category] = 0;
        }
        acc[category] += value;
        
        return acc;
    }, {});
    
    return Object.entries(grouped).map(([category, value]) => ({
        category,
        value
    }));
}

// Process pie chart data
function processPieChartData(rawData, options) {
    const { labelField, valueField } = options;
    
    const total = rawData.reduce((sum, item) => sum + (Number(item[valueField]) || 0), 0);
    
    return rawData.map(item => ({
        label: item[labelField],
        value: Number(item[valueField]) || 0,
        percentage: ((Number(item[valueField]) || 0) / total * 100).toFixed(2)
    }));
}
