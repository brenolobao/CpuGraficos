*Análise de Processadores AMD AM4 (2017-2025)*
Este projeto é uma ferramenta interativa em HTML, CSS e JavaScript para visualizar e analisar dados de processadores AMD AM4 lançados entre 2017 e 2025. Ele permite filtrar processadores por contagem de threads e exibe gráficos de desempenho single-core, multi-core, desempenho médio por litografia, preço de lançamento e a relação desempenho/preço.

*Funcionalidades*
-Filtragem por Threads: Selecione o número de threads para visualizar apenas os processadores correspondentes.
-Gráfico de Desempenho Single-Core: Mostra a pontuação de desempenho single-core dos processadores filtrados, ordenados crescentemente. Inclui comentários sobre o maior aumento percentual consecutivo e o aumento do pior para o melhor.
-Gráfico de Desempenho Multi-Core: Exibe a pontuação de desempenho multi-core dos processadores filtrados, também em ordem crescente. Comentários semelhantes aos do gráfico single-core são fornecidos.
-Gráfico de Desempenho por Litografia: Apresenta a média de desempenho single-core e multi-core agrupada por litografia (em nanômetros), permitindo observar a evolução tecnológica.
-Gráfico de Preço de Lançamento: Detalha o preço de lançamento individual de cada processador filtrado, ordenado cronologicamente por ano de lançamento.
-Gráfico de Relação Desempenho/Preço: Calcula e exibe uma relação entre o desempenho (média de single e multi-core) e o preço de lançamento, destacando os processadores com melhor e pior custo-benefício.

*Fontes dos Dados*
-Os dados utilizados neste projeto foram cuidadosamente coletados de fontes confiáveis:
-Informações dos Processadores e Preço de Lançamento: Obtidas no TechPowerUp.
-Informações de Desempenho (Single-Core e Multi-Core): Coletadas no PassMark Software (CPU Benchmarks).
Como Usar
-O deploy deste projeto está disponível no seguinte link: https://brenolobao.github.io/CpuGraficos/

*Estrutura do Projeto*
-index.html: A página principal que contém o HTML, CSS e Javascript
-cpusAmd-2017-2025-am4.json: O arquivo JSON que armazena os dados brutos dos processadores.
-Chart.js: A biblioteca de gráficos JavaScript utilizada, carregada via CDN.
