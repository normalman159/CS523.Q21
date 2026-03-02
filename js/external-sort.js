class ExternalSort {
    constructor(memoryLimit = 10000) {

        this.memoryLimit = memoryLimit;
        this.chunks = [];
        this.sortedData = [];
    }

    async sort(data) {
        this.divideAndSortChunks(data);
        this.sortedData = this.mergeChunks(this.chunks);

        return this.sortedData;
    }

    mergeChunks(chunks) {
        if (chunks.length === 0) return [];
        if (chunks.length === 1) return chunks[0];

        let result = chunks[0];
        for (let i = 1; i < chunks.length; i++) {
            result = this.merge2Arrays(result, chunks[i]);
        }
        return result;
    }

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

    divideAndSortChunks(data) {
        this.chunks = [];
        for (let i = 0; i < data.length; i += this.memoryLimit) {
            const chunk = data.slice(i, i + this.memoryLimit);
            const sortedChunk = this.sortChunk(chunk);
            this.chunks.push(sortedChunk);
        }
    }

    sortChunk(chunk) {
        const arr = [...chunk];
        this.quickSort(arr, 0, arr.length - 1);
        return arr;
    }

    quickSort(arr, low, high) {
        if (low < high) {
            const pi = this.partition(arr, low, high);
            this.quickSort(arr, low, pi - 1);
            this.quickSort(arr, pi + 1, high);
        }
    }

    partition(arr, low, high) {
        const midIndex = Math.floor((low + high) / 2);
        [arr[midIndex], arr[high]] = [arr[high], arr[midIndex]];
        const pivot = arr[high];
        let i = low - 1;
        for (let j = low; j < high; j++) {
            if (arr[j] < pivot) {
                i++;
                [arr[i], arr[j]] = [arr[j], arr[i]];
            }
        }

        [arr[i + 1], arr[high]] = [arr[high], arr[i + 1]];
        return i + 1;
    }

    reset() {
        this.chunks = [];
        this.sortedData = [];
    }
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = { ExternalSort };
}
