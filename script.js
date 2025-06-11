
let allProcessors = [];
let singleCoreChart, multiCoreChart, litographyChart, priceChart, perfPriceChart, overallPerfPriceChart;
const GITHUB_LINK = "github.com/brenolobao";

let carouselSortState = {
    criterion: 'performance', // Default sort
    direction: 'desc'     // Default direction
};

async function fetchData() {
    try {
        const response = await fetch('cpusAmd-Intel-2017-2025.json');
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        const data = await response.json();
        allProcessors = data.processadores;

        const totalProcessorsWithPerfData = allProcessors.filter(p => p.desempenho && p.desempenho.single_core !== null && p.desempenho.multi_core !== null);
        document.getElementById('totalCpuCount').textContent = `Total de CPUs com dados de desempenho: ${totalProcessorsWithPerfData.length}`;

        populateThreadsFilter(allProcessors);
        populateManufacturerFilter(allProcessors);
        document.getElementById('chart-area').innerHTML = '<div class="no-data">Selecione o número de Threads para exibir os gráficos.</div>';
        drawOverallPerfPriceChart(allProcessors);
        displayAllCpuCards();
    } catch (error) {
        console.error('Erro ao carregar os dados dos processadores:', error);
        document.getElementById('chart-area').innerHTML = '<div class="no-data" style="color: red;">Erro ao carregar os dados.</div>';
        document.getElementById('totalCpuCount').textContent = 'Erro ao carregar dados.';
        document.getElementById('overallPerfPriceComment').innerHTML = '<div class="no-data" style="color: red;">Erro ao carregar dados para este gráfico.</div>';
        document.getElementById('cpu-carousel').innerHTML = '<div class="no-data" style="color: red;">Erro ao carregar dados para os cartões de CPU.</div>';
    }
}

function populateThreadsFilter(processors) {
    const threadsSet = new Set(processors.map(p => p.threads).filter(t => t !== null));
    const sortedThreads = Array.from(threadsSet).sort((a, b) => a - b);
    const select = document.getElementById('threadsFilter');
    select.innerHTML = '<option value="">Selecione o número de Threads</option>';
    sortedThreads.forEach(threads => {
        const option = document.createElement('option');
        option.value = threads;
        option.textContent = threads + ' Threads';
        select.appendChild(option);
    });
}

function populateManufacturerFilter(processors) {
    const manufacturerSet = new Set(processors.map(p => p.fabricante).filter(f => f !== null));
    const sortedManufacturers = Array.from(manufacturerSet).sort();
    const select = document.getElementById('manufacturerFilter');
    select.innerHTML = '<option value="all">Todos</option>';
    sortedManufacturers.forEach(manufacturer => {
        const option = document.createElement('option');
        option.value = manufacturer;
        option.textContent = manufacturer;
        select.appendChild(option);
    });
}

function applyFilter() {
    // Applying a filter from the top dropdowns should also redraw the carousel cards
    displayAllCpuCards();

    const selectedThreads = document.getElementById('threadsFilter').value;
    const selectedManufacturer = document.getElementById('manufacturerFilter').value;
    let filteredProcessors = allProcessors;

    if (selectedThreads) {
        filteredProcessors = filteredProcessors.filter(p => p.threads == parseInt(selectedThreads));
    }
    if (selectedManufacturer && selectedManufacturer !== 'all') {
        filteredProcessors = filteredProcessors.filter(p => p.fabricante === selectedManufacturer);
    }

    if (!selectedThreads) {
        document.getElementById('chart-area').innerHTML = '<div class="no-data">Selecione o número de Threads para exibir os gráficos.</div>';
        destroyCharts();
        return;
    }

    if (filteredProcessors.length === 0) {
        document.getElementById('chart-area').innerHTML = '<div class="no-data">Nenhum processador encontrado para os filtros selecionados.</div>';
        destroyCharts();
        return;
    }
    destroyCharts();
    displayCharts(filteredProcessors);
}


function resetFilter() {
    document.getElementById('threadsFilter').value = '';
    document.getElementById('manufacturerFilter').value = 'all';
    document.getElementById('chart-area').innerHTML = '<div class="no-data">Selecione o número de Threads para exibir os gráficos.</div>';
    destroyCharts();
    displayAllCpuCards(); // Redraw carousel with all processors
}

function destroyCharts() {
    if (singleCoreChart) { singleCoreChart.destroy(); singleCoreChart = null; }
    if (multiCoreChart) { multiCoreChart.destroy(); multiCoreChart = null; }
    if (litographyChart) { litographyChart.destroy(); litographyChart = null; }
    if (priceChart) { priceChart.destroy(); priceChart = null; }
    if (perfPriceChart) { perfPriceChart.destroy(); perfPriceChart = null; }
}

function displayCharts(processors) {
    const chartArea = document.getElementById('chart-area');
    chartArea.innerHTML = `
        <hr>
        <div class="chart-container">
            <h2>Desempenho Single-Core (Crescente)</h2>
            <div id="singleCoreCount" class="chart-count"></div>
            <canvas id="singleCoreChart"></canvas>
            <div id="singleCoreComment" class="chart-comment"></div>
        </div>

        <hr>
        <div class="chart-container">
            <h2>Desempenho Multi-Core (Crescente)</h2>
            <div id="multiCoreCount" class="chart-count"></div>
            <canvas id="multiCoreChart"></canvas>
            <div id="multiCoreComment" class="chart-comment"></div>
        </div>

        <hr>
        <div class="chart-container">
            <h2>Média de Desempenho por Litografia</h2>
            <div id="litographyCount" class="chart-count"></div>
            <canvas id="litographyChart"></canvas>
        </div>

        <hr>
        <div class="chart-container">
            <h2>Preço de Lançamento por Ano (Crescente)</h2>
            <div id="priceCount" class="chart-count"></div>
            <canvas id="priceChart"></canvas>
            <div id="priceComment" class="chart-comment"></div>
        </div>

        <hr>
        <div class="chart-container">
            <h2>Relação Desempenho/Preço de Lançamento (Crescente)</h2>
            <div id="perfPriceCount" class="chart-count"></div>
            <canvas id="perfPriceChart"></canvas>
            <div id="perfPriceComment" class="chart-comment"></div>
        </div>
    `;

    drawSingleCoreChart(processors);
    drawMultiCoreChart(processors);
    drawLitographyChart(processors);
    drawPriceChart(processors);
    drawPerfPriceChart(processors);
}

function calculatePerformanceScore(processor, allProcessors) {
    if (!processor.desempenho || processor.desempenho.single_core === null || processor.desempenho.multi_core === null) return 0;
    const performance = (processor.desempenho.single_core * 0.4) + (processor.desempenho.multi_core * 0.6);
    const allPerformances = allProcessors
        .filter(p => p.desempenho && p.desempenho.single_core !== null && p.desempenho.multi_core !== null)
        .map(p => (p.desempenho.single_core * 0.4) + (p.desempenho.multi_core * 0.6));
    const maxPerformance = Math.max(...allPerformances);
    return maxPerformance > 0 ? (performance / maxPerformance) * 10 : 0;
}

function calculateValueScore(processor, allProcessors) {
    if (!processor.preco_lancamento || processor.preco_lancamento <= 0 || !processor.desempenho || processor.desempenho.single_core === null || processor.desempenho.multi_core === null) return 0;
    const performance = (processor.desempenho.single_core * 0.4) + (processor.desempenho.multi_core * 0.6);
    const valueRatio = performance / processor.preco_lancamento;
    const allValueRatios = allProcessors
        .filter(p => p.preco_lancamento && p.preco_lancamento > 0 && p.desempenho && p.desempenho.single_core !== null && p.desempenho.multi_core !== null)
        .map(p => (((p.desempenho.single_core * 0.4) + (p.desempenho.multi_core * 0.6)) / p.preco_lancamento));
    const maxValueRatio = Math.max(...allValueRatios);
    return maxValueRatio > 0 ? (valueRatio / maxValueRatio) * 10 : 0;
}

function sortCpus(criterion) {
    if (carouselSortState.criterion === criterion) {
        carouselSortState.direction = carouselSortState.direction === 'desc' ? 'asc' : 'desc';
    } else {
        carouselSortState.criterion = criterion;
        carouselSortState.direction = 'desc';
    }
    displayAllCpuCards();
}

function updateSortButtonsUI() {
    document.querySelectorAll('.carousel-sort-controls button').forEach(btn => {
        btn.classList.remove('active');
        btn.querySelector('.sort-arrow').textContent = '';
    });
    const activeBtn = document.getElementById(`sort-${carouselSortState.criterion}-btn`);
    if (activeBtn) {
        activeBtn.classList.add('active');
        const arrow = carouselSortState.direction === 'desc' ? '↓' : '↑';
        activeBtn.querySelector('.sort-arrow').textContent = arrow;
    }
}

function displayAllCpuCards() {
    const carousel = document.getElementById('cpu-carousel');
    carousel.innerHTML = '';
    const selectedManufacturer = document.getElementById('manufacturerFilter').value;

    let eligibleProcessors = allProcessors.filter(p =>
        p.preco_lancamento > 0 && p.desempenho && p.desempenho.single_core !== null &&
        p.desempenho.multi_core !== null && p.nucleos !== null && p.threads !== null &&
        p.data_lancamento && p.fabricante
    );

    if (selectedManufacturer && selectedManufacturer !== 'all') {
        eligibleProcessors = eligibleProcessors.filter(p => p.fabricante === selectedManufacturer);
    }

    if (eligibleProcessors.length === 0) {
        carousel.innerHTML = '<div class="no-data">Nenhum processador com dados completos para exibir no carousel com os filtros selecionados.</div>';
        updateSortButtonsUI();
        return;
    }

    const allValueRatios = allProcessors
        .filter(p => p.preco_lancamento > 0 && p.desempenho && p.desempenho.single_core !== null && p.desempenho.multi_core !== null)
        .map(p => (((p.desempenho.single_core * 0.4) + (p.desempenho.multi_core * 0.6)) / p.preco_lancamento));
    const maxValueRatio = Math.max(...allValueRatios);

    let cpusWithScores = eligibleProcessors.map(cpu => {
        const performanceScore = calculatePerformanceScore(cpu, allProcessors);
        const valueScore = calculateValueScore(cpu, allProcessors);
        const generalScore = (performanceScore + valueScore) / 2;
        return { cpu, performanceScore, valueScore, generalScore };
    });

    cpusWithScores.sort((a, b) => {
        let valA, valB;
        switch (carouselSortState.criterion) {
            case 'value': valA = a.valueScore; valB = b.valueScore; break;
            case 'general': valA = a.generalScore; valB = b.generalScore; break;
            default: valA = a.performanceScore; valB = b.performanceScore; break;
        }
        return carouselSortState.direction === 'asc' ? valA - valB : valB - valA;
    });

    cpusWithScores.forEach(item => {
        const { cpu, performanceScore, valueScore, generalScore } = item;
        const year = cpu.data_lancamento.split('/')[1];
        const performance = (cpu.desempenho.single_core * 0.4) + (cpu.desempenho.multi_core * 0.6);
        const bestPrice = maxValueRatio > 0 ? (performance / maxValueRatio) : 0;
        const currentPrice = cpu.preco_lancamento;
        const badPrice = bestPrice * 10;
        let pricePositionPercent = (badPrice > bestPrice) ? ((currentPrice - bestPrice) / (badPrice - bestPrice)) * 100 : 0;
        pricePositionPercent = Math.max(0, Math.min(100, pricePositionPercent));

        const card = `
                    <div class="cpu-card">
                        <h3>${cpu.nome}</h3>
                        <p><strong>Fabricante:</strong> ${cpu.fabricante}</p>
                        <p><strong>Núcleos/Threads:</strong> ${cpu.nucleos}/${cpu.threads}</p>
                        <p><strong>Ano:</strong> ${year}</p>
                        <p><strong>Preço Lanç.:</strong> $${currentPrice.toFixed(2)}</p>
                        <div class="notes">
                            <div class="note-item"><strong>${performanceScore.toFixed(1)}</strong><span>Desempenho</span></div>
                            <div class="note-item"><strong>${valueScore.toFixed(1)}</strong><span>Custo-Benefício</span></div>
                            <div class="note-item"><strong>${generalScore.toFixed(1)}</strong><span>Nota Geral</span></div>
                        </div>
                        <div class="price-analysis-container">
                            <h4>Análise de Preço (Custo-Benefício)</h4>
                            <div class="price-bar-wrapper">
                                <div class="price-bar"></div>
                                <div class="price-marker" style="left: ${pricePositionPercent}%;">
                                    <div class="price-marker-label">Atual: $${currentPrice.toFixed(2)}</div>
                                </div>
                            </div>
                            <div class="price-labels">
                                <span>Ótimo: $${bestPrice.toFixed(2)}</span>
                                <span>Ruim: $${badPrice.toFixed(2)}</span>
                            </div>
                        </div>
                    </div>
                `;
        carousel.innerHTML += card;
    });
    updateSortButtonsUI();
}

function scrollCarousel(direction) {
    const carousel = document.getElementById('cpu-carousel');
    const card = carousel.querySelector('.cpu-card');
    if (!card) return;
    const scrollAmount = card.offsetWidth + 20; // Card width + margin
    carousel.scrollBy({ left: direction * scrollAmount, behavior: 'smooth' });
}

const commonChartOptions = { responsive: true, maintainAspectRatio: false, scales: { y: { beginAtZero: true, title: { display: true, text: 'Pontuação' } }, x: { title: { display: true, text: 'Processador' }, ticks: { autoSkip: true, maxRotation: 90, minRotation: 0 } } }, plugins: { tooltip: { callbacks: { label: function (context) { return `${context.dataset.label}: ${context.raw}`; } } } } };
function drawSingleCoreChart(processors) {
    const validProcessors = processors.filter(p => p.desempenho && p.desempenho.single_core !== null);
    validProcessors.sort((a, b) => a.desempenho.single_core - b.desempenho.single_core);

    document.getElementById('singleCoreCount').textContent = `CPUs exibidos: ${validProcessors.length}`;

    const labels = validProcessors.map(p => p.nome);
    const data = validProcessors.map(p => p.desempenho.single_core);

    const ctx = document.getElementById('singleCoreChart').getContext('2d');
    singleCoreChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [{
                label: 'Pontuação Single-Core',
                data: data,
                backgroundColor: 'rgba(75, 192, 192, 0.6)',
                borderColor: 'rgba(75, 192, 192, 1)',
                borderWidth: 1
            }]
        },
        options: commonChartOptions
    });

    let largestConsecutiveDiff = 0;
    let worst = validProcessors.length > 0 ? validProcessors[0].desempenho.single_core : 0;
    let best = validProcessors.length > 0 ? validProcessors[validProcessors.length - 1].desempenho.single_core : 0;

    for (let i = 0; i < validProcessors.length - 1; i++) {
        const current = validProcessors[i].desempenho.single_core;
        const next = validProcessors[i + 1].desempenho.single_core;
        if (current > 0) {
            const diff = ((next - current) / current) * 100;
            if (diff > largestConsecutiveDiff) {
                largestConsecutiveDiff = diff;
            }
        }
    }

    let worstToBestDiff = 0;
    if (worst > 0) {
        worstToBestDiff = ((best - worst) / worst) * 100;
    }

    const commentDiv = document.getElementById('singleCoreComment');
    if (validProcessors.length < 2) {
        commentDiv.innerHTML = "Não há dados suficientes para calcular percentuais de comparação.";
    } else {
        commentDiv.innerHTML = `
            Maior percentual de aumento entre CPUs consecutivos: <strong>${largestConsecutiveDiff.toFixed(2)}%</strong>.<br>
            Percentual de aumento do pior para o melhor: <strong>${worstToBestDiff.toFixed(2)}%</strong>.
        `;
    }
}

function drawMultiCoreChart(processors) {
    const validProcessors = processors.filter(p => p.desempenho && p.desempenho.multi_core !== null);
    validProcessors.sort((a, b) => a.desempenho.multi_core - b.desempenho.multi_core);

    document.getElementById('multiCoreCount').textContent = `CPUs exibidos: ${validProcessors.length}`;

    const labels = validProcessors.map(p => p.nome);
    const data = validProcessors.map(p => p.desempenho.multi_core);

    const ctx = document.getElementById('multiCoreChart').getContext('2d');
    multiCoreChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [{
                label: 'Pontuação Multi-Core',
                data: data,
                backgroundColor: 'rgba(153, 102, 255, 0.6)',
                borderColor: 'rgba(153, 102, 255, 1)',
                borderWidth: 1
            }]
        },
        options: commonChartOptions
    });

    let largestConsecutiveDiff = 0;
    let worst = validProcessors.length > 0 ? validProcessors[0].desempenho.multi_core : 0;
    let best = validProcessors.length > 0 ? validProcessors[validProcessors.length - 1].desempenho.multi_core : 0;

    for (let i = 0; i < validProcessors.length - 1; i++) {
        const current = validProcessors[i].desempenho.multi_core;
        const next = validProcessors[i + 1].desempenho.multi_core;
        if (current > 0) {
            const diff = ((next - current) / current) * 100;
            if (diff > largestConsecutiveDiff) {
                largestConsecutiveDiff = diff;
            }
        }
    }

    let worstToBestDiff = 0;
    if (worst > 0) {
        worstToBestDiff = ((best - worst) / worst) * 100;
    }

    const commentDiv = document.getElementById('multiCoreComment');
    if (validProcessors.length < 2) {
        commentDiv.innerHTML = "Não há dados suficientes para calcular percentuais de comparação.";
    } else {
        commentDiv.innerHTML = `
            Maior percentual de aumento entre CPUs consecutivos: <strong>${largestConsecutiveDiff.toFixed(2)}%</strong>.<br>
            Percentual de aumento do pior para o melhor: <strong>${worstToBestDiff.toFixed(2)}%</strong>.
        `;
    }
}
function drawLitographyChart(processors) { const litographyData = {}; const validProcessorsForLitho = processors.filter(p => p.litografia && p.desempenho && p.desempenho.single_core !== null && p.desempenho.multi_core !== null); validProcessorsForLitho.forEach(p => { if (!litographyData[p.litografia]) { litographyData[p.litografia] = { singleSum: 0, multiSum: 0, count: 0 }; } litographyData[p.litografia].singleSum += p.desempenho.single_core; litographyData[p.litografia].multiSum += p.desempenho.multi_core; litographyData[p.litografia].count++; }); const labels = Object.keys(litographyData).sort((a, b) => parseFloat(a) - parseFloat(b)); const avgSingleCore = labels.map(lit => litographyData[lit].singleSum / litographyData[lit].count); const avgMultiCore = labels.map(lit => litographyData[lit].multiSum / litographyData[lit].count); const ctx = document.getElementById('litographyChart').getContext('2d'); litographyChart = new Chart(ctx, { type: 'bar', data: { labels: labels, datasets: [{ label: 'Média Single-Core', data: avgSingleCore, backgroundColor: 'rgba(255, 99, 132, 0.6)', }, { label: 'Média Multi-Core', data: avgMultiCore, backgroundColor: 'rgba(54, 162, 235, 0.6)', }] }, options: { ...commonChartOptions, scales: { y: { ...commonChartOptions.scales.y, title: { text: 'Pontuação Média' } }, x: { ...commonChartOptions.scales.x, title: { text: 'Litografia (nm)' } } } } }); }
function drawPriceChart(processors) { const validProcessors = processors.filter(p => p.preco_lancamento > 0 && p.data_lancamento); validProcessors.sort((a, b) => new Date(a.data_lancamento.split('/').reverse().join('-')) - new Date(b.data_lancamento.split('/').reverse().join('-'))); const labels = validProcessors.map(p => `${p.nome} (${p.data_lancamento})`); const data = validProcessors.map(p => p.preco_lancamento); const ctx = document.getElementById('priceChart').getContext('2d'); priceChart = new Chart(ctx, { type: 'bar', data: { labels, datasets: [{ label: 'Preço de Lançamento (USD)', data, backgroundColor: 'rgba(255, 206, 86, 0.6)' }] }, options: { ...commonChartOptions, scales: { y: { ...commonChartOptions.scales.y, title: { text: 'Preço (USD)' } }, x: { ...commonChartOptions.scales.x, title: { text: 'Processador (Data)' } } } } }); }
function drawPerfPriceChart(processors) {
    const validProcessors = processors.filter(p =>
        p.preco_lancamento !== null && p.preco_lancamento !== undefined && p.preco_lancamento > 0 &&
        p.desempenho && p.desempenho.single_core !== null && p.desempenho.multi_core !== null
    );

    const perfPriceRatios = validProcessors.map(p => {
        const performance = (p.desempenho.single_core + p.desempenho.multi_core) / 2;
        return {
            name: p.nome,
            ratio: performance / p.preco_lancamento,
            originalPrice: p.preco_lancamento,
            originalSingle: p.desempenho.single_core,
            originalMulti: p.desempenho.multi_core
        };
    });

    perfPriceRatios.sort((a, b) => a.ratio - b.ratio);

    document.getElementById('perfPriceCount').textContent = `CPUs exibidos: ${perfPriceRatios.length}`;

    const labels = perfPriceRatios.map(p => p.name);
    const data = perfPriceRatios.map(p => p.ratio);

    const ctx = document.getElementById('perfPriceChart').getContext('2d');
    perfPriceChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [{
                label: 'Desempenho/Preço (Pontos/USD)',
                data: data,
                backgroundColor: 'rgba(75, 192, 192, 0.6)',
                borderColor: 'rgba(75, 192, 192, 1)',
                borderWidth: 1
            }]
        },
        options: {
            ...commonChartOptions,
            scales: {
                y: {
                    ...commonChartOptions.scales.y,
                    title: {
                        display: true,
                        text: 'Relação Desempenho/Preço'
                    }
                },
                x: {
                    ...commonChartOptions.scales.x,
                    title: {
                        display: true,
                        text: 'Processador'
                    }
                }
            },
            plugins: {
                tooltip: {
                    callbacks: {
                        label: function (context) {
                            const item = perfPriceRatios[context.dataIndex];
                            return `Relação: ${item.ratio.toFixed(2)} | Preço: $${item.originalPrice.toFixed(2)} | SC: ${item.originalSingle} | MC: ${item.originalMulti}`;
                        }
                    }
                }
            }
        }
    });

    const commentDiv = document.getElementById('perfPriceComment');
    if (perfPriceRatios.length > 0) {
        const bestPerfPrice = perfPriceRatios[perfPriceRatios.length - 1];
        const worstPerfPrice = perfPriceRatios[0];
        commentDiv.innerHTML = `
            Processador com melhor relação desempenho/preço: <strong>${bestPerfPrice.name}</strong> (Relação: ${bestPerfPrice.ratio.toFixed(2)}).<br>
            Processador com pior relação desempenho/preço: <strong>${worstPerfPrice.name}</strong> (Relação: ${worstPerfPrice.ratio.toFixed(2)}).
        `;
    } else {
        commentDiv.innerHTML = 'Não há dados suficientes (preço e desempenho) para calcular a relação desempenho/preço para os filtros selecionados.';
    }
}
function drawOverallPerfPriceChart(processors) {
    if (overallPerfPriceChart) overallPerfPriceChart.destroy();
    const validProcessors = processors.filter(p => p.preco_lancamento > 0 && p.desempenho && p.desempenho.single_core !== null && p.desempenho.multi_core !== null);
    const perfPriceRatios = validProcessors.map(p => ({
        name: p.nome, ratio: ((p.desempenho.single_core + p.desempenho.multi_core) / 2) / p.preco_lancamento
    }));
    perfPriceRatios.sort((a, b) => a.ratio - b.ratio);
    document.getElementById('overallPerfPriceCount').textContent = `CPUs exibidos: ${perfPriceRatios.length}`;
    const labels = perfPriceRatios.map(p => p.name);
    const data = perfPriceRatios.map(p => p.ratio);
    const ctx = document.getElementById('overallPerfPriceChart').getContext('2d');
    overallPerfPriceChart = new Chart(ctx, {
        type: 'bar', data: {
            labels, datasets: [{ label: 'Desempenho/Preço (Pontos/USD)', data, backgroundColor: 'rgba(255, 159, 64, 0.6)' }]
        },
        options: {
            ...commonChartOptions, scales: {
                y: {
                    ...commonChartOptions.scales.y, title: {
                        text: 'Relação Desempenho/Preço'
                    }
                }
            }
        }
    });
    const commentDiv = document.getElementById('overallPerfPriceComment'); if (perfPriceRatios.length > 0) {
        const best = perfPriceRatios[perfPriceRatios.length - 1]; const worst = perfPriceRatios[0];
        commentDiv.innerHTML = `Melhor Custo-Benefício: <strong>${best.name}</strong> (${best.ratio.toFixed(2)} pts/USD).<br>Pior Custo-Benefício: <strong>${worst.name}</strong> (${worst.ratio.toFixed(2)} pts/USD).`;
    }
}
function addWatermarkToCanvas(canvas, text) {
    const ctx = canvas.getContext('2d');
    const originalWidth = canvas.width;
    const originalHeight = canvas.height;

    ctx.save(); // Save the current canvas state

    ctx.font = '20px Arial'; // Adjust font size as needed
    ctx.fillStyle = 'rgba(0, 0, 0, 0.4)'; // Darker color, semi-transparent
    ctx.textAlign = 'right';
    ctx.textBaseline = 'bottom';

    // Measure text width to ensure it fits
    const textWidth = ctx.measureText(text).width;
    const padding = 20; // Padding from the right and bottom edges

    // Ensure text does not go out of bounds
    let x = originalWidth - padding;
    let y = originalHeight - padding;

    ctx.fillText(text, x, y);

    ctx.restore(); // Restore the canvas state
}
function downloadAllChartsAsImages() {
    const selectedThreads = document.getElementById('threadsFilter').value;
    const selectedManufacturer = document.getElementById('manufacturerFilter').value;

    const threadSuffix = selectedThreads ? `_${selectedThreads}_Threads` : '';
    const manufacturerSuffix = (selectedManufacturer && selectedManufacturer !== 'all') ? `_${selectedManufacturer}` : '';


    const chartsToDownload = [
        { chart: singleCoreChart, id: 'singleCoreChart', name: 'Desempenho_SingleCore', usesFilter: true },
        { chart: multiCoreChart, id: 'multiCoreChart', name: 'Desempenho_MultiCore', usesFilter: true },
        { chart: litographyChart, id: 'litographyChart', name: 'Desempenho_Litografia', usesFilter: true },
        { chart: priceChart, id: 'priceChart', name: 'Preco_Lancamento', usesFilter: true },
        { chart: perfPriceChart, id: 'perfPriceChart', name: 'Relacao_Desempenho_Preco_Filtrado', usesFilter: true },
        { chart: overallPerfPriceChart, id: 'overallPerfPriceChart', name: 'Relacao_Desempenho_Preco_Geral', usesFilter: false }
    ];

    chartsToDownload.forEach(chartInfo => {
        const canvas = document.getElementById(chartInfo.id);
        if (canvas && canvas.offsetParent !== null) {
            // Create a temporary canvas to draw the image and watermark
            const tempCanvas = document.createElement('canvas');
            tempCanvas.width = canvas.width;
            tempCanvas.height = canvas.height;
            const tempCtx = tempCanvas.getContext('2d');

            // Draw the chart image onto the temporary canvas
            tempCtx.drawImage(canvas, 0, 0);

            // Add the watermark
            addWatermarkToCanvas(tempCanvas, GITHUB_LINK);

            const image = tempCanvas.toDataURL('image/png');
            const link = document.createElement('a');

            const fileName = chartInfo.usesFilter ? `${chartInfo.name}${threadSuffix}${manufacturerSuffix}.png` : `${chartInfo.name}.png`;

            link.href = image;
            link.download = fileName;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        }
    });
}


document.addEventListener('DOMContentLoaded', fetchData);