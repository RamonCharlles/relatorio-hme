document.addEventListener('DOMContentLoaded', function() {
    const form = document.getElementById('statusForm');
    const faultDetails = document.getElementById('faultDetails');
    const statusField = document.getElementById('initialStatus');
    const tableBody = document.querySelector('#dataTable tbody');

    // Recupera dados do localStorage e preenche a tabela
    const savedData = JSON.parse(localStorage.getItem('formData')) || [];
    savedData.forEach(record => {
        addRowToTable(record);
    });

    // Exibe ou oculta os detalhes da falha com base no status
    statusField.addEventListener('change', function() {
        if (statusField.value === 'PARADO') {
            faultDetails.style.display = 'block';
        } else {
            faultDetails.style.display = 'none';
        }
    });

    // Adiciona evento de submissão para salvar dados no localStorage e na tabela
    form.addEventListener('submit', function(event) {
        event.preventDefault();

        const tag = document.getElementById('tag').value;
        const initialStatus = document.getElementById('initialStatus').value;
        const finalStatus = document.getElementById('finalStatus').value;
        const faultType = document.getElementById('faultType').value;
        const faultDescription = document.getElementById('faultDescription').value;
        const startDateTime = new Date(document.getElementById('startDateTime').value);
        const endDateTime = new Date(document.getElementById('endDateTime').value);

        // Valida as datas e horas
        if (endDateTime <= startDateTime) {
            alert('A data e hora de fim devem ser maiores que a data e hora de início.');
            return;
        }

        const duration = Math.max((endDateTime - startDateTime) / (1000 * 60 * 60), 0); // duração em horas

        const record = {
            tag,
            initialStatus,
            finalStatus,
            faultType,
            faultDescription,
            startDateTime: startDateTime.toISOString(),
            endDateTime: endDateTime.toISOString(),
            duration: duration.toFixed(2)
        };

        // Adiciona o registro à tabela
        addRowToTable(record);

        // Armazena os dados no localStorage
        const existingData = JSON.parse(localStorage.getItem('formData')) || [];
        existingData.push(record);
        localStorage.setItem('formData', JSON.stringify(existingData));

        // Limpa os campos após o envio
        form.reset();
        faultDetails.style.display = 'none';
    });

    // Adiciona uma nova linha à tabela
    function addRowToTable(record) {
        const row = tableBody.insertRow();
        row.insertCell(0).textContent = record.tag;
        row.insertCell(1).textContent = record.initialStatus;
        row.insertCell(2).textContent = record.finalStatus;
        row.insertCell(3).textContent = record.faultType;
        row.insertCell(4).textContent = record.faultDescription;
        row.insertCell(5).textContent = new Date(record.startDateTime).toLocaleString();
        row.insertCell(6).textContent = new Date(record.endDateTime).toLocaleString();
        row.insertCell(7).textContent = record.duration;
    }

    // Exporta os dados para PDF
    document.getElementById('exportPDF').addEventListener('click', function() {
        const doc = new jsPDF();
        doc.text('Relatório de Equipamentos HME', 10, 10);

        const table = document.querySelector('table');
        if (table) {
            doc.autoTable({ html: table });
        }

        const now = new Date();
        const hour = now.getHours();
        let shift = '';

        if (hour >= 8 && hour <= 17) {
            shift = 'T1';
        } else if (hour > 17 || hour < 2) {
            shift = 'T2';
        } else {
            shift = 'T3';
        }

        const fileName = `Relatório Turno ${shift} ${now.toISOString().slice(0, 10)} ${now.toTimeString().slice(0, 5)}.pdf`;
        doc.save(fileName);
    });

    // Exporta os dados para CSV
    document.getElementById('exportCSV').addEventListener('click', function() {
        const csvRows = [];
        const headers = ['Tag', 'Status Inicial', 'Status Final', 'Tipo de Falha', 'Descrição', 'Início', 'Fim', 'Duração (Horas)'];
        csvRows.push(headers.join(','));

        document.querySelectorAll('#dataTable tbody tr').forEach(row => {
            const cells = row.querySelectorAll('td');
            const rowValues = Array.from(cells).map(cell => `"${cell.textContent}"`);
            csvRows.push(rowValues.join(','));
        });

        const csvFile = new Blob([csvRows.join('\n')], { type: 'text/csv' });
        const csvUrl = URL.createObjectURL(csvFile);
        const a = document.createElement('a');
        a.href = csvUrl;
        a.download = 'relatorio_equipamentos.csv';
        a.click();
    });
});
