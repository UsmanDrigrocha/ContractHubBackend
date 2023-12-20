const express = require('express');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });require('./config/dbConnect');
const userRoutes = require('./routes/userRoutes');
const cors = require('cors');
const swaggerUi=require('swagger-ui-express')



const app = express();
const port = process.env.PORT || 3000;

app.use(express.json());
app.use('/api/user/', userRoutes);
app.use(cors());



app.listen(port, () => {
    console.log(`Server running on http://localhost:${port}`);
});

app.get('/', (req, res) => {
    res.json({ Message: "ContractHub Server Working Properly" })
});

// Swagger
const swaggerDocument = require('./swagger/swagger-output.json')
app.use('/api-docs',swaggerUi.serve,swaggerUi.setup(swaggerDocument));