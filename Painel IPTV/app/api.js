const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');

const app = express();

// Configuração do CORS
app.use(cors({
    origin: 'http://localhost:3000', // Permitir apenas requisições do frontend
    methods: ['GET', 'POST', 'PUT', 'DELETE']
}));

// Middleware para processar JSON
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Conexão com MongoDB (com autenticação)
mongoose.connect('mongodb://admin:senha123@mongo:27017/clientes_iptv?authSource=admin&directConnection=true', {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    retryWrites: true,
    w: 'majority',
    authMechanism: 'SCRAM-SHA-256' // Forçar mecanismo de autenticação
}).then(() => {
    console.log('✅ Conexão com MongoDB estabelecida com sucesso.');
}).catch((error) => {
    console.error('❌ Erro ao conectar ao MongoDB:', error.message);
    process.exit(1); // Encerra o servidor se a conexão falhar
});

// Schema atualizado
const ClienteSchema = new mongoose.Schema({
    nome: { type: String, required: true },
    login: { type: String, unique: true, required: true },
    senha: { type: String, required: true },
    mac: { type: String, unique: true, required: true },
    key: String,
    tipoApp: String,
    vencimento: { type: Date, required: true },
    status: { type: String, enum: ['ativo', 'inativo', 'Pago'], default: 'ativo' }, // Adiciona 'Pago' ao enum
    contato: String
}, { timestamps: true });

const Cliente = mongoose.models.Cliente || mongoose.model('Cliente', ClienteSchema);

// Criar um novo cliente
app.post('/clientes', async (req, res) => {
    try {
        const { nome, login, senha, mac, key, tipoApp, vencimento, status, contato } = req.body;

        // Validação básica dos campos obrigatórios
        if (!nome || !login || !senha || !mac || !vencimento) {
            return res.status(400).json({ error: 'Todos os campos obrigatórios devem ser preenchidos.' });
        }

        const cliente = new Cliente(req.body);
        await cliente.save(); // Salva no banco de dados
        res.status(201).json({ message: 'Cliente criado com sucesso!', cliente });
    } catch (error) {
        if (error.code === 11000) { // Código de erro para violação de índice único
            return res.status(400).json({ error: 'Login ou MAC já existem no banco de dados.' });
        }
        console.error('Erro ao criar cliente:', error.message);
        res.status(500).json({ error: 'Erro interno ao criar cliente.' });
    }
});

// Listar todos os clientes
app.get('/clientes', async (req, res) => {
    try {
        const clientes = await Cliente.find();
        if (!clientes || clientes.length === 0) {
            return res.status(404).json({ error: 'Nenhum cliente encontrado.' });
        }
        res.json(clientes);
    } catch (error) {
        console.error('Erro ao listar clientes:', error.message);
        res.status(500).json({ error: 'Erro interno ao listar clientes.' });
    }
});

// Buscar cliente por ID
app.get('/clientes/:id', async (req, res) => {
    try {
        const cliente = await Cliente.findById(req.params.id);
        if (!cliente) {
            return res.status(404).json({ error: 'Cliente não encontrado.' });
        }
        res.json(cliente);
    } catch (error) {
        console.error('Erro ao buscar cliente por ID:', error.message);
        res.status(500).json({ error: 'Erro interno ao buscar cliente.' });
    }
});

// Atualizar um cliente
app.put('/clientes/:id', async (req, res) => {
    try {
        const cliente = await Cliente.findByIdAndUpdate(req.params.id, req.body, { new: true });
        if (!cliente) {
            return res.status(404).json({ error: 'Cliente não encontrado.' });
        }
        res.json({ message: 'Cliente atualizado com sucesso!', cliente });
    } catch (error) {
        console.error('Erro ao atualizar cliente:', error.message);
        res.status(500).json({ error: 'Erro interno ao atualizar cliente.' });
    }
});

// Deletar um cliente
app.delete('/clientes/:id', async (req, res) => {
    try {
        const cliente = await Cliente.findByIdAndDelete(req.params.id);
        if (!cliente) {
            return res.status(404).json({ error: 'Cliente não encontrado.' });
        }
        res.json({ message: 'Cliente removido com sucesso!' });
    } catch (error) {
        console.error('Erro ao deletar cliente:', error.message);
        res.status(500).json({ error: 'Erro interno ao deletar cliente.' });
    }
});

// Iniciar o servidor
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`🚀 API rodando na porta ${PORT}`);
});