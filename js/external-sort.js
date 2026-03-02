/**
 * External Sorting Algorithm Implementation
 * 
 * Implements external merge sort for large datasets that don't fit in memory
 * Phases:
 * 1. Divide: Split input into sorted chunks
 * 2. Sort: Sort each chunk in memory
 * 3. Flatten sorted chunks (merge visualization handled in app.js)
 */

class ExternalSort {
    constructor(memoryLimit = 10000) {
        // Memory limit in bytes or number of elements
        this.memoryLimit = memoryLimit;
        this.chunks = [];
        this.sortedData = [];
    }

    /**
     * Main external sort function
     * @param {Array} data - Input array of numbers
     * @returns {Array} - Sorted array
     */
    async sort(data) {
        // Phase 1: Divide and sort chunks
        this.divideAndSortChunks(data);

        // Phase 2: Merge sorted chunks properly
        this.sortedData = this.mergeChunks(this.chunks);

        return this.sortedData;
    }

    /**
     * Merge all sorted chunks into one sorted array
     * @param {Array<Array>} chunks - Array of sorted chunks
     * @returns {Array} - Merged sorted array
     */
    mergeChunks(chunks) {
        if (chunks.length === 0) return [];
        if (chunks.length === 1) return chunks[0];

        let result = chunks[0];
        for (let i = 1; i < chunks.length; i++) {
            result = this.merge2Arrays(result, chunks[i]);
        }
        return result;
    }

    /**
     * Merge two sorted arrays into one sorted array
     * @param {Array} arr1 - First sorted array
     * @param {Array} arr2 - Second sorted array
     * @returns {Array} - Merged sorted array
     */
    merge2Arrays(arr1, arr2) {
        const merged = [];
        let i = 0, j = 0;

        while (i < arr1.length && j < arr2.length) {
            if (arr1[i] <= arr2[j]) {
                merged.push(arr1[i]);
                i++;
            } else {
                merged.push(arr2[j]);
                j++;
            }
        }

        // Add remaining elements
        while (i < arr1.length) {
            merged.push(arr1[i]);
            i++;
        }

        while (j < arr2.length) {
            merged.push(arr2[j]);
            j++;
        }

        return merged;
    }

    /**
     * Phase 1: Divide input into chunks and sort each chunk
     */
    divideAndSortChunks(data) {
        // Split data into chunks based on memory limit
        this.chunks = [];

        // Divide data into chunks
        for (let i = 0; i < data.length; i += this.memoryLimit) {
            const chunk = data.slice(i, i + this.memoryLimit);

            // Sort each chunk using quicksort
            const sortedChunk = this.sortChunk(chunk);

            // Store chunk (simulate disk write)
            this.chunks.push(sortedChunk);
        }
    }

    /**
     * Helper: Sort single chunk in memory using Quicksort
     */
    sortChunk(chunk) {
        // Create a copy to avoid modifying original
        const arr = [...chunk];
        this.quickSort(arr, 0, arr.length - 1);
        return arr;
    }

    /**
     * Quicksort implementation
     * @param {Array} arr - Array to sort
     * @param {number} low - Left index
     * @param {number} high - Right index
     */
    quickSort(arr, low, high) {
        if (low < high) {
            // Partition and get pivot index
            const pi = this.partition(arr, low, high);

            // Recursively sort left and right parts
            this.quickSort(arr, low, pi - 1);
            this.quickSort(arr, pi + 1, high);
        }
    }

    /**
     * Partition function for quicksort
     * @param {Array} arr - Array to partition
     * @param {number} low - Left index
     * @param {number} high - Right index
     * @returns {number} - Pivot index
     */
    partition(arr, low, high) {
        // Use middle element as pivot (better for nearly sorted data)
        const midIndex = Math.floor((low + high) / 2);
        [arr[midIndex], arr[high]] = [arr[high], arr[midIndex]];

        const pivot = arr[high];
        let i = low - 1;

        for (let j = low; j < high; j++) {
            if (arr[j] < pivot) {
                i++;
                // Swap
                [arr[i], arr[j]] = [arr[j], arr[i]];
            }
        }

        // Place pivot in correct position
        [arr[i + 1], arr[high]] = [arr[high], arr[i + 1]];
        return i + 1;
    }

    /**
     * Reset algorithm state
     */
    reset() {
        this.chunks = [];
        this.sortedData = [];
    }
}

// Export for Node.js
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { ExternalSort };
}
