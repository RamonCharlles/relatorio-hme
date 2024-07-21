// script.js

document.addEventListener('DOMContentLoaded', function() {
    const statusSelect = document.getElementById('status');
    const faultDetails = document.getElementById('faultDetails');
    const tagSelect = document.getElementById('tag');
    const faultTypeSelect = document.getElementById('faultType');
    const customFaultTypeInput = document.getElementById('customFaultType');
    const customFaultTypeLabel = document.getElementById('customFaultTypeLabel');
    const exportButton = document.getElementById('exportButton');
    const pdfButton = document.getElementById('pdfButton');

    const equipmentTags = {
        'Carregadeiras LHD': ['CG01', 'CG03', 'CG04'],
        'Jumbos S2': ['JB01', 'JB02', 'JB04', 'JB05'],
        'Simbas S7': ['SB01', 'SB02', 'SB03', 'SB04']
    };

    const fleetStatus = {
        'Carregadeiras LHD': { PARADO: { count: 0, totalHours: 0 }, OBSERVAÇÃO: { count: 0, totalHours: 0 }, LIBERADO: { count: 0, totalHours: 0 } },
        'Jumbos S2': { PARADO: { count: 0, totalHours: 0 }, OBSERVAÇÃO: { count: 0, totalHours: 0 }, LIBERADO: { count: 0, totalHours: 0 } },
        'Simbas S7': { PARADO: { count: 0, totalHours: 0 }, OBSERVAÇÃO: { count: 0, totalHours: 0 }, LIBERADO: { count: 0, totalHours: 0 } }
    };

    const records = [];

    function populateTagOptions() {
        tagSelect.innerHTML = '<option value="">Selecione a Tag</option>';
        for (const [fleet, tags] of Object.entries(equipmentTags)) {
            tags.forEach(tag => {
                const option = document.createElement('option');
                option.value = `${fleet} - ${tag}`;
                option.textContent = `${fleet} - ${tag}`;
                tagSelect.appendChild(option);
            });
        }
    }

    function initializeForm() {
        tagSelect.value = '';
        statusSelect.value = '';
        faultTypeSelect.value = '';
        document.getElementById('faultDescription').value = '';
        document.getElementById('mechanic').value = '';
        document.getElementById('serviceDescription').value = '';
        document.getElementById('startDate').value = '';
        document.getElementById('endDate').value = '';

        faultDetails.style.display = 'none';
        customFaultTypeInput.style.display = 'none';
        customFaultTypeLabel.style.display = 'none';
    }

    populateTagOptions();
    initializeForm();

    statusSelect.addEventListener('change', function() {
        faultDetails.style.display = (this.value === 'PARADO' || this.value === 'OBSERVAÇÃO') ? 'block' : 'none';
    });

    faultTypeSelect.addEventListener('change', function() {
        if (this.value === 'OUTRO') {
            customFaultTypeInput.style.display = 'block';
            customFaultTypeLabel.style.display = 'block';
        } else {
            customFaultTypeInput.style.display = 'none';
            customFaultTypeLabel.style.display = 'none';
        }
    });

    document.getElementById('statusForm').addEventListener('submit', function(e) {
        e.preventDefault();

        const tag = tagSelect.value;
        const status = statusSelect.value;
        const faultType = faultTypeSelect.value;
        const faultDescription = document.getElementById('faultDescription').value;
        const mechanic = document.getElementById('mechanic').value;
        const serviceDescription = document.getElementById('serviceDescription').value;
        const startDateInput = document.getElementById('startDate').value;
        const endDateInput = document.getElementById('endDate').value;

        if (!tag || !status || !startDateInput || !endDateInput || (status === 'PARADO' || status === 'OBSERVAÇÃO' && !faultType)) {
            alert('Por favor, preencha todos os campos obrigatórios.');
            return;
        }

        const startDate = new Date(startDateInput);
        const endDate = new Date(endDateInput);

        if (endDate < startDate) {
            alert('A data e hora de término não podem ser anteriores à data e hora de início.');
            return;
        }

        const duration = (endDate - startDate) / (1000 * 60 * 60);

        if (duration < 0) {
            alert('A duração calculada é negativa. Verifique as datas e horas.');
            return;
        }

        // Verificar sobreposição de horas
        const existingRecord = records.find(record =>
            record.tag === tag &&
            record.status === status &&
            ((startDate < new Date(record.endDate) && endDate > new Date(record.startDate)) || 
             (startDate < new Date(record.startDate) && endDate > new Date(record.startDate)))
        );

        if (existingRecord) {
            alert('Há um registro sobreposto para este equipamento e status.');
            return;
        }

        records.push({
            tag,
            status,
            faultType: faultType === 'OUTRO' ? customFaultTypeInput.value : faultType,
            faultDescription,
            mechanic,
            serviceDescription,
            startDate: startDate.toISOString(),
            endDate: endDate.toISOString(),
            duration
        });

        // Adiciona dados à tabela
        const tbody = document.querySelector('#statusTable tbody');
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${tag.split(' - ')[0]}</td>
            <td>${tag.split(' - ')[1]}</td>
            <td>${status}</td>
            <td>${mechanic}</td>
            <td>${serviceDescription}</td>
            <td>${faultType === 'OUTRO' ? customFaultTypeInput.value : faultType}</td>
            <td>${startDate.toISOString().slice(0, 19).replace('T', ' ')}</td>
            <td>${endDate.toISOString().slice(0, 19).replace('T', ' ')}</td>
            <td>${duration.toFixed(2)}</td>
        `;
        tbody.appendChild(row);

        // Atualiza status da frota
        const fleet = tag.split(' - ')[0];
        if (fleetStatus[fleet]) {
            fleetStatus[fleet][status].count += 1;
            fleetStatus[fleet][status].totalHours += duration;
        }

        // Atualiza o gráfico
        updateChart();

        // Limpa o formulário
        initializeForm();
    });

    function updateChart() {
        const ctx = document.getElementById('statusChart').getContext('2d');
        const labels = Object.keys(fleetStatus);
        const data = {
            labels: labels,
            datasets: [
                {
                    label: 'Parado',
                    data: labels.map(fleet => fleetStatus[fleet].PARADO.totalHours),
                    backgroundColor: 'rgba(255, 99, 132, 0.2)',
                    borderColor: 'rgba(255, 99, 132, 1)',
                    borderWidth: 1
                },
                {
                    label: 'Observação',
                    data: labels.map(fleet => fleetStatus[fleet].OBSERVAÇÃO.totalHours),
                    backgroundColor: 'rgba(54, 162, 235, 0.2)',
                    borderColor: 'rgba(54, 162, 235, 1)',
                    borderWidth: 1
                },
                {
                    label: 'Liberado',
                    data: labels.map(fleet => fleetStatus[fleet].LIBERADO.totalHours),
                    backgroundColor: 'rgba(75, 192, 192, 0.2)',
                    borderColor: 'rgba(75, 192, 192, 1)',
                    borderWidth: 1
                }
            ]
        };

        // Remove o gráfico antigo, se houver
        const oldChart = Chart.getChart(ctx);
        if (oldChart) {
            oldChart.destroy();
        }

        new Chart(ctx, {
            type: 'bar',
            data: data,
            options: {
                responsive: true,
                scales: {
                    x: {
                        stacked: true
                    },
                    y: {
                        stacked: true,
                        beginAtZero: true
                    }
                }
            }
        });
    }

    exportButton.addEventListener('click', function() {
        const csvRows = [];
        const headers = ['Frota', 'Tag', 'Status', 'Mecânico', 'Descrição do Serviço', 'Natureza da Falha', 'Data e Hora de Início', 'Data e Hora de Fim', 'Duração (Horas)'];
        csvRows.push(headers.join(','));

        records.forEach(record => {
            const row = [
                record.tag.split(' - ')[0],
                record.tag.split(' - ')[1],
                record.status,
                record.mechanic,
                record.serviceDescription,
                record.faultType,
                new Date(record.startDate).toISOString().slice(0, 19).replace('T', ' '),
                new Date(record.endDate).toISOString().slice(0, 19).replace('T', ' '),
                record.duration.toFixed(2)
            ].join(',');
            csvRows.push(row);
        });

        const csvString = csvRows.join('\n');
        const csvBlob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
        const csvUrl = URL.createObjectURL(csvBlob);
        const link = document.createElement('a');
        link.href = csvUrl;
        link.setAttribute('download', 'relatorio_equipamentos.csv');
        link.click();
    });

    pdfButton.addEventListener('click', function() {
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF();

        doc.text('Relatório de Equipamentos', 10, 10);

        const headers = ['Frota', 'Tag', 'Status', 'Mecânico', 'Descrição do Serviço', 'Natureza da Falha', 'Data e Hora de Início', 'Data e Hora de Fim', 'Duração (Horas)'];
        const rows = records.map(record => [
            record.tag.split(' - ')[0],
            record.tag.split(' - ')[1],
            record.status,
            record.mechanic,
            record.serviceDescription,
            record.faultType,
            new Date(record.startDate).toISOString().slice(0, 19).replace('', ' '),
            new Date(record.endDate).toISOString().slice(0, 19).replace('', ' '),
            record.duration.toFixed(2)
        ]);

        doc.autoTable({
            head: [headers],
            body: rows,
            startY: 20,
            theme: 'grid',
            margin: { top: 20 },
            styles: { fontSize: 10 },
        });

        doc.save('relatorio_equipamentos.pdf');
    });

    // Inicializa o gráfico
    updateChart();
});
