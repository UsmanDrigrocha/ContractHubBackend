const express = require('express');
require('dotenv').config();
require('./config/dbConnect');
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

// https://app.contracthub.com/verify/58f8ab40-9d8f-11ee-b0c6-3b16ef419239