/**
 * Visualization Module - External Sorting with Buffers
 * 
 * 2-Column Layout:
 * - Left: Secondary Storage (Pages)
 * - Right: Main Memory (Buffers)
 */

class SortingVisualizer {
    constructor(containerId) {
        this.container = document.getElementById(containerId);
        this.currentStep = 0;
        this.steps = [];
        this.isPlaying = false;
        this.animationSpeed = 1000;
        this.timer = null;
    }

    /**
     * Initialize visualization
     */
    init(bufferCount, pageSize) {
        this.steps = [];
        this.currentStep = 0;
        this.isPlaying = false;
        if (this.timer) {
            clearInterval(this.timer);
            this.timer = null;
        }
        this.container.innerHTML = '';
        this.bufferCount = bufferCount;
        this.pageSize = pageSize;
    }

    /**
     * Record a step showing buffers and pages state
     */
    recordStep(stepData) {
        this.steps.push(stepData);
    }

    /**
     * Record chunk step with pages/buffers format
     */
    recordChunksStep(operation, chunks, metrics = {}) {
        // Handle both old format (arrays) and new format (objects with data and runId)
        const pages = chunks.map((chunk, idx) => {
            const data = chunk.data || chunk; // Support both formats
            const runId = chunk.runId || `Run ${idx + 1}`;
            return {
                id: `P${idx + 1}`,
                data: data,
                status: 'WAITING',
                runId: runId
            };
        });

        const buffers = [];
        for (let i = 0; i < this.bufferCount; i++) {
            buffers.push({
                id: `F${i + 1}`,
                name: i < this.bufferCount - 1 ? `Input Buffer ${i + 1}` : 'Output Buffer',
                data: [],
                status: 'EMPTY'
            });
        }

        this.recordStep({
            operation: operation || 'PROCESS',
            pages: pages,
            buffers: buffers,
            metrics: {
                reads: metrics.reads || 0,
                writes: metrics.writes || 0,
                comparisons: metrics.comparisons || 0
            }
        });
    }

    /**
     * Display current step (pages/buffers 2-column layout)
     */
    displayStep(stepIndex) {
        if (this.steps.length === 0) return;
        const index = Math.max(0, Math.min(stepIndex, this.steps.length - 1));
        this.currentStep = index;

        const step = this.steps[index];
        this.container.innerHTML = '';

        this.displayNewFormat(step, index);
    }

    /**
     * Display new format (pages/buffers 2-column layout with runs grouping)
     */
    displayNewFormat(step, index) {
        // Step info header
        const header = document.createElement('div');
        header.className = 'mb-4 pb-3 border-b border-gray-300';
        header.innerHTML = `
            <div class="flex justify-between items-center">
                <div>
                    <span class="text-sm text-gray-500">Step ${index + 1}/${this.steps.length}</span>
                    <span class="mx-2 text-gray-400">•</span>
                    <span class="text-sm font-semibold text-gray-700">${step.operation || 'OPERATION'}</span>
                </div>
                <div class="text-xs text-gray-600">
                    Read: ${step.metrics?.reads || 0} | Write: ${step.metrics?.writes || 0} | 
                    Comparisons: ${step.metrics?.comparisons || 0}
                </div>
            </div>
        `;
        this.container.appendChild(header);

        // Main grid: Pages (Left) + Buffers (Right)
        const mainGrid = document.createElement('div');
        mainGrid.className = 'grid grid-cols-2 gap-6';

        // Left Column: Secondary Storage with Runs
        const leftCol = document.createElement('div');
        leftCol.innerHTML = '<h3 class="text-sm font-semibold text-gray-700 mb-3">📦 Secondary Storage (Pages & Runs)</h3>';
        const pagesContainer = document.createElement('div');
        pagesContainer.className = 'space-y-3';

        if (step.pages && Array.isArray(step.pages)) {
            // Group pages by run if run information exists
            const pagesByRun = this.groupPagesByRun(step.pages);

            if (Object.keys(pagesByRun).length > 0) {
                // Display grouped by runs
                Object.entries(pagesByRun).forEach(([runId, pages]) => {
                    const runContainer = this.createRunContainer(runId, pages);
                    pagesContainer.appendChild(runContainer);
                });
            } else {
                // Display pages individually if no run info
                step.pages.forEach(page => {
                    const pageBox = this.createPageBox(page);
                    pagesContainer.appendChild(pageBox);
                });
            }
        }
        leftCol.appendChild(pagesContainer);

        // Right Column: Main Memory
        const rightCol = document.createElement('div');
        rightCol.innerHTML = '<h3 class="text-sm font-semibold text-gray-700 mb-3">💾 Main Memory (Buffers)</h3>';
        const buffersContainer = document.createElement('div');
        buffersContainer.className = 'space-y-2';

        if (step.buffers && Array.isArray(step.buffers)) {
            step.buffers.forEach(buffer => {
                const bufferBox = this.createBufferBox(buffer);
                buffersContainer.appendChild(bufferBox);
            });
        }
        rightCol.appendChild(buffersContainer);

        mainGrid.appendChild(leftCol);
        mainGrid.appendChild(rightCol);
        this.container.appendChild(mainGrid);
    }

    /**
     * Group pages by their run ID
     */
    groupPagesByRun(pages) {
        const runs = {};
        pages.forEach(page => {
            const runId = page.runId || 'DEFAULT';
            if (!runs[runId]) {
                runs[runId] = [];
            }
            runs[runId].push(page);
        });
        return runs;
    }

    /**
     * Create a run container with all its pages
     */
    createRunContainer(runId, pages) {
        const container = document.createElement('div');

        // Determine if this run is being merged
        const isMerging = pages.some(p => p.status === 'LOADING' || p.status === 'MERGING');
        const isComplete = pages.some(p => p.status === 'DONE' || p.status === 'UPDATED');

        let runBorderColor = 'border-gray-300';
        let runBgColor = 'bg-gray-50';
        let shadowStyle = '';

        if (isMerging) {
            runBorderColor = 'border-blue-500';
            runBgColor = 'bg-blue-50';
            shadowStyle = 'box-shadow: 0 0 20px rgba(59, 130, 246, 0.4);';
        } else if (isComplete) {
            runBorderColor = 'border-green-500';
            runBgColor = 'bg-green-50';
        }

        container.className = `border-2 ${runBorderColor} ${runBgColor} rounded-lg p-4 transition-all`;
        container.style.cssText = shadowStyle;

        // Run header
        const runHeader = document.createElement('div');
        runHeader.className = 'mb-3 pb-2 border-b border-gray-300';
        runHeader.innerHTML = `
            <span class="text-sm font-bold text-gray-800">
                🏃 ${runId}
                <span class="text-xs text-gray-600 ml-2">(${pages.length} page${pages.length !== 1 ? 's' : ''})</span>
            </span>
        `;
        container.appendChild(runHeader);

        // Pages in this run
        const pagesGrid = document.createElement('div');
        pagesGrid.className = 'space-y-2';
        pages.forEach(page => {
            const pageBox = this.createPageBoxForRun(page);
            pagesGrid.appendChild(pageBox);
        });
        container.appendChild(pagesGrid);

        return container;
    }

    /**
     * Create page box with smaller styling for use within run container
     */
    createPageBoxForRun(page) {
        const box = document.createElement('div');

        // Determine styling based on status
        let statusColor = 'border-gray-300 bg-gray-50';
        let statusIcon = '⏳';
        let borderStyle = 'border-2';
        let shadowStyle = '';

        if (page.status === 'DONE') {
            statusColor = 'border-green-500 bg-green-50';
            statusIcon = '✓';
            borderStyle = 'border-2';
        } else if (page.status === 'LOADING' || page.status === 'MERGING') {
            statusColor = 'border-amber-500 bg-amber-50';
            statusIcon = '🔄';
            borderStyle = 'border-3';
            shadowStyle = 'box-shadow: 0 0 10px rgba(217, 119, 6, 0.5);';
        } else if (page.status === 'EMPTY') {
            statusColor = 'border-gray-300 bg-gray-50';
            statusIcon = '-';
            borderStyle = 'border-2';
        } else if (page.status === 'UPDATED') {
            statusColor = 'border-green-400 bg-green-100';
            statusIcon = '✓';
            borderStyle = 'border-2';
        } else if (page.status === 'WRITING') {
            statusColor = 'border-blue-500 bg-blue-50';
            statusIcon = '✍️';
            borderStyle = 'border-3';
            shadowStyle = 'box-shadow: 0 0 10px rgba(59, 130, 246, 0.5);';
        }

        box.className = `${borderStyle} ${statusColor} rounded-md p-3 transition-all`;
        box.style.cssText = shadowStyle;

        const label = document.createElement('div');
        label.className = 'flex justify-between items-center mb-2';
        label.innerHTML = `
            <span class="text-sm font-semibold text-gray-800">${page.id} ${statusIcon}</span>
            <span class="text-xs text-gray-600 font-medium">${page.data ? page.data.length : 0} items</span>
        `;
        box.appendChild(label);

        const content = document.createElement('div');
        if (page.data && page.data.length > 0) {
            content.className = 'grid gap-1';
            // Determine grid columns based on data length
            const cols = page.data.length <= 5 ? page.data.length : 5;
            content.style.gridTemplateColumns = `repeat(${cols}, 1fr)`;

            page.data.forEach(item => {
                const numBox = document.createElement('div');
                // Support both plain numbers and objects with value/highlight properties
                const value = typeof item === 'object' ? item.value : item;
                let boxStyle = 'bg-blue-500 text-white rounded-sm p-1 text-center font-bold text-xs border-2 border-blue-600';

                if (typeof item === 'object' && item.highlight) {
                    boxStyle = 'bg-blue-500 text-white rounded-sm p-1 text-center font-bold text-xs border-3 border-red-600 shadow-lg';
                } else if (typeof item === 'object' && item.removed) {
                    boxStyle = 'bg-gray-300 text-gray-500 rounded-sm p-1 text-center font-bold text-xs border-2 border-gray-400 line-through opacity-50';
                }

                numBox.className = boxStyle;
                numBox.textContent = value;
                content.appendChild(numBox);
            });
        } else {
            content.className = 'text-gray-400 text-xs italic text-center py-2';
            content.textContent = '(empty)';
        }
        box.appendChild(content);

        return box;
    }

    /**
     * Create page box element with grid of number boxes
     */
    createPageBox(page) {
        const box = document.createElement('div');

        // Determine styling based on status
        let statusColor = 'border-gray-300 bg-gray-50';
        let statusIcon = '⏳';
        let borderStyle = 'border-2';
        let shadowStyle = '';

        if (page.status === 'DONE') {
            statusColor = 'border-green-500 bg-green-50';
            statusIcon = '✓';
            borderStyle = 'border-3';
        } else if (page.status === 'LOADING') {
            statusColor = 'border-amber-500 bg-amber-50';
            statusIcon = '🔄';
            borderStyle = 'border-4';
            shadowStyle = 'box-shadow: 0 0 15px rgba(217, 119, 6, 0.6);';
        } else if (page.status === 'EMPTY') {
            statusColor = 'border-gray-300 bg-gray-50';
            statusIcon = '-';
            borderStyle = 'border-2';
        }

        box.className = `${borderStyle} ${statusColor} rounded-lg p-4 transition-all`;
        box.style.cssText = shadowStyle;

        const label = document.createElement('div');
        label.className = 'flex justify-between items-center mb-3';
        label.innerHTML = `
            <span class="text-sm font-bold text-gray-800">${page.id} ${statusIcon}</span>
            <span class="text-xs text-gray-600 font-medium">${page.data ? page.data.length : 0} items</span>
        `;
        box.appendChild(label);

        const content = document.createElement('div');
        if (page.data && page.data.length > 0) {
            content.className = 'grid gap-2';
            // Determine grid columns based on data length
            const cols = page.data.length <= 3 ? page.data.length : 3;
            content.style.gridTemplateColumns = `repeat(${cols}, 1fr)`;

            page.data.forEach(item => {
                const numBox = document.createElement('div');
                // Support both plain numbers and objects with value/highlight properties
                const value = typeof item === 'object' ? item.value : item;
                let boxStyle = 'bg-blue-500 text-white rounded-md p-2 text-center font-bold text-sm border-2 border-blue-600';

                if (typeof item === 'object' && item.highlight) {
                    boxStyle = 'bg-blue-500 text-white rounded-md p-2 text-center font-bold text-sm border-4 border-red-600 shadow-lg';
                } else if (typeof item === 'object' && item.removed) {
                    boxStyle = 'bg-gray-300 text-gray-500 rounded-md p-2 text-center font-bold text-sm border-2 border-gray-400 line-through';
                }

                numBox.className = boxStyle;
                numBox.textContent = value;
                content.appendChild(numBox);
            });
        } else {
            content.className = 'text-gray-400 text-sm italic text-center py-4';
            content.textContent = '(empty)';
        }
        box.appendChild(content);

        return box;
    }

    /**
     * Create buffer box element with grid of number boxes
     */
    createBufferBox(buffer) {
        const box = document.createElement('div');

        // Determine styling based on status
        let statusColor = 'border-blue-300 bg-blue-50';
        let borderWeight = 'border-2';
        let shadowStyle = '';

        if (buffer.status === 'ACTIVE') {
            statusColor = 'border-blue-600 bg-blue-100';
            borderWeight = 'border-4';
            shadowStyle = 'box-shadow: 0 0 15px rgba(37, 99, 235, 0.6);';
        } else if (buffer.status === 'EMPTY') {
            statusColor = 'border-gray-300 bg-gray-50';
            borderWeight = 'border-2';
        } else if (buffer.status === 'SORTING') {
            statusColor = 'border-amber-500 bg-amber-50';
            borderWeight = 'border-4';
            shadowStyle = 'box-shadow: 0 0 15px rgba(217, 119, 6, 0.6);';
        } else if (buffer.status === 'FULL') {
            statusColor = 'border-red-500 bg-red-50';
            borderWeight = 'border-3';
            shadowStyle = 'box-shadow: 0 0 10px rgba(220, 38, 38, 0.4);';
        }

        box.className = `${borderWeight} ${statusColor} rounded-lg p-4 transition-all`;
        box.style.cssText = shadowStyle;

        const label = document.createElement('div');
        label.className = 'flex justify-between items-center mb-3';
        label.innerHTML = `
            <span class="text-sm font-bold text-gray-800">${buffer.name}</span>
            <span class="text-xs px-3 py-1 rounded-full text-white font-semibold"
                style="background-color: ${this.getStatusBgColor(buffer.status)};">
                ${buffer.status}
            </span>
        `;
        box.appendChild(label);

        const content = document.createElement('div');
        if (buffer.data && buffer.data.length > 0) {
            content.className = 'grid gap-2';
            // Determine grid columns
            const cols = buffer.data.length <= 3 ? buffer.data.length : 3;
            content.style.gridTemplateColumns = `repeat(${cols}, 1fr)`;

            buffer.data.forEach(item => {
                const numBox = document.createElement('div');
                // Support both plain numbers and objects with value/highlight properties
                const value = typeof item === 'object' ? item.value : item;
                let boxStyle = 'bg-green-500 text-white rounded-md p-2 text-center font-bold text-sm border-2 border-green-600';

                if (typeof item === 'object' && item.highlight) {
                    boxStyle = 'bg-green-500 text-white rounded-md p-2 text-center font-bold text-sm border-4 border-red-600 shadow-lg';
                } else if (typeof item === 'object' && item.removed) {
                    // Hide removed items (they've been moved to output)
                    boxStyle = 'bg-gray-300 text-gray-500 rounded-md p-2 text-center font-bold text-sm border-2 border-gray-400 opacity-30 line-through';
                }

                numBox.className = boxStyle;
                numBox.textContent = value;
                content.appendChild(numBox);
            });
        } else {
            content.className = 'text-gray-400 text-sm italic text-center py-4';
            content.textContent = '(empty)';
        }
        box.appendChild(content);

        return box;
    }

    /**
     * Get color for status badge
     */
    getStatusBgColor(status) {
        const colors = {
            'ACTIVE': '#0284C7',    // blue-600
            'EMPTY': '#9CA3AF',      // gray-400
            'SORTING': '#D97706',    // amber-600
            'FULL': '#DC2626'        // red-600
        };
        return colors[status] || '#6B7280';
    }

    /**
     * Playback controls
     */
    play() {
        if (this.isPlaying || this.steps.length === 0) return;
        this.isPlaying = true;
        this.timer = setInterval(() => {
            if (this.currentStep >= this.steps.length - 1) {
                this.pause();
                return;
            }
            this.nextStep();
        }, this.animationSpeed);
    }

    pause() {
        this.isPlaying = false;
        if (this.timer) {
            clearInterval(this.timer);
            this.timer = null;
        }
    }

    nextStep() {
        if (this.currentStep < this.steps.length - 1) {
            this.currentStep++;
            this.displayStep(this.currentStep);
        }
    }

    prevStep() {
        if (this.currentStep > 0) {
            this.currentStep--;
            this.displayStep(this.currentStep);
        }
    }

    reset() {
        this.currentStep = 0;
        this.isPlaying = false;
        this.pause();
        if (this.steps.length > 0) {
            this.displayStep(0);
        }
    }

    setSpeed(speed) {
        this.animationSpeed = speed;
        if (this.isPlaying) {
            this.pause();
            this.play();
        }
    }

    /**
     * Update visualization when config changes
     */
    updateConfig(bufferCount, pageSize) {
        this.bufferCount = bufferCount;
        this.pageSize = pageSize;
        if (this.steps.length > 0) {
            this.displayStep(this.currentStep);
        }
    }

    /**
     * Get total steps
     */
    getTotalSteps() {
        return this.steps.length;
    }

    /**
     * Get current step number
     */
    getCurrentStep() {
        return this.currentStep + 1;
    }
}
