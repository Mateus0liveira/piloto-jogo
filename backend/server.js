// server.js (VERSÃO ATUALIZADA PARA POSTGRESQL)

const express = require('express');
// const sqlite3 = require('sqlite3').verbose(); // Remova esta linha
const { Pool } = require('pg'); // Adicione esta linha para o PostgreSQL
const cors = require('cors');
const bcrypt = require('bcrypt');

const app = express();
app.use(cors());
app.use(express.json());
const port = process.env.PORT || 3000;
const saltRounds = 10;

// Configuração da conexão com o PostgreSQL
// Use a variável de ambiente DATABASE_URL na Render
// ou a sua connection string diretamente para testes locais.
// É altamente recomendável usar variáveis de ambiente para a connection string!
const connectionString = process.env.DATABASE_URL || "postgresql://neondb_owner:npg_YEtVb3eI5RAK@ep-yellow-dawn-a8k4xiu6-pooler.eastus2.azure.neon.tech/neondb?sslmode=require"; 
//

const pool = new Pool({
    connectionString: connectionString,
    ssl: {
        rejectUnauthorized: false // Necessário para alguns serviços como Neon sem certificado CA local
    }
});

// Conectar ao banco de dados e criar tabelas
pool.connect()
    .then(client => {
        console.log("Conectado ao banco de dados PostgreSQL.");
        return client.query(`
            CREATE TABLE IF NOT EXISTS users (
                id SERIAL PRIMARY KEY,
                username TEXT UNIQUE NOT NULL,
                password TEXT NOT NULL
            );

            CREATE TABLE IF NOT EXISTS user_access (
                id SERIAL PRIMARY KEY,
                user_id INTEGER REFERENCES users (id) ON DELETE CASCADE,
                category TEXT NOT NULL,
                has_access BOOLEAN DEFAULT FALSE
            );
        `)
        .then(() => {
            client.release(); // Libera o cliente de volta para o pool
            console.log("Tabelas PostgreSQL verificadas/criadas.");
        })
        .catch(err => {
            client.release();
            console.error("Erro ao criar tabelas PostgreSQL:", err.message);
            process.exit(1);
        });
    })
    .catch(err => {
        console.error("Erro FATAL ao conectar ao banco de dados PostgreSQL:", err.message);
        process.exit(1);
    });

// =================================================================
// =================== ROTAS DA API ================================
// =================================================================

// ROTA DE REGISTRO
app.post('/api/register', async (req, res) => {
    const { username, password } = req.body;
    if (!username || !password) {
        return res.status(400).json({ "error": "Nome de usuário e senha são obrigatórios." });
    }
    try {
        const hashedPassword = await bcrypt.hash(password, saltRounds);
        // Usando pool.query para PostgreSQL com placeholders $1, $2
        const userInsertQuery = 'INSERT INTO users (username, password) VALUES ($1, $2) RETURNING id';
        const userResult = await pool.query(userInsertQuery, [username, hashedPassword]);
        const newUserId = userResult.rows[0].id;

        const categories = ['conexao', 'amigos', 'hot', 'picante'];
        const accessInsertQuery = 'INSERT INTO user_access (user_id, category, has_access) VALUES ($1, $2, $3)';
        
        // Inserir acessos para cada categoria. Usando Promise.all para executar em paralelo.
        await Promise.all(categories.map(category => {
            return pool.query(accessInsertQuery, [newUserId, category, false]); // 'false' para has_access BOOLEAN
        }));
        
        res.json({ "message": "Usuário criado com sucesso!", "userId": newUserId });

    } catch (error) {
        // Erro de duplicidade de usuário no PostgreSQL tem código '23505'
        if (error.code === '23505') { 
            return res.status(400).json({ "error": "Este nome de usuário já existe." });
        }
        console.error("Erro no registro:", error);
        res.status(500).json({ "error": "Erro no servidor ao registrar usuário." });
    }
});

// ROTA DE LOGIN
app.post('/api/login', async (req, res) => {
    const { username, password } = req.body;
    if (!username || !password) {
        return res.status(400).json({ "error": "Nome de usuário e senha são obrigatórios." });
    }
    try {
        // Usando pool.query para PostgreSQL
        const sql = 'SELECT * FROM users WHERE username = $1';
        const result = await pool.query(sql, [username]);
        const user = result.rows[0]; // PostgreSQL retorna rows

        if (!user) {
            return res.status(400).json({ "error": "Usuário ou senha inválidos." });
        }
        const match = await bcrypt.compare(password, user.password);
        if (match) {
            res.json({ "message": "Login bem-sucedido!", "username": user.username });
        } else {
            res.status(400).json({ "error": "Usuário ou senha inválidos." });
        }
    } catch (error) {
        console.error("Erro no login:", error);
        res.status(500).json({ "error": "Erro no servidor ao fazer login." });
    }
});

// ROTA PARA BUSCAR PERMISSÕES
app.get('/api/access/:username', async (req, res) => {
    const username = req.params.username;
    try {
        const sql = `
            SELECT ua.category, ua.has_access 
            FROM users u
            JOIN user_access ua ON u.id = ua.user_id 
            WHERE u.username = $1`; // Placeholder $1 para PostgreSQL
        const result = await pool.query(sql, [username]);
        const rows = result.rows; // PostgreSQL retorna rows

        if (rows.length === 0) {
            return res.status(404).json({ "error": "Usuário não encontrado ou sem permissões." });
        }
        const accessObject = {};
        rows.forEach(row => {
            accessObject[row.category] = !!row.has_access; // Garantir boolean
        });
        res.json(accessObject);
    } catch (error) {
        console.error("Erro ao buscar permissões:", error);
        res.status(500).json({ "error": "Erro no servidor ao buscar permissões." });
    }
});


// =================================================================
// =================== INICIAR O SERVIDOR ==========================
// =================================================================

app.listen(port, () => {
    console.log(`Servidor rodando na porta ${port}`);
});