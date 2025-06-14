let allCPUs = []; // Store all CPUs from the JSON
let filteredCPUs = []; // Store currently filtered CPUs (based on general filters)
let selectedCPUs = []; // Store CPUs selected for comparison

// Chart instances
let singleCoreChart, multiCoreChart, litographyChart, priceChart, perfPriceChart;

document.addEventListener('DOMContentLoaded', () => {
    fetch('cpusAmd-Intel-2017-2025.json')
        .then(response => response.json())
        .then(data => {
            // Filter allCPUs initially to only include those with performance data
            // And add 'linha_nome' for filtering
            allCPUs = data.processadores.filter(cpu =>
                cpu.desempenho &&
                cpu.desempenho.single_core !== null &&
                cpu.desempenho.multi_core !== null
            ).map(cpu => {
                cpu.linha_nome = determineCpuLine(cpu.nome, cpu.fabricante);
                return cpu;
            });

            populateFilters(allCPUs);
            // Charts will NOT be drawn here initially. User must click "Aplicar Filtros" or "Comparar".
            updatePerformanceCpuCount([]); // Initialize count to 0 for all displays
            drawCharts([]); // Clear charts initially
        })
        .catch(error => console.error('Erro ao carregar o arquivo JSON:', error));

    const applyFiltersBtn = document.getElementById('apply-filters-btn');
    applyFiltersBtn.addEventListener('click', () => applyFiltersAndDrawCharts(false)); // Not comparison mode

    const fabricanteSelect = document.getElementById('fabricante');
    fabricanteSelect.addEventListener('change', updateLinhaFilterOptions);
    // No direct chart redraw on filter change, only on "Aplicar Filtros" click

    // Mobile menu toggling
    const menuToggleBtn = document.getElementById('menu-toggle-btn');
    const closeBtn = document.getElementById('close-btn');
    const sidebar = document.getElementById('sidebar');

    menuToggleBtn.addEventListener('click', () => {
        sidebar.classList.add('open');
        document.body.classList.add('no-scroll'); // Adicionado: Previne rolagem do conteúdo principal
    });

    closeBtn.addEventListener('click', () => {
        sidebar.classList.remove('open');
        document.body.classList.remove('no-scroll'); // Adicionado: Reativa rolagem
    });

    // CPU Search and Compare Feature
    const cpuSearchInput = document.getElementById('cpu-search');
    const cpuSearchResultsDiv = document.getElementById('cpu-search-results');
    const compareCpusBtn = document.getElementById('compare-cpus-btn');

    cpuSearchInput.addEventListener('input', () => {
        const query = cpuSearchInput.value.toLowerCase();
        displaySearchResults(query);
    });

    compareCpusBtn.addEventListener('click', () => {
        applyFiltersAndDrawCharts(true); // Comparison mode
        document.getElementById('sidebar').classList.remove('open'); // Close sidebar on mobile after comparing
        document.body.classList.remove('no-scroll'); // Reativa rolagem após fechar o menu ao comparar
    });
});

// Function to determine CPU line from its name
function determineCpuLine(cpuName, manufacturer) {
    const nameLower = cpuName.toLowerCase();
    if (manufacturer === 'AMD') {
        if (nameLower.includes('ryzen 3')) return 'Ryzen 3';
        if (nameLower.includes('ryzen 5')) return 'Ryzen 5';
        if (nameLower.includes('ryzen 7')) return 'Ryzen 7';
        if (nameLower.includes('ryzen 9')) return 'Ryzen 9';
        if (nameLower.includes('athlon')) return 'Athlon';
        if (nameLower.includes('a10') || nameLower.includes('a12') || nameLower.includes('a6') || nameLower.includes('a8')) return 'Linha A';
        if (nameLower.includes('threadripper')) return 'Threadripper'; // Added for completeness
    } else if (manufacturer === 'Intel') {
        if (nameLower.includes('core i3') || nameLower.includes('i3')) return 'Core i3';
        if (nameLower.includes('core i5') || nameLower.includes('i5')) return 'Core i5';
        if (nameLower.includes('core i7') || nameLower.includes('i7')) return 'Core i7';
        if (nameLower.includes('core i9') || nameLower.includes('i9')) return 'Core i9';
        if (nameLower.includes('core ultra 5')) return 'Core Ultra 5'; // For new Intel lines
        if (nameLower.includes('core ultra 7')) return 'Core Ultra 7';
        if (nameLower.includes('core ultra 9')) return 'Core Ultra 9';
        if (nameLower.includes('pentium')) return 'Pentium';
        if (nameLower.includes('celeron')) return 'Celeron';
        if (nameLower.includes('xeon')) return 'Xeon'; // Added for completeness
    }
    return 'Outros'; // Default for unrecognized lines
}

function populateFilters(cpus) {
    const fabricanteSelect = document.getElementById('fabricante');
    const nucleosSelect = document.getElementById('nucleos');

    // Populate Nucleos
    const uniqueNucleos = [...new Set(cpus.map(cpu => cpu.nucleos).filter(n => n !== null))].sort((a, b) => a - b);
    nucleosSelect.innerHTML = '<option value="Todas">Todas</option>';
    uniqueNucleos.forEach(nucleo => {
        const option = document.createElement('option');
        option.value = nucleo;
        option.textContent = nucleo;
        nucleosSelect.appendChild(option);
    });

    // Populate Linha de Processadores based on initial "Todas" or selected manufacturer
    updateLinhaFilterOptions();
}

function updateLinhaFilterOptions() {
    const fabricanteSelect = document.getElementById('fabricante');
    const linhaSelect = document.getElementById('linha');
    const selectedFabricante = fabricanteSelect.value;

    linhaSelect.innerHTML = '<option value="Todas">Todas</option>';
    linhaSelect.disabled = false;

    let cpusByFabricante = allCPUs;
    if (selectedFabricante !== 'Todas') {
        cpusByFabricante = allCPUs.filter(cpu => cpu.fabricante === selectedFabricante);
    }

    // Use 'linha_nome' for populating the filter
    const uniqueLinhas = [...new Set(cpusByFabricante.map(cpu => cpu.linha_nome).filter(l => l !== null && l !== 'Outros'))].sort();
    // Add 'Outros' if it exists and wasn't added by sorting
    if (cpusByFabricante.some(cpu => cpu.linha_nome === 'Outros')) {
        uniqueLinhas.push('Outros');
    }

    uniqueLinhas.forEach(linha => {
        const option = document.createElement('option');
        option.value = linha;
        option.textContent = linha;
        linhaSelect.appendChild(option);
    });
}


function applyFiltersAndDrawCharts(isComparisonMode = false) {
    let cpusToDisplay = [];

    if (isComparisonMode && selectedCPUs.length > 0) {
        cpusToDisplay = allCPUs.filter(cpu => selectedCPUs.some(selected => selected.nome === cpu.nome));
    } else {
        // Apply general filters (Fabricante, Linha, Nucleos)
        const fabricante = document.getElementById('fabricante').value;
        const linha = document.getElementById('linha').value; // Now uses linha_nome
        const nucleos = document.getElementById('nucleos').value;

        cpusToDisplay = allCPUs.filter(cpu => {
            let matches = true;

            if (fabricante !== 'Todas' && cpu.fabricante !== fabricante) {
                matches = false;
            }
            if (linha !== 'Todas' && cpu.linha_nome !== linha) { // Use linha_nome here
                matches = false;
            }
            if (nucleos !== 'Todas' && cpu.nucleos !== parseInt(nucleos)) {
                matches = false;
            }
            // This initial filter for performance data is already done when loading allCPUs,
            // but keeping a check here ensures robustness if allCPUs somehow gets un-filtered.
            if (!(cpu.desempenho && cpu.desempenho.single_core !== null && cpu.desempenho.multi_core !== null)) {
                matches = false;
            }
            return matches;
        });
    }

    filteredCPUs = cpusToDisplay; // Update the global filteredCPUs for general filtering context
    updatePerformanceCpuCount(cpusToDisplay);
    drawCharts(cpusToDisplay);
    document.getElementById('sidebar').classList.remove('open'); // Close sidebar on mobile after applying filters
    document.body.classList.remove('no-scroll'); // Reativa rolagem após fechar o menu ao aplicar filtros
}

function updatePerformanceCpuCount(cpus) {
    const count = cpus.length;
    document.getElementById('cpu-count').textContent = `${count} processadores exibidos com os filtros atuais.`;
    // These will be updated by individual chart functions with their specific data counts
    document.getElementById('single-core-cpu-count').textContent = `0 processadores exibidos`;
    document.getElementById('multi-core-cpu-count').textContent = `0 processadores exibidos`;
    document.getElementById('litography-cpu-count').textContent = `0 processadores exibidos`;
    document.getElementById('price-cpu-count').textContent = `0 processadores exibidos`;
    document.getElementById('perf-price-cpu-count').textContent = `0 processadores exibidos`;
}

function drawCharts(cpus) {
    // Destroy existing charts to prevent memory leaks and redraw issues
    if (singleCoreChart) singleCoreChart.destroy();
    if (multiCoreChart) multiCoreChart.destroy();
    if (litographyChart) litographyChart.destroy();
    if (priceChart) priceChart.destroy();
    if (perfPriceChart) perfPriceChart.destroy();

    // Ensure all data used for charts has the necessary properties
    const cpusWithSingleCore = cpus.filter(cpu => cpu.desempenho && cpu.desempenho.single_core !== null);
    const cpusWithMultiCore = cpus.filter(cpu => cpu.desempenho && cpu.desempenho.multi_core !== null);
    const cpusForLitography = cpus.filter(cpu => cpu.litografia && cpu.desempenho && cpu.desempenho.multi_core !== null);
    const cpusForPrice = cpus.filter(cpu => cpu.data_lancamento && cpu.preco_lancamento !== null);
    const cpusForPerfPrice = cpus.filter(cpu => cpu.desempenho && cpu.desempenho.multi_core !== null && cpu.preco_lancamento !== null && cpu.preco_lancamento > 0);


    drawSingleCoreChart(cpusWithSingleCore); // Pass filtered CPUs with single core data
    drawMultiCoreChart(cpusWithMultiCore); // Pass filtered CPUs with multi core data
    drawLitographyChart(cpusForLitography);
    drawPriceChart(cpusForPrice);
    drawPerfPriceChart(cpusForPerfPrice);
}

function drawSingleCoreChart(cpus) {
    // Sort all CPUs by single_core performance in ASCENDING order
    const singleCoreData = cpus.sort((a, b) => a.desempenho.single_core - b.desempenho.single_core);

    const labels = singleCoreData.map(cpu => cpu.nome);
    const data = singleCoreData.map(cpu => cpu.desempenho.single_core);

    const ctx = document.getElementById('singleCoreChart').getContext('2d');
    singleCoreChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [{
                label: 'Desempenho Single Core',
                data: data,
                backgroundColor: 'rgba(75, 192, 192, 0.6)',
                borderColor: 'rgba(75, 192, 192, 1)',
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false
                }
            },
            scales: {
                y: {
                    beginAtZero: true
                }
            }
        }
    });

    // Comments for Single Core Chart
    let comment = '';
    document.getElementById('single-core-cpu-count').textContent = `${singleCoreData.length} processadores exibidos`;

    if (singleCoreData.length > 1) { // Need at least 2 CPUs for comparison
        // Find the largest percentage increase between consecutive CPUs
        let maxConsecutiveIncrease = 0;
        let cpuConsecutive1Name = '';
        let cpuConsecutive2Name = '';

        for (let i = 0; i < singleCoreData.length - 1; i++) {
            const currentCPU = singleCoreData[i];
            const nextCPU = singleCoreData[i + 1];
            if (currentCPU.desempenho.single_core > 0) { // Avoid division by zero
                const increase = ((nextCPU.desempenho.single_core - currentCPU.desempenho.single_core) / currentCPU.desempenho.single_core) * 100;
                if (increase > maxConsecutiveIncrease) {
                    maxConsecutiveIncrease = increase;
                    cpuConsecutive1Name = currentCPU.nome;
                    cpuConsecutive2Name = nextCPU.nome;
                }
            }
        }

        const worstCPU = singleCoreData[0];
        const bestCPU = singleCoreData[singleCoreData.length - 1];
        let diffBestWorst = 0;
        if (worstCPU.desempenho.single_core > 0) {
            diffBestWorst = ((bestCPU.desempenho.single_core - worstCPU.desempenho.single_core) / worstCPU.desempenho.single_core) * 100;
        }

        comment += `Maior percentual de aumento entre CPUs consecutivas: ${cpuConsecutive1Name} para ${cpuConsecutive2Name} (${maxConsecutiveIncrease.toFixed(2)}%)`;
        comment += `<br>Diferença percentual entre o pior (${worstCPU.nome}) e o melhor (${bestCPU.nome}) do gráfico: ${diffBestWorst.toFixed(2)}%`;

    } else if (singleCoreData.length === 1) {
        comment = `Apenas um processador (${singleCoreData[0].nome}) exibido. Não há comparações consecutivas.`;
    } else {
        comment = 'Não há dados suficientes para analisar o desempenho single core.';
    }
    document.getElementById('single-core-comment').innerHTML = comment;
}


function drawMultiCoreChart(cpus) {
    // Sort all CPUs by multi_core performance in ASCENDING order
    const multiCoreData = cpus.sort((a, b) => a.desempenho.multi_core - b.desempenho.multi_core);

    const labels = multiCoreData.map(cpu => cpu.nome);
    const data = multiCoreData.map(cpu => cpu.desempenho.multi_core);

    const ctx = document.getElementById('multiCoreChart').getContext('2d');
    multiCoreChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [{
                label: 'Desempenho Multi Core',
                data: data,
                backgroundColor: 'rgba(153, 102, 255, 0.6)',
                borderColor: 'rgba(153, 102, 255, 1)',
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false
                }
            },
            scales: {
                y: {
                    beginAtZero: true
                }
            }
        }
    });

    // Comments for Multi Core Chart
    let comment = '';
    document.getElementById('multi-core-cpu-count').textContent = `${multiCoreData.length} processadores exibidos`;

    if (multiCoreData.length > 1) { // Need at least 2 CPUs for comparison
        // Find the largest percentage increase between consecutive CPUs
        let maxConsecutiveIncrease = 0;
        let cpuConsecutive1Name = '';
        let cpuConsecutive2Name = '';

        for (let i = 0; i < multiCoreData.length - 1; i++) {
            const currentCPU = multiCoreData[i];
            const nextCPU = multiCoreData[i + 1];
            if (currentCPU.desempenho.multi_core > 0) { // Avoid division by zero
                const increase = ((nextCPU.desempenho.multi_core - currentCPU.desempenho.multi_core) / currentCPU.desempenho.multi_core) * 100;
                if (increase > maxConsecutiveIncrease) {
                    maxConsecutiveIncrease = increase;
                    cpuConsecutive1Name = currentCPU.nome;
                    cpuConsecutive2Name = nextCPU.nome;
                }
            }
        }

        const worstCPU = multiCoreData[0];
        const bestCPU = multiCoreData[multiCoreData.length - 1];
        let diffBestWorst = 0;
        if (worstCPU.desempenho.multi_core > 0) {
            diffBestWorst = ((bestCPU.desempenho.multi_core - worstCPU.desempenho.multi_core) / worstCPU.desempenho.multi_core) * 100;
        }

        comment += `Maior percentual de aumento entre CPUs consecutivas: ${cpuConsecutive1Name} para ${cpuConsecutive2Name} (${maxConsecutiveIncrease.toFixed(2)}%)`;
        comment += `<br>Diferença percentual entre o pior (${worstCPU.nome}) e o melhor (${bestCPU.nome}) do gráfico: ${diffBestWorst.toFixed(2)}%`;
    } else if (multiCoreData.length === 1) {
        comment = `Apenas um processador (${multiCoreData[0].nome}) exibido. Não há comparações consecutivas.`;
    } else {
        comment = 'Não há dados suficientes para analisar o desempenho multi core.';
    }
    document.getElementById('multi-core-comment').innerHTML = comment;
}

function drawLitographyChart(cpus) {
    const litographyData = {}; // { "14 nm": { totalPerformance: 0, count: 0 }, ... }

    cpus.forEach(cpu => {
        if (cpu.litografia && cpu.desempenho && cpu.desempenho.multi_core !== null) {
            const litography = cpu.litografia;
            if (!litographyData[litography]) {
                litographyData[litography] = { totalPerformance: 0, count: 0 };
            }
            litographyData[litography].totalPerformance += cpu.desempenho.multi_core;
            litographyData[litography].count++;
        }
    });

    const averagedData = Object.keys(litographyData).map(litography => {
        return {
            litography: litography,
            averagePerformance: litographyData[litography].totalPerformance / litographyData[litography].count
        };
    }).sort((a, b) => parseFloat(a.litography) - parseFloat(b.litography)); // Sort by nanometer value ASCENDING

    const labels = averagedData.map(item => item.litography);
    const data = averagedData.map(item => item.averagePerformance);

    const ctx = document.getElementById('litographyChart').getContext('2d');
    litographyChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [{
                label: 'Desempenho Multi Core Médio',
                data: data,
                backgroundColor: 'rgba(255, 159, 64, 0.6)',
                borderColor: 'rgba(255, 159, 64, 1)',
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false
                }
            },
            scales: {
                y: {
                    beginAtZero: true
                }
            }
        }
    });

    // Comments for Litography Chart
    let comment = '';
    document.getElementById('litography-cpu-count').textContent = `${cpus.length} processadores exibidos`;
    if (averagedData.length > 0) {
        comment = 'Este gráfico mostra o desempenho médio multi core por litografia. Litografias menores geralmente indicam maior eficiência.';
    } else {
        comment = 'Não há dados suficientes para analisar o desempenho por litografia.';
    }
    document.getElementById('litography-comment').innerHTML = comment;
}

function drawPriceChart(cpus) {
    const priceData = {}; // { "2017": { totalPrice: 0, count: 0 }, ... }

    cpus.forEach(cpu => {
        if (cpu.data_lancamento && cpu.preco_lancamento !== null) {
            const year = cpu.data_lancamento.split('/')[1]; // Extract year
            if (!priceData[year]) {
                priceData[year] = { totalPrice: 0, count: 0 };
            }
            priceData[year].totalPrice += cpu.preco_lancamento;
            priceData[year].count++;
        }
    });

    const averagedData = Object.keys(priceData).map(year => {
        return {
            year: year,
            averagePrice: priceData[year].totalPrice / priceData[year].count
        };
    }).sort((a, b) => parseInt(a.year) - parseInt(b.year)); // Sort by year ASCENDING

    const labels = averagedData.map(item => item.year);
    const data = averagedData.map(item => item.averagePrice);

    const ctx = document.getElementById('priceChart').getContext('2d');
    priceChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                label: 'Preço de Lançamento Médio ($)',
                data: data,
                backgroundColor: 'rgba(54, 162, 235, 0.6)',
                borderColor: 'rgba(54, 162, 235, 1)',
                borderWidth: 1,
                fill: false,
                tension: 0.1
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: true
                }
            },
            scales: {
                y: {
                    beginAtZero: true
                }
            }
        }
    });
    // Comments for Price Chart
    let comment = '';
    document.getElementById('price-cpu-count').textContent = `${cpus.length} processadores exibidos`;
    if (averagedData.length > 0) {
        comment = 'Este gráfico exibe a evolução do preço médio de lançamento dos processadores ao longo dos anos.';
    } else {
        comment = 'Não há dados suficientes para analisar o preço por ano.';
    }
    document.getElementById('price-comment').innerHTML = comment;
}

function drawPerfPriceChart(cpus) {
    const perfPriceData = cpus
        .filter(cpu => cpu.desempenho && cpu.desempenho.multi_core !== null && cpu.preco_lancamento !== null && cpu.preco_lancamento > 0)
        .map(cpu => ({
            name: cpu.nome,
            value: cpu.desempenho.multi_core / cpu.preco_lancamento
        }))
        .sort((a, b) => a.value - b.value); // Sort ascending for "cost-benefit" (lower value is worse, higher is better)

    const labels = perfPriceData.map(item => item.name);
    const data = perfPriceData.map(item => item.value);

    // Generate distinct colors for each bar
    const backgroundColors = data.map((_, index) => {
        // Simple distinct color generation, can be more sophisticated
        const hue = (index * 137) % 360; // Use a prime number to spread colors
        return `hsl(${hue}, 70%, 60%)`;
    });
    const borderColors = backgroundColors.map(color => color.replace('0.6', '1')); // Opaque border

    const ctx = document.getElementById('perfPriceChart').getContext('2d');
    perfPriceChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [{
                label: 'Desempenho/Preço de Lançamento',
                data: data,
                backgroundColor: backgroundColors,
                borderColor: borderColors,
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            indexAxis: 'y', // Horizontal bars
            plugins: {
                legend: {
                    display: false
                }
            },
            scales: {
                x: {
                    beginAtZero: true
                }
            }
        }
    });

    // Comments for Perf/Price Chart
    let comment = '';
    document.getElementById('perf-price-cpu-count').textContent = `${cpus.length} processadores exibidos`;
    if (perfPriceData.length > 0) {
        const worstCPU = perfPriceData[0]; // First one due to ascending sort
        const bestCPU = perfPriceData[perfPriceData.length - 1]; // Last one due to ascending sort

        comment += `Melhor custo-benefício: ${bestCPU.name} (${bestCPU.value.toFixed(2)})`;
        comment += `<br>Pior custo-benefício: ${worstCPU.name} (${worstCPU.value.toFixed(2)})`;
    } else {
        comment = 'Não há dados suficientes para determinar custo-benefício.';
    }
    document.getElementById('perf-price-comment').innerHTML = comment;
}


// Comparison Feature Functions

function displaySearchResults(query) {
    const cpuSearchResultsDiv = document.getElementById('cpu-search-results');
    cpuSearchResultsDiv.innerHTML = '';

    if (query.length < 2) { // Only search if query is at least 2 characters
        return;
    }

    const results = allCPUs.filter(cpu =>
        cpu.nome.toLowerCase().includes(query) &&
        !selectedCPUs.some(selected => selected.nome === cpu.nome) // Don't show already selected CPUs
    ).slice(0, 10); // Limit results to top 10 for search dropdown

    results.forEach(cpu => {
        const div = document.createElement('div');
        div.textContent = cpu.nome;
        div.addEventListener('click', () => {
            addCpuToSelection(cpu.nome);
            document.getElementById('cpu-search').value = ''; // Clear search bar
            cpuSearchResultsDiv.innerHTML = ''; // Clear search results
        });
        cpuSearchResultsDiv.appendChild(div);
    });
}

function addCpuToSelection(cpuName) {
    const cpuToAdd = allCPUs.find(cpu => cpu.nome === cpuName);
    if (cpuToAdd && !selectedCPUs.some(cpu => cpu.nome === cpuName)) {
        selectedCPUs.push(cpuToAdd);
        updateSelectedCpusDisplay();
        document.getElementById('compare-cpus-btn').disabled = false; // Enable compare button
    }
}

function removeCpuFromSelection(cpuName) {
    selectedCPUs = selectedCPUs.filter(cpu => cpu.nome !== cpuName);
    updateSelectedCpusDisplay();
    if (selectedCPUs.length === 0) {
        document.getElementById('compare-cpus-btn').disabled = true; // Disable compare button
        // Changed: Instead of applyFiltersAndDrawCharts(false), clear charts.
        updatePerformanceCpuCount([]); // Reset all CPU count displays to 0
        drawCharts([]); // Clear all chart canvases
        document.getElementById('cpu-count').textContent = `0 processadores exibidos com os filtros atuais.`; // Reset main CPU count display
        document.body.classList.remove('no-scroll'); // Reativa rolagem caso tenha sido desativada pelo menu
    }
}

function updateSelectedCpusDisplay() {
    const selectedCpusDisplayDiv = document.getElementById('selected-cpus-display');
    selectedCpusDisplayDiv.innerHTML = '';

    if (selectedCPUs.length === 0) {
        selectedCpusDisplayDiv.innerHTML = '<span id="no-cpu-selected">Nenhum CPU selecionado.</span>';
        document.getElementById('compare-cpus-btn').disabled = true;
        return;
    }

    selectedCPUs.forEach(cpu => {
        const span = document.createElement('span');
        span.classList.add('selected-cpu-tag');
        span.textContent = cpu.nome;

        const removeBtn = document.createElement('span');
        removeBtn.classList.add('remove-cpu');
        removeBtn.textContent = 'x';
        removeBtn.addEventListener('click', () => removeCpuFromSelection(cpu.nome));

        span.appendChild(removeBtn);
        selectedCpusDisplayDiv.appendChild(span);
    });

    document.getElementById('compare-cpus-btn').disabled = false;
}
