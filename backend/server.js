
require('dotenv').config();

const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

const { initDatabase, getDatabase, saveDatabase } = require('./database');

const app = express();
const PORT = process.env.PORT || 5000;
const JWT_SECRET = process.env.JWT_SECRET;

app.use(cors());
app.use(express.json());
// Проверка авторизации пользователя
function authenticateToken(req, res, next) {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({
            message: 'Необходима авторизация'
        });
    }

    jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
        if (err) {
            return res.status(403).json({
                message: 'Недействительный токен'
            });
        }

        req.user = user;
        next();
    });
}

// Проверка работы сервера
app.get('/', (req, res) => {
    res.json({
        message: 'CRM-System работает!'
    });
});
app.get('/test-deals', (req, res) => {
    res.send('TEST DEALS ROUTE WORKS');
});

// Авторизация пользователя
app.post('/api/auth/login', (req, res) => {
    try {
        const { login, password } = req.body;

        // Проверяем заполнение полей
        if (!login || !password) {
            return res.status(400).json({
                message: 'Введите логин и пароль'
            });
        }

        const db = getDatabase();

        // Ищем пользователя в базе данных
        const stmt = db.prepare(
            'SELECT * FROM users WHERE login = ?'
        );

        stmt.bind([login]);

        let user = null;

        if (stmt.step()) {
            user = stmt.getAsObject();
        }

        stmt.free();

        // Проверяем существование пользователя
        if (!user) {
            return res.status(401).json({
                message: 'Неверный логин или пароль'
            });
        }

        // Проверяем пароль
        const passwordIsValid = bcrypt.compareSync(
            password,
            user.password
        );

        if (!passwordIsValid) {
            return res.status(401).json({
                message: 'Неверный логин или пароль'
            });
        }

        // Создаём JWT-токен
        const token = jwt.sign(
            {
                id: user.id,
                login: user.login,
                role: user.role
            },
            JWT_SECRET,
            {
                expiresIn: '8h'
            }
        );

        // Отправляем результат
        res.json({
            message: 'Вход выполнен успешно',
            token: token,
            user: {
                id: user.id,
                name: user.name,
                login: user.login,
                role: user.role
            }
        });

    } catch (error) {
        console.error('Ошибка авторизации:', error);

        res.status(500).json({
            message: 'Ошибка сервера при авторизации'
        });
    }
});

// ===============================
// РАБОТА С КЛИЕНТАМИ
// ===============================

// Получить список всех клиентов
app.get('/api/clients', authenticateToken, (req, res) => {
    try {
        const db = getDatabase();

        const result = db.exec('SELECT * FROM clients ORDER BY id DESC');

        const clients = result.length > 0
            ? result[0].values.map(row => ({
                id: row[0],
                name: row[1],
                phone: row[2],
                email: row[3],
                company: row[4]
            }))
            : [];

        res.json(clients);
    } catch (error) {
        res.status(500).json({ message: 'Ошибка получения клиентов' });
    }
});

// Добавить нового клиента
app.post('/api/clients', authenticateToken, (req, res) => {
    try {
        const { name, phone, email, company } = req.body;

        if (!name || !name.trim()) {
            return res.status(400).json({
                message: 'Имя клиента обязательно'
            });
        }

        const db = getDatabase();

        const stmt = db.prepare(
            'INSERT INTO clients (name, phone, email, company) VALUES (?, ?, ?, ?)'
        );

        stmt.run([
            name.trim(),
            phone || '',
            email || '',
            company || ''
        ]);

        stmt.free();

        const result = db.exec('SELECT last_insert_rowid()');

        saveDatabase();

        res.status(201).json({
            message: 'Клиент успешно добавлен',
            id: result[0].values[0][0]
        });

    } catch (error) {
        console.error('Ошибка добавления клиента:', error);
        res.status(500).json({
            message: 'Ошибка добавления клиента'
        });
    }
});

// Редактировать клиента
app.put('/api/clients/:id', authenticateToken, (req, res) => {
    try {
        const { name, phone, email, company } = req.body;
        const db = getDatabase();

        if (!name || !name.trim()) {
            return res.status(400).json({
                message: 'Имя клиента обязательно'
            });
        }

        const stmt = db.prepare(`
            UPDATE clients
            SET name = ?, phone = ?, email = ?, company = ?
            WHERE id = ?
        `);

        stmt.run([
            name.trim(),
            phone || '',
            email || '',
            company || '',
            Number(req.params.id)
        ]);

        stmt.free();

saveDatabase();

        res.json({ message: 'Данные клиента обновлены' });
    } catch (error) {
        res.status(500).json({
            message: 'Ошибка редактирования клиента'
        });
    }
});

// Удалить клиента
app.delete('/api/clients/:id', authenticateToken, (req, res) => {
    try {
        const db = getDatabase();

        const stmt = db.prepare(
            'DELETE FROM clients WHERE id = ?'
        );

        stmt.run([Number(req.params.id)]);
        stmt.free();

saveDatabase();

        res.json({ message: 'Клиент удалён' });
    } catch (error) {
        res.status(500).json({
            message: 'Ошибка удаления клиента'
        });
    }
});
// ===============================
// РАБОТА СО СДЕЛКАМИ
// ===============================

// Получить список всех сделок
app.get('/api/deals', authenticateToken, (req, res) => {
    try {
        const db = getDatabase();

        const result = db.exec(`
            SELECT
                deals.id,
                deals.title,
                deals.client_id,
                clients.name AS client_name,
                deals.amount,
                deals.status
            FROM deals
            JOIN clients ON deals.client_id = clients.id
            ORDER BY deals.id DESC
        `);

        const deals = result.length > 0
            ? result[0].values.map(row => ({
                id: row[0],
                title: row[1],
                client_id: row[2],
                client_name: row[3],
                amount: row[4],
                status: row[5]
            }))
            : [];

        res.json(deals);

    } catch (error) {
        console.error('Ошибка получения сделок:', error);
        res.status(500).json({
            message: 'Ошибка получения сделок'
        });
    }
});
// Редактировать сделку
app.put('/api/deals/:id', authenticateToken, (req, res) => {
    try {
        const { title, client_id, amount, status } = req.body;
        const db = getDatabase();

        if (!title || !client_id || amount === undefined || amount < 0) {
            return res.status(400).json({
                message: 'Заполните название, клиента и корректную сумму'
            });
        }

        db.run(
            `UPDATE deals
             SET title = ?, client_id = ?, amount = ?, status = ?
             WHERE id = ?`,
            [title, client_id, amount, status || 'Новая', req.params.id]
        );

        saveDatabase();

        res.json({
            message: 'Сделка успешно обновлена'
        });

    } catch (error) {
        console.error('Ошибка редактирования сделки:', error);
        res.status(500).json({
            message: 'Ошибка редактирования сделки'
        });
    }
});
// Удалить сделку
app.delete('/api/deals/:id', authenticateToken, (req, res) => {
    try {
        const db = getDatabase();

        db.run(
            'DELETE FROM notes WHERE deal_id = ?',
            [req.params.id]
        );

        db.run(
            'DELETE FROM deals WHERE id = ?',
            [req.params.id]
        );

        saveDatabase();

        res.json({
            message: 'Сделка успешно удалена'
        });

    } catch (error) {
        console.error('Ошибка удаления сделки:', error);
        res.status(500).json({
            message: 'Ошибка удаления сделки'
        });
    }
});
// Добавить новую сделку
app.post('/api/deals', authenticateToken, (req, res) => {
    try {
        const { title, client_id, amount, status } = req.body;

        if (!title || !client_id || amount === undefined || amount < 0) {
            return res.status(400).json({
                message: 'Заполните название, клиента и корректную сумму'
            });
        }

        const db = getDatabase();

        db.run(
            `INSERT INTO deals (title, client_id, amount, status)
             VALUES (?, ?, ?, ?)`,
            [title, client_id, amount, status || 'Новая']
        );

        const result = db.exec('SELECT last_insert_rowid()');

        saveDatabase();

        res.status(201).json({
            message: 'Сделка успешно добавлена',
            id: result[0].values[0][0]
        });

    } catch (error) {
        console.error('Ошибка добавления сделки:', error);
        res.status(500).json({
            message: 'Ошибка добавления сделки'
        });
    }
});
// Запуск сервера
async function startServer() {
    try {
        if (!JWT_SECRET) {
            throw new Error('Не задан JWT_SECRET в файле .env');
        }

        await initDatabase();

        const db = getDatabase();
        db.exec('PRAGMA foreign_keys = ON;');

        console.log('Клиенты в базе:', db.exec('SELECT * FROM clients'));

        console.log('База данных подключена!');

        app.listen(PORT, () => {
            console.log(
                `Сервер запущен: http://localhost:${PORT}`
            );
        });

    } catch (error) {
        console.error('Ошибка запуска сервера:', error);
    }
}

startServer();
