
const initSqlJs = require('sql.js');
const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');

let db;

const dbPath = path.join(__dirname, 'crm.sqlite');

async function initDatabase() {
    const SQL = await initSqlJs();

    if (fs.existsSync(dbPath)) {
        const file = fs.readFileSync(dbPath);
        db = new SQL.Database(file);
    } else {
        db = new SQL.Database();
    }

    db.run(`
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            login TEXT UNIQUE NOT NULL,
            password TEXT NOT NULL,
            role TEXT NOT NULL
        );

        CREATE TABLE IF NOT EXISTS clients (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            phone TEXT,
            email TEXT,
            company TEXT
        );

        CREATE TABLE IF NOT EXISTS deals (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            title TEXT NOT NULL,
            client_id INTEGER NOT NULL,
            amount REAL NOT NULL,
            status TEXT DEFAULT 'Новая',
            FOREIGN KEY (client_id) REFERENCES clients(id)
        );

        CREATE TABLE IF NOT EXISTS notes (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            deal_id INTEGER NOT NULL,
            text TEXT NOT NULL,
            FOREIGN KEY (deal_id) REFERENCES deals(id)
        );
    `);

    // Создаём администратора, если его ещё нет
    const adminPassword = bcrypt.hashSync('admin123', 10);

    db.run(
        `INSERT OR IGNORE INTO users (name, login, password, role)
         VALUES (?, ?, ?, ?)`,
        ['Администратор', 'admin', adminPassword, 'admin']
    );

    // Создаём менеджера, если его ещё нет
    const managerPassword = bcrypt.hashSync('manager123', 10);

    db.run(
        `INSERT OR IGNORE INTO users (name, login, password, role)
         VALUES (?, ?, ?, ?)`,
        ['Менеджер', 'manager', managerPassword, 'manager']
    );

    saveDatabase();

    console.log('База данных успешно подключена!');
}

function saveDatabase() {
    if (!db) {
        console.log('ОШИБКА: база данных не инициализирована');
        return;
    }

    try {
        const data = db.export();

        fs.writeFileSync(dbPath, Buffer.from(data));

        console.log('База сохранена. Размер:', fs.statSync(dbPath).size);
    } catch (error) {
        console.error('Ошибка сохранения базы:', error);
        throw error;
    }

}

module.exports = {
    initDatabase,
    saveDatabase,
    getDatabase: () => db
};
