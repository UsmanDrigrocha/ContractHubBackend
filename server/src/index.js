const express = require('express');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });require('./config/dbConnect');
const userRoutes = require('./routes/userRoutes');

const app = express();
const port = process.env.PORT || 3000;

app.use(express.json());
app.use('/api/user/', userRoutes);

app.listen(port, () => {
    console.log(`Server running on http://localhost:${port}`);
});

app.get('/', (req, res) => {
    res.json({ Message: "ContractHub Server Working Properly" })
});

