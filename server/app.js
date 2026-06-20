const express = require('express');
const app = express();
const matchesRouter = require('./routes/matches');
const cors = require('cors');

app.use(cors());
app.use('/api/matches', matchesRouter);

app.get('/', (req, res) => res.send('server is alive'));

app.listen(3000, () => console.log('server on port 3000'));