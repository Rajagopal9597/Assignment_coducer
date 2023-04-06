const express = require('express');
const bodyParser = require('body-parser');
const mysql = require('mysql2/promise');
const jwt = require('jsonwebtoken');

const app = express();
const port = process.env.PORT || 3000;

app.use(bodyParser.json());

// MySQL database configuration // you can change the credantials as per your local system
const dbConfig = {
  host: 'localhost',
  user: 'root',
  password: 'Ro0tcwadb@Mar72023$$N3wEnv',
  database: 'assignment'
};


const pool = mysql.createPool(dbConfig);

// JWT middleware to verify token
const verifyToken = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return res.status(401).json({ message: 'Missing Authorization ' });
  }

  const token = authHeader.split(' ')[1];
  jwt.verify(token, 'secret-key', (err, decoded) => {
    if (err) {
      return res.status(401).json({ message: 'Invalid or expired token' });
    }
    req.userId = decoded.userId;
    next();
  });
};

// Signup API
app.post('/signup', async (req, res) => {
  try {
    const { name, email, phone, password } = req.body;

    
    const [rows] = await pool.query('SELECT * FROM users WHERE email = ? OR phone = ?', [email, phone]);
    if (rows.length > 0) {
      return res.status(409).json({ message: 'User already exists with the same email or phone number' });
    }

    
    const result = await pool.query('INSERT INTO users SET ?', { name, email, phone, password });

    // Generate JWT token
    const token = jwt.sign({ userId: result.insertId }, 'secret-key');

    
    res.status(201).json({ message: 'User created successfully', token });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Login API 
app.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    
    const [rows] = await pool.query('SELECT * FROM users WHERE email = ? AND password = ?', [email, password]);
    if (rows.length === 0) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    
    const token = jwt.sign({ userId: rows[0].id }, 'secret-key');

    
    res.status(200).json({ message: 'Login successful', token });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Get all users API 
app.get('/users', verifyToken, async (req, res) => {
  try {
    const [data] = await pool.query('SELECT * FROM users');//id, name, email, phone 
    res.json(data);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Get user by ID API 
app.get('/users/:id', verifyToken, async (req,res) =>{
  try{
    const {id}  = req.params;
    const data = await pool.query('select * FROM users where id=?',id)
    if(data[0].length == 0){
      return res.status(404).json({message:"user not found"})
    }else{
      return res.json(data[0])
    }
    
  }catch (err){
    console.log(err);
    res.status(500).json({ message: 'Internal server error' });
  }
})

// create a user
app.post('/createusers',verifyToken, async (req, res) => {
  try{
    const { name, email, phone, password } = req.body;
    let [data] = await  pool.query('INSERT INTO users (name, email, phone, password) VALUES (?, ?, ?, ?)',
      [name, email, phone, password])
      const user = { name, email, phone, password };
        res.status(200).json({user:user,message:"user created successfully"});
      
  }catch(err){
    console.log(err);
    res.status(500).json({ message: 'Internal server error' });
  }
});
 
// update a user by id
app.put('/updateuser/:id',verifyToken, async (req, res) => {
  try{
    const { id } = req.params;
    const { name, email, phone, password } = req.body;
  let data = await pool.query('UPDATE users SET name = ?, email = ?, phone = ?, password = ? WHERE id = ?',
    [name, email, phone, password, id])
    const user = { id: id, name, email, phone, password };
        res.status(200).json(user);
  }catch(err){
    console.log(err);
    res.status(500).json({ message: 'Internal server error' });
  }
});
    
// DELETE a user by ID
app.delete('/deleteuser/:id',verifyToken, async (req, res) => {
  try{
    const { id } = req.params;
    let data = await pool.query('DELETE FROM users WHERE id = ?', id)
    res.status(200).json({message:"user deleted successfully"});
  }catch(err){
    console.log(err);
    res.status(500).json({ message: 'Internal server error' });
  }
});


app.listen(3000, () => {
  console.log('Server started on port 3000');
});