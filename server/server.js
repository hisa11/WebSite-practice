const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const mysql = require('mysql2/promise');
const dotenv = require('dotenv');
dotenv.config();
const config = require('./config');
const initializeDatabase = require('./init_db');

const app = express();
const PORT = config.port;
const SECRET_KEY = config.secretKey;

app.use(bodyParser.json());
app.use(cors());

const dbConfig = config.dbConfig;

async function connectToDatabase() {
    try {
        const connection = await mysql.createConnection(dbConfig);
        console.log('MySQL connected successfully');
        return connection;
    } catch (error) {
        console.error('MySQL connection error:', error);
        throw error;
    }
}

// サーバー起動時にデータベースを初期化
initializeDatabase();

// サインアップエンドポイント
app.post('/api/auth/signup', async (req, res) => {
    const { username, email, password } = req.body;
    const connection = await connectToDatabase();

    try {
        const [existingUser] = await connection.execute('SELECT * FROM users WHERE username = ?', [username]);
        if (existingUser.length > 0) {
            return res.status(400).json({ success: false, message: 'ユーザー名は既に使用されています。' });
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        await connection.execute('INSERT INTO users (username, email, password) VALUES (?, ?, ?)', [username, email, hashedPassword]);

        res.status(201).json({ success: true, message: 'サインアップ成功！' });
    } catch (error) {
        console.error('Error during signup:', error);
        res.status(500).json({ success: false, message: 'サインアップ中にエラーが発生しました。' });
    } finally {
        await connection.end();
    }
});

// ログインエンドポイント
app.post('/api/auth/login', async (req, res) => {
    const { username, password } = req.body;
    const connection = await connectToDatabase();

    try {
        const [users] = await connection.execute('SELECT * FROM users WHERE username = ?', [username]);
        console.log('Query executed, users found:', users); // ログ追加

        if (users.length === 0) {
            console.log('No user found with username:', username); // ログ追加
            return res.status(400).json({ success: false, message: 'ユーザー名またはパスワードが間違っています。' });
        }

        const user = users[0];
        console.log('User found:', user); // ログ追加

        const isPasswordValid = await bcrypt.compare(password, user.password);
        console.log('Password validation result:', isPasswordValid); // ログ追加

        if (!isPasswordValid) {
            console.log('Invalid password for username:', username); // ログ追加
            return res.status(400).json({ success: false, message: 'ユーザー名またはパスワードが間違っています。' });
        }

        const token = jwt.sign({ userId: user.id }, SECRET_KEY, { expiresIn: '1h' });
        console.log('Token generated:', token); // ログ追加
        res.status(200).json({ success: true, token });
    } catch (error) {
        console.error('Error during login:', error);
        res.status(500).json({ success: false, message: 'ログイン中にエラーが発生しました。' });
    } finally {
        await connection.end();
    }
});

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});