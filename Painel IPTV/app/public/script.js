document.addEventListener("DOMContentLoaded", function () {
    const clienteForm = document.getElementById('cliente-form');
    const clientesList = document.getElementById('clientes-list');

    let clientes = [];
    let clienteEditando = null;

    // Exibir mensagem de feedback
    function exibirMensagem(mensagem, tipo = "sucesso") {
        const mensagemDiv = document.getElementById('mensagem');
        mensagemDiv.textContent = mensagem;
        mensagemDiv.className = tipo;
    }

    // Listar clientes
    function listarClientes() {
        clientesList.innerHTML = ''; // Limpa a tabela
        clientes.forEach((cliente) => {
            const tr = document.createElement('tr');
            tr.setAttribute('data-id', cliente._id);
            tr.innerHTML = `
                <td>${cliente.nome}</td>
                <td>${cliente.login}</td>
                <td>${cliente.mac}</td>
                <td>${cliente.key}</td>
                <td>${cliente.tipoApp}</td>
                <td>${new Date(cliente.vencimento).toLocaleDateString('pt-BR')}</td>
                <td>${cliente.status}</td>
                <td>${cliente.contato}</td>
                <td><button class="edit-btn" data-id="${cliente._id}">Editar</button></td>
            `;
            clientesList.appendChild(tr);
        });

        // Reatribuir eventos de clique aos botões "Editar"
        document.querySelectorAll('.edit-btn').forEach(button => {
            button.addEventListener('click', async function () {
                const id = button.getAttribute('data-id');
                try {
                    const cliente = await buscarCliente(id);
                    clienteEditando = cliente; // Define o cliente em edição
                    preencherFormulario(cliente); // Preenche o formulário
                } catch (error) {
                    exibirMensagem(`Erro ao carregar cliente: ${error.message}`, "erro");
                }
            });
        });

        aplicarEstiloVencimento(clientes); // Aplica estilos condicionais
    }

    // Preencher formulário para edição
    function preencherFormulario(cliente) {
        document.getElementById('nome').value = cliente.nome;
        document.getElementById('login').value = cliente.login;
        document.getElementById('senha').value = cliente.senha;
        document.getElementById('mac').value = cliente.mac;
        document.getElementById('key').value = cliente.key;
        document.getElementById('tipoApp').value = cliente.tipoApp;
        document.getElementById('vencimento').valueAsDate = new Date(cliente.vencimento); // Formata a data
        document.getElementById('status').value = cliente.status;
        document.getElementById('contato').value = cliente.contato;

        // Altera o texto do botão de envio para indicar edição
        document.querySelector('button[type="submit"]').textContent = "Salvar Alterações";
    }

    // Buscar cliente pelo ID
    async function buscarCliente(id) {
        try {
            const response = await fetch(`http://localhost:3000/clientes/${id}`);
            if (!response.ok) {
                throw new Error('Erro ao buscar cliente.');
            }
            return await response.json();
        } catch (error) {
            console.error("Erro ao buscar cliente:", error);
            throw error; // Propaga o erro para ser tratado no fluxo principal
        }
    }

    // Enviar cliente para a API
    async function enviarParaAPI(cliente) {
        try {
            const response = await fetch('http://localhost:3000/clientes', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(cliente),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Erro ao salvar cliente.');
            }

            return await response.json();
        } catch (error) {
            console.error("Erro ao enviar dados para a API:", error.message);
            exibirMensagem(`Erro: ${error.message}`, "erro");
        }
    }

    // Atualizar cliente na API
    async function atualizarClienteNaAPI(id, cliente) {
        try {
            const response = await fetch(`http://localhost:3000/clientes/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(cliente),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Erro ao atualizar cliente.');
            }
        } catch (error) {
            console.error("Erro ao enviar dados para a API:", error.message);
            exibirMensagem(`Erro: ${error.message}`, "erro");
        }
    }

    // Manipular envio do formulário
    clienteForm.addEventListener('submit', async function (e) {
        e.preventDefault();

        const cliente = {
            nome: document.getElementById('nome').value,
            login: document.getElementById('login').value,
            senha: document.getElementById('senha').value,
            mac: document.getElementById('mac').value,
            key: document.getElementById('key').value,
            tipoApp: document.getElementById('tipoApp').value,
            vencimento: new Date(document.getElementById('vencimento').value).toISOString(),
            status: document.getElementById('status').value,
            contato: document.getElementById('contato').value,
        };

        if (clienteEditando) {
            // Modo de edição: atualiza o cliente existente
            await atualizarClienteNaAPI(clienteEditando._id, cliente);
            clienteEditando = null; // Reseta o modo de edição
        } else {
            // Modo de criação: adiciona um novo cliente
            const novoCliente = await enviarParaAPI(cliente);
            if (novoCliente) {
                clientes.push(novoCliente); // Adiciona o novo cliente à lista local
            }
        }

        clienteForm.reset();
        document.querySelector('button[type="submit"]').textContent = "Criar Cliente";
        listarClientes(); // Atualiza a tabela
        exibirMensagem("Cliente salvo com sucesso!", "sucesso");
    });

    // Carregar clientes ao inicializar
    async function carregarClientes() {
        try {
            const response = await fetch('http://localhost:3000/clientes');
            if (response.ok) {
                clientes = await response.json();
                listarClientes();
            }
        } catch (error) {
            console.error("Erro ao carregar clientes:", error);
            exibirMensagem("Erro ao carregar clientes. Verifique a conexão com o servidor.", "erro");
        }
    }

    // Aplicar estilos de vencimento
    function aplicarEstiloVencimento(clientes) {
        const hoje = new Date();
        clientes.forEach((cliente) => {
            const vencimento = new Date(cliente.vencimento);
            const diffTime = vencimento - hoje;
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

            const row = document.querySelector(`tr[data-id="${cliente._id}"]`);
            if (diffDays < 0) {
                row.classList.add('vencido'); // Estilo para vencidos
            } else if (diffDays <= 7) {
                row.classList.add('proximo-vencimento'); // Estilo para próximos vencimentos
            }
        });
    }

    // Inicializar o sistema
    carregarClientes();
});