# Análise de Processadores AMD e Intel (2017–2025)

Este projeto é uma ferramenta interativa desenvolvida com **HTML**, **CSS** e **JavaScript** para visualizar e analisar dados de processadores **AMD e Intel** lançados entre **2017 e 2025**.

A aplicação permite **filtrar processadores por contagem de threads** e apresenta diversos **gráficos analíticos**, incluindo desempenho, litografia, preço e custo-benefício.

🔗 **Acesse o projeto online**: [brenolobao.github.io/CpuGraficos](https://brenolobao.github.io/CpuGraficos/)

---

## 🚀 Funcionalidades

- **Filtragem por Threads**
  - Selecione o número de threads para visualizar apenas os processadores correspondentes.

- **Filtragem Fabricante**
  - Selecione entre Amd, Intel ou Todos.

- **Cartões com notas**
  - Cartões que indicam qual a nota de 0 a 10 para desempenho bruto e custo-benefício.
  - Os cartões contem informações como : Nome, Ano de lançamento, Preço de lançamento, Nucloes/Threads.

- **Gráfico de Desempenho Single-Core**
  - Mostra a pontuação de desempenho single-core dos processadores filtrados, em ordem crescente.
  - Inclui comentários sobre:
    - Maior aumento percentual consecutivo.
    - Aumento do pior para o melhor processador.

- **Gráfico de Desempenho Multi-Core**
  - Exibe a pontuação de desempenho multi-core, também ordenada de forma crescente.
  - Comentários semelhantes aos do gráfico single-core.

- **Gráfico de Desempenho por Litografia**
  - Apresenta a média de desempenho **single-core** e **multi-core**, agrupada por litografia (em nm).
  - Permite visualizar a evolução tecnológica ao longo dos anos.

- **Gráfico de Preço de Lançamento**
  - Detalha o preço de lançamento de cada processador filtrado.
  - Ordenado cronologicamente por ano.

- **Gráfico de Relação Desempenho/Preço**
  - Calcula a média entre desempenho single-core e multi-core dividida pelo preço de lançamento.
  - Destaca os processadores com **melhor** e **pior custo-benefício**.

- **Download dos Gráficos**
  - Baixa imagens em png dos gráficos conforme a contagem de threads selecionada.

---

## 📊 Fontes dos Dados

- **Informações dos Processadores e Preço de Lançamento:**  
  [TechPowerUp](https://www.techpowerup.com/cpu-specs/)

- **Desempenho (Single-Core e Multi-Core):**  
  [PassMark Software - CPU Benchmarks](https://www.cpubenchmark.net/)

---

## 📁 Estrutura do Projeto

```text
├── index.html                      # Página principal com HTML, CSS e JS embutidos
├── cpusAmd-2017-2025-am4.json     # Arquivo com dados brutos dos processadores
├── Chart.js (via CDN)             # Biblioteca para renderização dos gráficos
