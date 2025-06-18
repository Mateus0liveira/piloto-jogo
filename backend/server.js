// server.js

const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const cors = require('cors');
const bcrypt = require('bcrypt');

const app = express();
app.use(cors());
app.use(express.json());
const port = 3000;
const saltRounds = 10;

const db = new sqlite3.Database('./data/database.db', (err) => {
    if (err) {
        console.error("Erro ao abrir o banco de dados:", err.message);
    } else {
        console.log("Conectado ao banco de dados SQLite.");
        db.run(`CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT UNIQUE,
            password TEXT
        )`);

        db.run(`CREATE TABLE IF NOT EXISTS user_access (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER,
            category TEXT,
            has_access BOOLEAN,
            FOREIGN KEY (user_id) REFERENCES users (id)
        )`);
    }
});

app.post('/api/register', async (req, res) => {
    const { username, password } = req.body;
    if (!username || !password) {
        return res.status(400).json({ "error": "Nome de usuário e senha são obrigatórios." });
    }
    try {
        const hashedPassword = await bcrypt.hash(password, saltRounds);
        const sql_user = `INSERT INTO users (username, password) VALUES (?, ?)`;
        db.run(sql_user, [username, hashedPassword], function(err) {
            if (err) {
                res.status(400).json({ "error": "Este nome de usuário já existe." });
                return;
            }
            const newUserId = this.lastID;
            const categories = ['conexao', 'amigos', 'hot', 'picante'];
            const sql_access = `INSERT INTO user_access (user_id, category, has_access) VALUES (?, ?, ?)`;
            categories.forEach(category => {
                db.run(sql_access, [newUserId, category, 0]);
            });
            res.json({ "message": "Usuário criado com sucesso!", "userId": newUserId });
        });
    } catch {
        res.status(500).json({ "error": "Erro ao registrar usuário." });
    }
});

app.post('/api/login', (req, res) => {
    const { username, password } = req.body;
    if (!username || !password) {
        return res.status(400).json({ "error": "Nome de usuário e senha são obrigatórios." });
    }
    const sql = `SELECT * FROM users WHERE username = ?`;
    db.get(sql, [username], async (err, user) => {
        if (err) {
            return res.status(500).json({ "error": err.message });
        }
        if (!user) {
            return res.status(400).json({ "error": "Usuário ou senha inválidos." });
        }
        const match = await bcrypt.compare(password, user.password);
        if (match) {
            res.json({ "message": "Login bem-sucedido!", "username": user.username });
        } else {
            res.status(400).json({ "error": "Usuário ou senha inválidos." });
        }
    });
});

app.get('/api/access/:username', (req, res) => {
    const username = req.params.username;
    const sql = `
        SELECT T2.category, T2.has_access 
        FROM users T1 
        JOIN user_access T2 ON T1.id = T2.user_id 
        WHERE T1.username = ?`;
    db.all(sql, [username], (err, rows) => {
        if (err || rows.length === 0) {
            return res.status(404).json({ "error": "Usuário não encontrado ou sem permissões." });
        }
        const accessObject = {};
        rows.forEach(row => {
            accessObject[row.category] = !!row.has_access;
        });
        res.json(accessObject);
    });
});

app.listen(port, () => {
    console.log(`Servidor rodando em http://localhost:${port}`);
});