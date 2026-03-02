let inputData = [];
let sorter = null;
let visualizer = null;


const fileInput = document.getElementById('fileInput');
const fileInfo = document.getElementById('fileInfo');
const fileName = document.getElementById('fileName');
const fileSize = document.getElementById('fileSize');
const dataPreview = document.getElementById('dataPreview');
const dataContent = document.getElementById('dataContent');
const totalElements = document.getElementById('totalElements');

const bufferCount = document.getElementById('bufferCount');
const pageCount = document.getElementById('pageCount');
const pageSize = document.getElementById('pageSize');

const startSort = document.getElementById('startSort');
const resetBtn = document.getElementById('resetBtn');

const visualizationSection = document.getElementById('visualization-section');


fileInput.addEventListener('change', handleFileUpload);


bufferCount.addEventListener('input', () => {
    validateAndSyncConfig(false);
    if (visualizer) visualizer.updateConfig(parseInt(bufferCount.value), parseInt(pageSize.value));
});
pageCount.addEventListener('input', () => {
    validateAndSyncConfig(false);
    if (visualizer) visualizer.updateConfig(parseInt(bufferCount.value), parseInt(pageSize.value));
});
pageSize.addEventListener('input', () => {
    validateAndSyncConfig(false);
    if (visualizer) visualizer.updateConfig(parseInt(bufferCount.value), parseInt(pageSize.value));
});


const uploadSection = document.getElementById('upload-section');
uploadSection.addEventListener('dragover', (e) => {
    e.preventDefault();
    e.stopPropagation();
});

uploadSection.addEventListener('drop', (e) => {
    e.preventDefault();
    e.stopPropagation();

    const files = e.dataTransfer.files;
    if (files.length > 0 && files[0].name.endsWith('.txt')) {
        fileInput.files = files;
        handleFileUpload({ target: { files: files } });
    }
});

function handleFileUpload(event) {
    const file = event.target.files[0];

    if (!file) return;

    
    fileName.textContent = file.name;
    fileSize.textContent = formatFileSize(file.size);
    fileInfo.classList.remove('hidden');

    
    const reader = new FileReader();
    reader.onload = function (e) {
        const content = e.target.result;
        parseFileContent(content);
    };
    reader.readAsText(file);
}

function parseFileContent(content) {
    
    const numbers = content
        .split(/[\n,\s]+/)
        .map(s => s.trim())
        .filter(s => s.length > 0)
        .map(s => parseFloat(s))
        .filter(n => !isNaN(n));

    if (numbers.length === 0) {
        alert('Không tìm thấy số hợp lệ trong file!');
        return;
    }

    inputData = numbers;

    
    totalElements.textContent = numbers.length;

    
    const preview = numbers.slice(0, 100).join(', ');
    const suffix = numbers.length > 100 ? `\n... và ${numbers.length - 100} số khác` : '';
    dataContent.textContent = preview + suffix;

    dataPreview.classList.remove('hidden');

    
    validateAndSyncConfig(false);

    
    startSort.disabled = false;
}

function formatFileSize(bytes) {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
}


startSort.addEventListener('click', async () => {
    if (inputData.length === 0) {
        alert('Vui lòng upload file trước!');
        return;
    }

    
    const config = validateAndSyncConfig(true);

    
    visualizationSection.classList.remove('hidden');

    
    startSort.disabled = true;
    startSort.textContent = '⏳ Đang sắp xếp...';

    
    sorter = new ExternalSort(config.pageSize);
    visualizer = new SortingVisualizer('vizCanvas');
    visualizer.init(config.bufferCount, config.pageSize);

    
    updateProgress(20, 'Đang chia dữ liệu thành chunks...');

    
    await sleep(500);

    
    try {        
        const rawChunks = buildRawChunks(inputData, config.pageSize);
        visualizer.recordChunksStep('DIVIDE', rawChunks, {});

        const result = await sorter.sort([...inputData]);

        addDetailedSortSteps(rawChunks, sorter.chunks, visualizer, config.bufferCount);

        add2WayMergeSteps(sorter.chunks, visualizer, config.pageSize);

        visualizer.displayStep(0);

        updateProgress(100, 'Hoàn thành!');
        if (!verifySorted(result)) {
            alert('❌ Lỗi: Dữ liệu chưa được sắp xếp đúng!');
        }

    } catch (error) {
        console.error('Sorting error:', error);
        alert('Có lỗi xảy ra khi sắp xếp!');
    } finally {
        startSort.disabled = false;
        startSort.textContent = '▶️ Bắt đầu sắp xếp';
    }
});


resetBtn.addEventListener('click', () => {
    fileInput.value = '';
    fileInfo.classList.add('hidden');
    dataPreview.classList.add('hidden');
    visualizationSection.classList.add('hidden');
    
    inputData = [];
    sorter = null;
    visualizer = null;

    bufferCount.value = 3;
    pageCount.value = 5;
    pageSize.value = 20;

    startSort.disabled = true;    
    updateProgress(0, '0%');
});


function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

function updateProgress(percent, text) {
    const progressBar = document.getElementById('progressBar');
    const progressText = document.getElementById('progressText');
    progressBar.style.width = percent + '%';
    progressText.textContent = text || percent + '%';
}

function validateAndSyncConfig(showAlerts) {
    const config = {
        pageSize: parseInt(pageSize.value, 10) || 1,
        bufferCount: parseInt(bufferCount.value, 10) || 2,
        pageCount: parseInt(pageCount.value, 10) || 1
    };

    if (config.pageSize < 1) {
        config.pageSize = 1;
        pageSize.value = 1;
    }

    if (config.bufferCount < 2) {
        config.bufferCount = 2;
        bufferCount.value = 2;
    }

    if (inputData.length > 0) {
        const requiredPages = Math.ceil(inputData.length / config.pageSize);
        if (config.pageCount < requiredPages) {
            config.pageCount = requiredPages;
            pageCount.value = requiredPages;
            if (showAlerts) {
                alert(`Số page đã tăng lên ${requiredPages} để chứa đủ dữ liệu.`);
            }
        }
    }

    return config;
}

function verifySorted(arr) {
    for (let i = 1; i < arr.length; i++) {
        if (arr[i] < arr[i - 1]) return false;
    }
    return true;
}


document.getElementById('speed').addEventListener('input', (e) => {
    const speed = parseInt(e.target.value);
    const speedValue = document.getElementById('speedValue');
    speedValue.textContent = (2000 / speed).toFixed(1) + 'x';
    if (visualizer) {
        visualizer.setSpeed(speed);
    }
});


document.getElementById('prevStep').addEventListener('click', () => {
    if (visualizer) {
        visualizer.prevStep();
    }
});

document.getElementById('playPause').addEventListener('click', () => {
    if (!visualizer) return;
    const btn = document.getElementById('playPause');
    if (visualizer.isPlaying) {
        visualizer.pause();
        btn.textContent = '▶️ Play';
    } else {
        visualizer.play();
        btn.textContent = '⏸️ Pause';
    }
});

document.getElementById('nextStep').addEventListener('click', () => {
    if (visualizer) {
        visualizer.nextStep();
    }
});

function buildRawChunks(data, pageSize) {
    const chunks = [];
    for (let i = 0; i < data.length; i += pageSize) {
        chunks.push(data.slice(i, i + pageSize));
    }
    
    return chunks.map((chunk, idx) => ({
        data: chunk,
        runId: `Run ${idx + 1}`
    }));
}

function addDetailedSortSteps(rawChunks, sortedChunks, viz, bufferCount) {
    
    const currentPages = rawChunks.map(chunk => [...chunk.data]);
    const runIds = rawChunks.map(chunk => chunk.runId);

    rawChunks.forEach((rawChunkObj, pageIdx) => {
        const rawChunk = rawChunkObj.data;
        const runId = rawChunkObj.runId;
        const sortedChunk = sortedChunks[pageIdx] ? [...sortedChunks[pageIdx]] : [...rawChunk].sort((a, b) => a - b);

        
        const pagesLoading = currentPages.map((page, idx) => ({
            id: `P${idx + 1}`,
            data: [...page],
            status: idx === pageIdx ? 'LOADING' : 'WAITING',
            runId: runIds[idx]
        }));

        const buffersLoading = [];
        for (let i = 0; i < bufferCount; i++) {
            if (i === 0) {
                buffersLoading.push({
                    id: `F${i + 1}`,
                    name: 'Input Buffer 1',
                    data: [...rawChunk],
                    status: 'ACTIVE'
                });
            } else if (i < bufferCount - 1) {
                buffersLoading.push({
                    id: `F${i + 1}`,
                    name: `Input Buffer ${i + 1}`,
                    data: [],
                    status: 'EMPTY'
                });
            } else {
                buffersLoading.push({
                    id: `F${i + 1}`,
                    name: 'Output Buffer',
                    data: [],
                    status: 'EMPTY'
                });
            }
        }

        viz.recordStep({
            operation: `B1: LOAD P${pageIdx + 1} → Input Buffer`,
            pages: pagesLoading,
            buffers: buffersLoading,
            metrics: { reads: 1, writes: 0, comparisons: 0 }
        });

        
        const pagesSorting = currentPages.map((page, idx) => ({
            id: `P${idx + 1}`,
            data: [...page],
            status: idx === pageIdx ? 'LOADING' : 'WAITING',
            runId: runIds[idx]
        }));

        const buffersSorting = [];
        for (let i = 0; i < bufferCount; i++) {
            if (i === 0) {
                buffersSorting.push({
                    id: `F${i + 1}`,
                    name: 'Input Buffer 1',
                    data: [...sortedChunk],
                    status: 'SORTING'
                });
            } else if (i < bufferCount - 1) {
                buffersSorting.push({
                    id: `F${i + 1}`,
                    name: `Input Buffer ${i + 1}`,
                    data: [],
                    status: 'EMPTY'
                });
            } else {
                buffersSorting.push({
                    id: `F${i + 1}`,
                    name: 'Output Buffer',
                    data: [],
                    status: 'EMPTY'
                });
            }
        }

        viz.recordStep({
            operation: `B2: QUICKSORT tại Input Buffer (P${pageIdx + 1})`,
            pages: pagesSorting,
            buffers: buffersSorting,
            metrics: { reads: 0, writes: 0, comparisons: sortedChunk.length }
        });

        
        const pagesMoveOutput = currentPages.map((page, idx) => ({
            id: `P${idx + 1}`,
            data: [...page],
            status: idx === pageIdx ? 'LOADING' : 'WAITING',
            runId: runIds[idx]
        }));

        const buffersMoveOutput = [];
        for (let i = 0; i < bufferCount; i++) {
            if (i === 0) {
                buffersMoveOutput.push({
                    id: `F${i + 1}`,
                    name: 'Input Buffer 1',
                    data: [],
                    status: 'EMPTY'
                });
            } else if (i < bufferCount - 1) {
                buffersMoveOutput.push({
                    id: `F${i + 1}`,
                    name: `Input Buffer ${i + 1}`,
                    data: [],
                    status: 'EMPTY'
                });
            } else {
                buffersMoveOutput.push({
                    id: `F${i + 1}`,
                    name: 'Output Buffer',
                    data: [...sortedChunk],
                    status: 'FULL'
                });
            }
        }

        viz.recordStep({
            operation: `B3: Input Buffer → Output Buffer (P${pageIdx + 1})`,
            pages: pagesMoveOutput,
            buffers: buffersMoveOutput,
            metrics: { reads: 0, writes: 0, comparisons: 0 }
        });

        
        currentPages[pageIdx] = [...sortedChunk];
        const pagesWritingBack = currentPages.map((page, idx) => ({
            id: `P${idx + 1}`,
            data: [...page],
            status: idx === pageIdx ? 'DONE' : 'WAITING',
            runId: runIds[idx]
        }));

        const buffersWritingBack = [];
        for (let i = 0; i < bufferCount; i++) {
            if (i < bufferCount - 1) {
                buffersWritingBack.push({
                    id: `F${i + 1}`,
                    name: `Input Buffer ${i + 1}`,
                    data: [],
                    status: 'EMPTY'
                });
            } else {
                buffersWritingBack.push({
                    id: `F${i + 1}`,
                    name: 'Output Buffer',
                    data: [],
                    status: 'EMPTY'
                });
            }
        }

        viz.recordStep({
            operation: `B4: WRITE Output Buffer → P${pageIdx + 1}`,
            pages: pagesWritingBack,
            buffers: buffersWritingBack,
            metrics: { reads: 0, writes: 1, comparisons: 0 }
        });
    });
}

function add2WayMergeSteps(initialChunks, viz, pageSize) {
    const bufferCount = viz.bufferCount || 3;

    
    let runs = initialChunks.map((chunk, idx) => ({
        id: `Run ${idx + 1}`,
        pages: [chunk]
    }));

    
    let pageCounter = 1;
    let currentPages = initialChunks.map((chunk, idx) => ({
        id: `P${pageCounter++}`,
        data: [...chunk],
        status: 'WAITING',
        runId: `Run ${idx + 1}`
    }));

    let pass = 0;
    let nextRunId = initialChunks.length + 1;

    
    recordPassSummaryStep(viz, 0, runs, currentPages, 'BEFORE');

    while (runs.length > 1) {
        pass++;
        
        recordPassSummaryStep(viz, pass, runs, currentPages, 'BEFORE');

        const newRuns = [];
        const newPages = [];

        
        for (let i = 0; i < runs.length; i += 2) {
            if (i + 1 < runs.length) {
                const mergedRunId = `Run ${nextRunId++}`;

                
                const { mergedRun, updatedPages } = perform2WayMerge(
                    runs[i].pages,
                    runs[i + 1].pages,
                    viz,
                    pass,
                    bufferCount,
                    pageSize,
                    currentPages,
                    runs[i].id,
                    runs[i + 1].id,
                    mergedRunId
                );

                newRuns.push({
                    id: mergedRunId,
                    pages: mergedRun
                });

                
                newPages.push(...updatedPages.filter(p => p.runId === mergedRunId));

                
                const remainingPages = currentPages.filter(
                    (p) => p.runId !== runs[i].id && p.runId !== runs[i + 1].id
                );
                currentPages = [...remainingPages, ...updatedPages.map((p) => ({ ...p }))];
            } else {
                
                newRuns.push(runs[i]);
                
                runs[i].pages.forEach(page => {
                    const existingPage = currentPages.find(p => p.data === page);
                    if (existingPage) {
                        newPages.push(existingPage);
                    } else {
                        newPages.push({
                            id: `P${pageCounter++}`,
                            data: page,
                            status: 'WAITING',
                            runId: runs[i].id
                        });
                    }
                });
            }
        }

        runs = newRuns;
        currentPages = newPages;

        
        recordPassSummaryStep(viz, pass, runs, currentPages, 'AFTER');
    }

    
    recordPassSummaryStep(viz, pass, runs, currentPages, 'FINAL');
}

function recordPassSummaryStep(viz, pass, runs, pages, phase) {
    const pagesDisplay = pages.map((page) => ({
        id: page.id,
        data: page.data ? [...page.data] : [],
        status: phase === 'FINAL' ? 'DONE' : 'WAITING',
        runId: page.runId
    }));

    const buffersDisplay = [
        { id: 'F1', name: 'Input Buffer 1', data: [], status: 'EMPTY' },
        { id: 'F2', name: 'Input Buffer 2', data: [], status: 'EMPTY' },
        { id: 'F3', name: 'Output Buffer', data: [], status: 'EMPTY' }
    ];

    let operation = '';
    if (phase === 'BEFORE' && pass === 0) {
        operation = `Pass 0 | Initial runs (${runs.length} run${runs.length !== 1 ? 's' : ''})`;
    } else if (phase === 'BEFORE') {
        operation = `Pass ${pass} | Before merge (${runs.length} run${runs.length !== 1 ? 's' : ''})`;
    } else if (phase === 'AFTER') {
        operation = `Pass ${pass} | After merge (${runs.length} run${runs.length !== 1 ? 's' : ''})`;
    } else {
        operation = `Final | Sorted run ready (${runs.length} run)`;
    }

    viz.recordStep({
        operation,
        pages: pagesDisplay,
        buffers: buffersDisplay,
        metrics: { reads: 0, writes: 0, comparisons: 0 }
    });
}

function perform2WayMerge(run1, run2, viz, pass, bufferCount, pageSize, currentPages, run1Id, run2Id, mergedRunId) {
    const outputBuffer = [];
    const mergedRun = [];
    let updatedPages = [];

    const run1Pages = currentPages.filter(p => p.runId === run1Id);
    const run2Pages = currentPages.filter(p => p.runId === run2Id);
    const allMergedPages = [...run1Pages, ...run2Pages];
    
    const mergedVisualPages = allMergedPages.map((page, idx) => ({
        id: `${mergedRunId}-P${idx + 1}`,
        data: [],
        status: 'EMPTY',
        runId: mergedRunId
    }));

    let pagesForDisplay = [...currentPages];

    let run1PageIdx = 0;
    let run2PageIdx = 0;
    let run1ElemIdx = 0;
    let run2ElemIdx = 0;
    let mergedPageIdx = 0;    
    let inputBuffer1 = run1.length > 0 ? [...run1[0]] : [];
    let inputBuffer2 = run2.length > 0 ? [...run2[0]] : [];

    record2WayLoadPages(viz, pass, inputBuffer1, inputBuffer2, bufferCount, pagesForDisplay, run1Id, run2Id, mergedVisualPages);    
    record2WayCreateMergedRun(viz, pass, run1Pages, run2Pages, pagesForDisplay, run1Id, run2Id, mergedVisualPages, mergedRunId, bufferCount);

    while (run1ElemIdx < inputBuffer1.length || run2ElemIdx < inputBuffer2.length || run1PageIdx < run1.length - 1 || run2PageIdx < run2.length - 1) {
        let selectedValue = null;
        let fromBuffer = null;        
        if (run1ElemIdx < inputBuffer1.length && run2ElemIdx < inputBuffer2.length) {
            if (inputBuffer1[run1ElemIdx] <= inputBuffer2[run2ElemIdx]) {
                selectedValue = inputBuffer1[run1ElemIdx];
                run1ElemIdx++;
                fromBuffer = 1;
            } else {
                selectedValue = inputBuffer2[run2ElemIdx];
                run2ElemIdx++;
                fromBuffer = 2;
            }
        } else if (run1ElemIdx < inputBuffer1.length) {
            selectedValue = inputBuffer1[run1ElemIdx];
            run1ElemIdx++;
            fromBuffer = 1;
        } else if (run2ElemIdx < inputBuffer2.length) {
            selectedValue = inputBuffer2[run2ElemIdx];
            run2ElemIdx++;
            fromBuffer = 2;
        }

        if (selectedValue !== null) {
            outputBuffer.push(selectedValue);

            record2WayMergeStep(viz, pass, selectedValue, fromBuffer, outputBuffer, inputBuffer1, inputBuffer2, run1ElemIdx, run2ElemIdx, bufferCount, pageSize, pagesForDisplay, run1Id, run2Id, mergedRunId, mergedVisualPages);            
            if (outputBuffer.length === pageSize) {
                const pageData = [...outputBuffer];
                mergedRun.push(pageData);

                if (mergedPageIdx < mergedVisualPages.length) {
                    mergedVisualPages[mergedPageIdx].data = pageData;
                    mergedVisualPages[mergedPageIdx].status = 'UPDATED';
                    mergedPageIdx++;
                }

                record2WayWritePage(viz, pass, mergedVisualPages[mergedPageIdx - 1]?.id || 'P?', pageData, inputBuffer1, inputBuffer2, run1ElemIdx, run2ElemIdx, bufferCount, pagesForDisplay, mergedVisualPages, run1Id, run2Id, mergedRunId);
                outputBuffer.length = 0;
            }
        }   
        if (run1ElemIdx >= inputBuffer1.length && run1PageIdx < run1.length - 1) {
            run1PageIdx++;
            inputBuffer1 = [...run1[run1PageIdx]];
            run1ElemIdx = 0;
            record2WayLoadNextPage(viz, pass, 1, inputBuffer1, inputBuffer2, run1ElemIdx, run2ElemIdx, bufferCount, pagesForDisplay, run1Id, run2Id, outputBuffer, mergedVisualPages, mergedRunId);
        }

        if (run2ElemIdx >= inputBuffer2.length && run2PageIdx < run2.length - 1) {            
            run2PageIdx++;
            inputBuffer2 = [...run2[run2PageIdx]];
            run2ElemIdx = 0;
            record2WayLoadNextPage(viz, pass, 2, inputBuffer1, inputBuffer2, run1ElemIdx, run2ElemIdx, bufferCount, pagesForDisplay, run1Id, run2Id, outputBuffer, mergedVisualPages, mergedRunId);
        }
    }
   
    if (outputBuffer.length > 0) {
        const pageData = [...outputBuffer];
        mergedRun.push(pageData);

        if (mergedPageIdx < mergedVisualPages.length) {
            mergedVisualPages[mergedPageIdx].data = pageData;
            mergedVisualPages[mergedPageIdx].status = 'UPDATED';
            mergedPageIdx++;
        }

        record2WayWritePage(viz, pass, mergedVisualPages[mergedPageIdx - 1]?.id || 'P?', pageData, inputBuffer1, inputBuffer2, run1ElemIdx, run2ElemIdx, bufferCount, pagesForDisplay, mergedVisualPages, run1Id, run2Id, mergedRunId);
    }    
    updatedPages = allMergedPages.map((sourcePage, idx) => ({
        id: sourcePage.id,
        data: mergedRun[idx] ? [...mergedRun[idx]] : [],
        status: 'WAITING',
        runId: mergedRunId
    }));
    
    const pagesAfterReplace = [
        ...pagesForDisplay
            .filter((p) => p.runId !== run1Id && p.runId !== run2Id)
            .map((p) => ({
                id: p.id,
                data: p.data ? [...p.data] : [],
                status: 'WAITING',
                runId: p.runId
            })),
        ...updatedPages.map((p) => ({
            id: p.id,
            data: p.data ? [...p.data] : [],
            status: 'UPDATED',
            runId: p.runId
        }))
    ];

    viz.recordStep({
        operation: `Pass ${pass} | B5: REPLACE ${run1Id} & ${run2Id} → ${mergedRunId} (xóa run cũ)`,
        pages: pagesAfterReplace,
        buffers: [
            { id: 'F1', name: 'Input Buffer 1', data: [], status: 'EMPTY' },
            { id: 'F2', name: 'Input Buffer 2', data: [], status: 'EMPTY' },
            { id: 'F3', name: 'Output Buffer', data: [], status: 'EMPTY' }
        ],
        metrics: { reads: 0, writes: 0, comparisons: 0 }
    });

    return { mergedRun, updatedPages };
}

function record2WayLoadPages(viz, pass, inputBuffer1, inputBuffer2, bufferCount, pagesForDisplay, run1Id, run2Id, mergedVisualPages) {
    const pagesDisplay = pagesForDisplay
        .map((page) => ({
            id: page.id,
            data: page.data ? [...page.data] : [],
            status: 'WAITING',
            runId: page.runId
        }));    
    mergedVisualPages.forEach((page) => {
        pagesDisplay.push({
            id: page.id,
            data: [...page.data],
            status: 'EMPTY',
            runId: page.runId
        });
    });    
    const buffersDisplay = [];    
    buffersDisplay.push({
        id: 'F1',
        name: 'Input Buffer 1',
        data: inputBuffer1 ? [...inputBuffer1] : [],
        status: inputBuffer1?.length > 0 ? 'ACTIVE' : 'EMPTY'
    });

    buffersDisplay.push({
        id: 'F2',
        name: 'Input Buffer 2',
        data: inputBuffer2 ? [...inputBuffer2] : [],
        status: inputBuffer2?.length > 0 ? 'ACTIVE' : 'EMPTY'
    });

    buffersDisplay.push({
        id: 'F3',
        name: 'Output Buffer',
        data: [],
        status: 'EMPTY'
    });

    viz.recordStep({
        operation: `Pass ${pass} | B1: LOAD ${run1Id} & ${run2Id} → Input Buffers`,
        pages: pagesDisplay,
        buffers: buffersDisplay,
        metrics: { reads: 2, writes: 0, comparisons: 0 }
    });
}

function record2WayCreateMergedRun(viz, pass, run1Pages, run2Pages, pagesForDisplay, run1Id, run2Id, mergedVisualPages, mergedRunId, bufferCount) {
    const pagesDisplay = pagesForDisplay.map((page) => ({
        id: page.id,
        data: page.data ? [...page.data] : [],
        status: 'WAITING',
        runId: page.runId
    }));

    mergedVisualPages.forEach(page => {
        pagesDisplay.push({
            id: page.id,
            data: [...page.data],
            status: 'EMPTY',
            runId: mergedRunId
        });
    });

    const mergedPageIds = mergedVisualPages.map(p => p.id);

    const buffersDisplay = [];

    buffersDisplay.push({
        id: 'F1',
        name: 'Input Buffer 1',
        data: run1Pages.length > 0 ? [...run1Pages[0].data] : [],
        status: run1Pages.length > 0 ? 'ACTIVE' : 'EMPTY'
    });

    buffersDisplay.push({
        id: 'F2',
        name: 'Input Buffer 2',
        data: run2Pages.length > 0 ? [...run2Pages[0].data] : [],
        status: run2Pages.length > 0 ? 'ACTIVE' : 'EMPTY'
    });

    buffersDisplay.push({
        id: 'F3',
        name: 'Output Buffer',
        data: [],
        status: 'EMPTY'
    });

    viz.recordStep({
        operation: `Pass ${pass} | B2: CREATE ${mergedRunId} từ ${run1Id} & ${run2Id} (pages: ${mergedPageIds.join(', ')})`,
        pages: pagesDisplay,
        buffers: buffersDisplay,
        metrics: { reads: 0, writes: 0, comparisons: 0 }
    });
}

function record2WayLoadNextPage(viz, pass, bufferIdx, inputBuffer1, inputBuffer2, run1ElemIdx, run2ElemIdx, bufferCount, pagesForDisplay, run1Id, run2Id, outputBuffer, mergedVisualPages, mergedRunId) {
    const pagesDisplay = pagesForDisplay
        .map(page => ({
            id: page.id,
            data: page.data ? [...page.data] : [],
            status: 'WAITING',
            runId: page.runId
        }));

    mergedVisualPages.forEach(page => {
        pagesDisplay.push({
            id: page.id,
            data: [...page.data],
            status: page.status || 'EMPTY',
            runId: mergedRunId
        });
    });

    const buffersDisplay = [
        {
            id: 'F1',
            name: 'Input Buffer 1',
            data: inputBuffer1 ? inputBuffer1.map((val, idx) => {
                if (bufferIdx === 1) {
                    return { value: val };
                } else {
                    if (idx < run1ElemIdx) {
                        return { value: val, removed: true };
                    }
                    return { value: val };
                }
            }) : [],
            status: bufferIdx === 1 ? 'LOADING' : (inputBuffer1?.length > 0 ? 'ACTIVE' : 'EMPTY')
        },
        {
            id: 'F2',
            name: 'Input Buffer 2',
            data: inputBuffer2 ? inputBuffer2.map((val, idx) => {
                if (bufferIdx === 2) {
                    return { value: val };
                } else {
                    if (idx < run2ElemIdx) {
                        return { value: val, removed: true };
                    }
                    return { value: val };
                }
            }) : [],
            status: bufferIdx === 2 ? 'LOADING' : (inputBuffer2?.length > 0 ? 'ACTIVE' : 'EMPTY')
        },
        {
            id: 'F3',
            name: 'Output Buffer',
            data: outputBuffer ? [...outputBuffer] : [],
            status: outputBuffer && outputBuffer.length > 0 ? 'ACTIVE' : 'EMPTY'
        }
    ];

    viz.recordStep({
        operation: `Pass ${pass} | B1 (Lặp): LOAD next page từ ${bufferIdx === 1 ? run1Id : run2Id} → Input Buffer ${bufferIdx}`,
        pages: pagesDisplay,
        buffers: buffersDisplay,
        metrics: { reads: 1, writes: 0, comparisons: 0 }
    });
}

function record2WayMergeStep(viz, pass, selectedValue, fromBuffer, outputBuffer, inputBuffer1, inputBuffer2, run1ElemIdx, run2ElemIdx, bufferCount, pageSize, pagesForDisplay, run1Id, run2Id, mergedRunId, mergedVisualPages) {
    const pagesDisplay = pagesForDisplay.map(page => ({
        id: page.id,
        data: page.data ? [...page.data] : [],
        status: page.runId === run1Id || page.runId === run2Id ? 'MERGING' : 'WAITING',
        runId: page.runId
    }));

    mergedVisualPages.forEach(page => {
        pagesDisplay.push({
            id: page.id,
            data: [...page.data],
            status: page.data.length > 0 ? 'UPDATED' : 'MERGING',
            runId: mergedRunId
        });
    });

    const buffersDisplay = [
        {
            id: 'F1',
            name: 'Input Buffer 1',
            data: inputBuffer1.map((val, idx) => {
                if (idx < run1ElemIdx) {
                    return { value: val, removed: true };
                }
                if (idx === run1ElemIdx - 1 && fromBuffer === 1) {
                    return { value: val, highlight: true };
                }
                return { value: val };
            }),
            status: inputBuffer1.length > 0 ? 'ACTIVE' : 'EMPTY'
        },
        {
            id: 'F2',
            name: 'Input Buffer 2',
            data: inputBuffer2.map((val, idx) => {
                if (idx < run2ElemIdx) {
                    return { value: val, removed: true };
                }
                if (idx === run2ElemIdx - 1 && fromBuffer === 2) {
                    return { value: val, highlight: true };
                }
                return { value: val };
            }),
            status: inputBuffer2.length > 0 ? 'ACTIVE' : 'EMPTY'
        },
        {
            id: 'F3',
            name: 'Output Buffer',
            data: [...outputBuffer],
            status: 'ACTIVE'
        }
    ];

    viz.recordStep({
        operation: `Pass ${pass} | B3: MERGE ${selectedValue} từ ${fromBuffer === 1 ? run1Id : run2Id} → Output Buffer (${outputBuffer.length}/${pageSize}) | ${mergedRunId}`,
        pages: pagesDisplay,
        buffers: buffersDisplay,
        metrics: { reads: 0, writes: 0, comparisons: 1 }
    });
}

function record2WayWritePage(viz, pass, targetPageId, outputPageData, inputBuffer1, inputBuffer2, run1ElemIdx, run2ElemIdx, bufferCount, pagesForDisplay, updatedPages, run1Id, run2Id, mergedRunId) {
    const pagesDisplay = pagesForDisplay.map(page => ({
        id: page.id,
        data: page.data ? [...page.data] : [],
        status: page.runId === run1Id || page.runId === run2Id ? 'MERGING' : 'WAITING',
        runId: page.runId
    }));

    updatedPages.forEach(page => {
        const isBeingWritten = page.id === targetPageId;
        pagesDisplay.push({
            id: page.id,
            data: page.data ? [...page.data] : [],
            status: isBeingWritten ? 'WRITING' : (page.data && page.data.length > 0 ? 'UPDATED' : 'EMPTY'),
            runId: mergedRunId
        });
    });

    const buffersDisplay = [
        {
            id: 'F1',
            name: 'Input Buffer 1',
            data: inputBuffer1 ? inputBuffer1.map((val, idx) => {
                if (idx < run1ElemIdx) {
                    return { value: val, removed: true };
                }
                return { value: val };
            }) : [],
            status: inputBuffer1?.length > 0 ? 'ACTIVE' : 'EMPTY'
        },
        {
            id: 'F2',
            name: 'Input Buffer 2',
            data: inputBuffer2 ? inputBuffer2.map((val, idx) => {
                if (idx < run2ElemIdx) {
                    return { value: val, removed: true };
                }
                return { value: val };
            }) : [],
            status: inputBuffer2?.length > 0 ? 'ACTIVE' : 'EMPTY'
        },
        {
            id: 'F3',
            name: 'Output Buffer',
            data: [],
            status: 'EMPTY'
        }
    ];

    viz.recordStep({
        operation: `Pass ${pass} | B4: WRITE Output Buffer → ${targetPageId} | Merge ${run1Id} & ${run2Id} → ${mergedRunId}`,
        pages: pagesDisplay,
        buffers: buffersDisplay,
        metrics: { reads: 0, writes: 1, comparisons: 0 }
    });
}