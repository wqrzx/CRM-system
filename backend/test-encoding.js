
const { initDatabase, getDatabase, saveDatabase } = require('./database');

async function test() {
    await initDatabase();

    const db = getDatabase();

    db.run(
        'INSERT INTO clients (name, phone, email, company) VALUES (?, ?, ?, ?)',
        ['Тестовый клиент', '89990000000', 'test@mail.ru', 'Тестовая компания']
    );

    saveDatabase();

    const result = db.exec(
        "SELECT * FROM clients WHERE email = 'test@mail.ru'"
    );

    console.log(result[0].values);
}

test();
