const express = require('express');
const app = express();
const matchesRouter = require('./routes/matches');
const standingsRouter = require('./routes/standings');
const cors = require('cors');
const teamsRouter = require('./routes/teams');

app.use(cors());

app.use('/api/teams', teamsRouter);
app.use('/api/standings', standingsRouter);
app.use('/api/matches', matchesRouter);

app.get('/api/config', (req, res) => {
  res.json({ standingsEnabled: process.env.STANDINGS_ENABLED === 'true' });
});

app.get('/', (req, res) => res.send('server is alive'));

app.listen(3000, () => console.log('server on port 3000'));