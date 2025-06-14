let allCPUs = []; // Store all CPUs from the JSON
let filteredCPUs = []; // Store currently filtered CPUs

// Chart instances
let singleCoreChart, multiCoreChart, litographyChart, priceChart, perfPriceChart;

document.addEventListener('DOMContentLoaded', () => {
    fetch('cpusAmd-Intel-2017-2025.json')
        .then(response => response.json())
        .then(data => {
            allCPUs = data.processadores;
            populateFilters(allCPUs);
            updatePerformanceCpuCount(allCPUs);
            // Initial render (no filters applied yet)
            // Charts will be drawn after filters are applied.
        })
        .catch(error => console.error('Erro ao carregar o arquivo JSON:', error));

    const applyFiltersBtn = document.getElementById('apply-filters-btn');
    applyFiltersBtn.addEventListener('click', applyFiltersAndDrawCharts);

    const fabricanteSelect = document.getElementById('fabricante');
    fabricanteSelect.addEventListener('change', updateLinhaFilterOptions);

    // Mobile menu toggling
    const menuToggleBtn = document.getElementById('menu-toggle-btn');
    const closeBtn = document.getElementById('close-btn');
    const sidebar = document.getElementById('sidebar');

    menuToggleBtn.addEventListener('click', () => {
        sidebar.classList.add('open');
    });

    closeBtn.addEventListener('click', () => {
        sidebar.classList.remove('open');
    });

    // Close sidebar if clicking outside when in mobile view (optional but good UX)
    document.addEventListener('click', (event) => {
        if (window.innerWidth <= 768 && !sidebar.contains(event.target) && !menuToggleBtn.contains(event.target) && sidebar.classList.contains('open')) {
            sidebar.classList.remove('open');
        }
    });
});

function populateFilters(cpus) {
    const nucleosSelect = document.getElementById('nucleos');
    const linhaSelect = document.getElementById('linha');

    // Populate Núcleos filter
    const uniqueNucleos = [...new Set(cpus.map(cpu => cpu.nucleos))].sort((a, b) => a - b);
    uniqueNucleos.forEach(nucleo => {
        const option = document.createElement('option');
        option.value = nucleo;
        option.textContent = nucleo;
        nucleosSelect.appendChild(option);
    });

    // Linha de Processadores is dynamically populated based on manufacturer
    updateLinhaFilterOptions();
}

function updateLinhaFilterOptions() {
    const fabricante = document.getElementById('fabricante').value;
    const linhaSelect = document.getElementById('linha');
    linhaSelect.innerHTML = '<option value="Todas">Todas</option>'; // Reset options
    linhaSelect.disabled = false; // Enable by default

    let linhas = [];
    if (fabricante === 'AMD') {
        linhas = ['Ryzen 3', 'Ryzen 5', 'Ryzen 7', 'Ryzen 9', 'Athlon', 'Linha A'];
    } else if (fabricante === 'Intel') {
        linhas = ['i3', 'i5', 'i7', 'i9', 'Celeron', 'Pentium'];
    } else { // Todas
        linhaSelect.disabled = true; // Disable if "Todas" manufacturers are selected
        return; // No specific lines to add
    }

    linhas.forEach(linha => {
        const option = document.createElement('option');
        option.value = linha;
        option.textContent = linha;
        linhaSelect.appendChild(option);
    });
}

function applyFiltersAndDrawCharts() {
    const fabricante = document.getElementById('fabricante').value;
    const linha = document.getElementById('linha').value;
    const nucleos = document.getElementById('nucleos').value;

    filteredCPUs = allCPUs.filter(cpu => {
        // Filter by Fabricante
        if (fabricante !== 'Todas' && cpu.fabricante !== fabricante) {
            return false;
        }

        // Filter by Linha de Processadores
        if (linha !== 'Todas' && !getProcessorLine(cpu.nome, cpu.fabricante).includes(linha)) {
            return false;
        }

        // Filter by Contagem de Núcleos
        if (nucleos !== 'Todas' && cpu.nucleos !== parseInt(nucleos)) {
            return false;
        }

        return true;
    }).filter(cpu => cpu.desempenho && cpu.desempenho.single_core && cpu.desempenho.multi_core); // Only include CPUs with performance data

    updatePerformanceCpuCount(filteredCPUs);
    drawSingleCoreChart(filteredCPUs, fabricante);
    drawMultiCoreChart(filteredCPUs, fabricante);
    drawLitographyChart(filteredCPUs, fabricante);
    drawPriceChart(filteredCPUs, fabricante);
    drawPerfPriceChart(filteredCPUs, fabricante);
}

function getProcessorLine(cpuName, manufacturer) {
    cpuName = cpuName.toLowerCase();
    if (manufacturer === 'AMD') {
        if (cpuName.includes('ryzen 3')) return 'Ryzen 3';
        if (cpuName.includes('ryzen 5')) return 'Ryzen 5';
        if (cpuName.includes('ryzen 7')) return 'Ryzen 7';
        if (cpuName.includes('ryzen 9')) return 'Ryzen 9';
        if (cpuName.includes('athlon')) return 'Athlon';
        if (cpuName.includes('a')) return 'Linha A'; // Generic for A-series like A10-9700
    } else if (manufacturer === 'Intel') {
        if (cpuName.includes('i3')) return 'i3';
        if (cpuName.includes('i5')) return 'i5';
        if (cpuName.includes('i7')) return 'i7';
        if (cpuName.includes('i9')) return 'i9';
        if (cpuName.includes('celeron')) return 'Celeron';
        if (cpuName.includes('pentium')) return 'Pentium';
    }
    return 'Outros'; // Fallback
}


function updatePerformanceCpuCount(cpus) {
    const count = cpus.filter(cpu => cpu.desempenho && cpu.desempenho.single_core && cpu.desempenho.multi_core).length;
    document.getElementById('performance-cpu-count').textContent = count;
}

function getBarColors(cpu, selectedFabricante) {
    if (selectedFabricante === 'Todas') {
        return cpu.fabricante === 'Intel' ? 'rgba(0, 123, 255, 0.7)' : 'rgba(255, 0, 0, 0.7)'; // Blue for Intel, Red for AMD
    }
    return 'rgba(75, 192, 192, 0.7)'; // Default for single manufacturer
}

function getBorderColors(cpu, selectedFabricante) {
    if (selectedFabricante === 'Todas') {
        return cpu.fabricante === 'Intel' ? 'rgba(0, 123, 255, 1)' : 'rgba(255, 0, 0, 1)';
    }
    return 'rgba(75, 192, 192, 1)';
}

function calculatePercentageIncrease(value1, value2) {
    if (value1 === 0) return 'N/A';
    return (((value2 - value1) / value1) * 100).toFixed(2);
}

// --- Chart Functions ---

function drawSingleCoreChart(cpus, selectedFabricante) {
    if (singleCoreChart) singleCoreChart.destroy();

    const sortedCpus = [...cpus].sort((a, b) => a.desempenho.single_core - b.desempenho.single_core);

    const labels = sortedCpus.map(cpu => cpu.nome);
    const data = sortedCpus.map(cpu => cpu.desempenho.single_core);
    const backgroundColors = sortedCpus.map(cpu => getBarColors(cpu, selectedFabricante));
    const borderColors = sortedCpus.map(cpu => getBorderColors(cpu, selectedFabricante));

    const ctx = document.getElementById('singleCoreChart').getContext('2d');
    singleCoreChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [{
                label: 'Pontuação Single Core',
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

    // Comments for Single Core Chart
    let comment = '';
    if (sortedCpus.length > 1) {
        let maxConsecutiveIncrease = 0;
        let worstValue = sortedCpus[0].desempenho.single_core;
        let bestValue = sortedCpus[sortedCpus.length - 1].desempenho.single_core;

        for (let i = 0; i < sortedCpus.length - 1; i++) {
            const current = sortedCpus[i].desempenho.single_core;
            const next = sortedCpus[i + 1].desempenho.single_core;
            const increase = parseFloat(calculatePercentageIncrease(current, next));
            if (!isNaN(increase) && increase > maxConsecutiveIncrease) {
                maxConsecutiveIncrease = increase;
            }
        }
        const totalIncrease = parseFloat(calculatePercentageIncrease(worstValue, bestValue));

        comment += `Maior percentual de aumento entre dois processadores consecutivos: ${maxConsecutiveIncrease}%`;
        if (!isNaN(totalIncrease)) {
            comment += `<br>Percentual de aumento entre o pior e o melhor: ${totalIncrease}%`;
        }
    } else {
        comment = 'Não há dados suficientes para calcular percentuais.';
    }
    document.getElementById('single-core-comment').innerHTML = comment;
    document.getElementById('single-core-cpu-count').textContent = `${sortedCpus.length} processadores exibidos`;
}

function drawMultiCoreChart(cpus, selectedFabricante) {
    if (multiCoreChart) multiCoreChart.destroy();

    const sortedCpus = [...cpus].sort((a, b) => a.desempenho.multi_core - b.desempenho.multi_core);

    const labels = sortedCpus.map(cpu => cpu.nome);
    const data = sortedCpus.map(cpu => cpu.desempenho.multi_core);
    const backgroundColors = sortedCpus.map(cpu => getBarColors(cpu, selectedFabricante));
    const borderColors = sortedCpus.map(cpu => getBorderColors(cpu, selectedFabricante));

    const ctx = document.getElementById('multiCoreChart').getContext('2d');
    multiCoreChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [{
                label: 'Pontuação Multi Core',
                data: data,
                backgroundColor: backgroundColors,
                borderColor: borderColors,
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            indexAxis: 'y',
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

    // Comments for Multi Core Chart
    let comment = '';
    if (sortedCpus.length > 1) {
        let maxConsecutiveIncrease = 0;
        let worstValue = sortedCpus[0].desempenho.multi_core;
        let bestValue = sortedCpus[sortedCpus.length - 1].desempenho.multi_core;

        for (let i = 0; i < sortedCpus.length - 1; i++) {
            const current = sortedCpus[i].desempenho.multi_core;
            const next = sortedCpus[i + 1].desempenho.multi_core;
            const increase = parseFloat(calculatePercentageIncrease(current, next));
            if (!isNaN(increase) && increase > maxConsecutiveIncrease) {
                maxConsecutiveIncrease = increase;
            }
        }
        const totalIncrease = parseFloat(calculatePercentageIncrease(worstValue, bestValue));

        comment += `Maior percentual de aumento entre dois processadores consecutivos: ${maxConsecutiveIncrease}%`;
        if (!isNaN(totalIncrease)) {
            comment += `<br>Percentual de aumento entre o pior e o melhor: ${totalIncrease}%`;
        }
    } else {
        comment = 'Não há dados suficientes para calcular percentuais.';
    }
    document.getElementById('multi-core-comment').innerHTML = comment;
    document.getElementById('multi-core-cpu-count').textContent = `${sortedCpus.length} processadores exibidos`;
}

function drawLitographyChart(cpus, selectedFabricante) {
    if (litographyChart) litographyChart.destroy();

    const litographyData = {}; // { "28 nm": { totalMultiCore: 0, count: 0 }, ... }
    cpus.forEach(cpu => {
        if (cpu.litografia && cpu.desempenho && cpu.desempenho.multi_core) {
            if (!litographyData[cpu.litografia]) {
                litographyData[cpu.litografia] = { totalMultiCore: 0, count: 0 };
            }
            litographyData[cpu.litografia].totalMultiCore += cpu.desempenho.multi_core;
            litographyData[cpu.litografia].count++;
        }
    });

    const labels = Object.keys(litographyData).sort((a, b) => {
        // Sort by nanometer value (e.g., "28 nm" should come before "14 nm")
        return parseFloat(a) - parseFloat(b);
    });
    const data = labels.map(lit => litographyData[lit].totalMultiCore / litographyData[lit].count);

    // Dynamic colors based on manufacturer if "Todas" is selected, otherwise a single color
    const backgroundColors = labels.map(lit => {
        if (selectedFabricante === 'Todas') {
            // Find a CPU with this lithography to determine its manufacturer for coloring
            const cpuWithLit = cpus.find(cpu => cpu.litografia === lit);
            return cpuWithLit ? getBarColors(cpuWithLit, selectedFabricante) : 'rgba(153, 102, 255, 0.7)';
        }
        return 'rgba(153, 102, 255, 0.7)'; // Default for single manufacturer
    });
    const borderColors = labels.map(lit => {
        if (selectedFabricante === 'Todas') {
            const cpuWithLit = cpus.find(cpu => cpu.litografia === lit);
            return cpuWithLit ? getBorderColors(cpuWithLit, selectedFabricante) : 'rgba(153, 102, 255, 1)';
        }
        return 'rgba(153, 102, 255, 1)';
    });


    const ctx = document.getElementById('litographyChart').getContext('2d');
    litographyChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [{
                label: 'Multi Core Médio',
                data: data,
                backgroundColor: backgroundColors,
                borderColor: borderColors,
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
    document.getElementById('litography-cpu-count').textContent = `${Object.values(litographyData).reduce((sum, item) => sum + item.count, 0)} processadores exibidos`;
}

function drawPriceChart(cpus, selectedFabricante) {
    if (priceChart) priceChart.destroy();

    const pricesByYear = {}; // { "2017": { total: 0, count: 0 }, ... }
    cpus.forEach(cpu => {
        if (cpu.data_lancamento && cpu.preco_lancamento) {
            const year = cpu.data_lancamento.split('/')[1]; // Assuming MM/YYYY format
            const price = parseFloat(cpu.preco_lancamento);
            if (!isNaN(price)) {
                if (!pricesByYear[year]) {
                    pricesByYear[year] = { total: 0, count: 0 };
                }
                pricesByYear[year].total += price;
                pricesByYear[year].count++;
            }
        }
    });

    const labels = Object.keys(pricesByYear).sort();
    const data = labels.map(year => pricesByYear[year].total / pricesByYear[year].count);

    // For price chart, a general color is usually fine as it's aggregated by year, not individual CPU
    const backgroundColors = labels.map(() => 'rgba(255, 206, 86, 0.7)');
    const borderColors = labels.map(() => 'rgba(255, 206, 86, 1)');

    const ctx = document.getElementById('priceChart').getContext('2d');
    priceChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [{
                label: 'Preço Médio de Lançamento',
                data: data,
                backgroundColor: backgroundColors,
                borderColor: borderColors,
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
    document.getElementById('price-cpu-count').textContent = `${Object.values(pricesByYear).reduce((sum, item) => sum + item.count, 0)} processadores exibidos`;
}

function drawPerfPriceChart(cpus, selectedFabricante) {
    if (perfPriceChart) perfPriceChart.destroy();

    const validCpus = cpus.filter(cpu =>
        cpu.desempenho && cpu.desempenho.multi_core && cpu.preco_lancamento
    );

    // Calculate performance per price
    const perfPriceData = validCpus.map(cpu => ({
        name: cpu.nome,
        value: cpu.desempenho.multi_core / parseFloat(cpu.preco_lancamento),
        fabricante: cpu.fabricante
    })).sort((a, b) => a.value - b.value); // Sort for ascending view

    const labels = perfPriceData.map(item => item.name);
    const data = perfPriceData.map(item => item.value);
    const backgroundColors = perfPriceData.map(item => getBarColors({ fabricante: item.fabricante }, selectedFabricante));
    const borderColors = perfPriceData.map(item => getBorderColors({ fabricante: item.fabricante }, selectedFabricante));

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
    if (perfPriceData.length > 0) {
        const bestCPU = perfPriceData[perfPriceData.length - 1]; // Last one due to ascending sort
        const worstCPU = perfPriceData[0]; // First one

        comment += `Melhor custo-benefício: ${bestCPU.name} (${bestCPU.value.toFixed(2)})`;
        comment += `<br>Pior custo-benefício: ${worstCPU.name} (${worstCPU.value.toFixed(2)})`;
    } else {
        comment = 'Não há dados suficientes para determinar custo-benefício.';
    }
    document.getElementById('perf-price-comment').innerHTML = comment;
    document.getElementById('perf-price-cpu-count').textContent = `${perfPriceData.length} processadores exibidos`;
}