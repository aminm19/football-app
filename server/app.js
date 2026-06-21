const express = require('express');
const app = express();
const matchesRouter = require('./routes/matches');
const standingsRouter = require('./routes/standings');
const cors = require('cors');
const teamsRouter = require('./routes/teams');
const rateLimit = require('express-rate-limit');

const apiLimiter = rateLimit({
  // since we have no auth set up for use accounts, we'll limit by IP
  windowMs: 60 * 1000, // 1 minute
  max: 100,            // max requests per IP per window
  standardHeaders: true,  // send RateLimit-* headers so clients can see their limit
  legacyHeaders: false,   // disable the old X-RateLimit-* headers
  message: { error: 'Too many requests, please try again later.' },
});

// TODO: enable at deploy — makes Express read the real client IP from
// X-Forwarded-For instead of the hosting proxy's IP, so rate limiting keys
// on actual visitors. Without it, all traffic looks like one IP (the proxy).
// app.set('trust proxy', 1);

app.use(cors());
app.use('/api', apiLimiter);
app.use('/api/teams', teamsRouter);
app.use('/api/standings', standingsRouter);
app.use('/api/matches', matchesRouter);

app.get('/api/config', (req, res) => {
  res.json({ standingsEnabled: process.env.STANDINGS_ENABLED === 'true' });
});

app.get('/', (req, res) => res.send('server is alive'));

app.listen(3000, () => console.log('server on port 3000'));