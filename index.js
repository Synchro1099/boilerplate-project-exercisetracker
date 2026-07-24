const express = require('express')
const app = express()
const cors = require('cors')
const crypto = require('crypto')
require('dotenv').config()

app.use(cors())
app.use(express.static('public'))

// Body parsing middleware to extract form data from POST requests
app.use(express.urlencoded({ extended: true }))
app.use(express.json())

app.get('/', (req, res) => {
  res.sendFile(__dirname + '/views/index.html')
});

// In-memory data structures
const users = [];       // Array to store user objects: { username, _id }
const exercises = [];   // Array to store exercise records: { userId, description, duration, dateObj, dateString }

// 1. POST /api/users -> Create a new user
app.post('/api/users', (req, res) => {
  const username = req.body.username;
  if (!username) {
    return res.json({ error: 'Username is required' });
  }

  // Generate a unique 24-character hex ID (mimics MongoDB ObjectId)
  const _id = crypto.randomBytes(12).toString('hex');
  const newUser = { username, _id };

  users.push(newUser);
  res.json(newUser);
});

// 2. GET /api/users -> Retrieve all users
app.get('/api/users', (req, res) => {
  res.json(users);
});

// 3. POST /api/users/:_id/exercises -> Log an exercise for a user
app.post('/api/users/:_id/exercises', (req, res) => {
  const userId = req.params._id;
  const { description, duration, date } = req.body;

  const user = users.find(u => u._id === userId);
  if (!user) {
    return res.json({ error: 'User not found' });
  }

  const durationNum = Number(duration);

  // Handle optional date field
  let exerciseDate;
  if (!date) {
    exerciseDate = new Date();
  } else {
    exerciseDate = new Date(date);
  }

  if (exerciseDate.toString() === 'Invalid Date') {
    exerciseDate = new Date();
  }

  const dateObj = exerciseDate;
  const dateString = dateObj.toDateString();

  // Save exercise record
  exercises.push({
    userId: user._id,
    description: String(description),
    duration: durationNum,
    dateObj: dateObj,
    dateString: dateString
  });

  // Return user object with added exercise details
  res.json({
    username: user.username,
    description: String(description),
    duration: durationNum,
    date: dateString,
    _id: user._id
  });
});

// 4. GET /api/users/:_id/logs -> Retrieve exercise logs with optional filters
app.get('/api/users/:_id/logs', (req, res) => {
  const userId = req.params._id;
  const { from, to, limit } = req.query;

  const user = users.find(u => u._id === userId);
  if (!user) {
    return res.json({ error: 'User not found' });
  }

  let userExercises = exercises.filter(e => e.userId === userId);

  // Filter by 'from' date (yyyy-mm-dd)
  if (from) {
    const fromDate = new Date(from);
    if (fromDate.toString() !== 'Invalid Date') {
      userExercises = userExercises.filter(e => e.dateObj >= fromDate);
    }
  }

  // Filter by 'to' date (yyyy-mm-dd)
  if (to) {
    const toDate = new Date(to);
    if (toDate.toString() !== 'Invalid Date') {
      userExercises = userExercises.filter(e => e.dateObj <= toDate);
    }
  }

  // Apply limit parameter
  if (limit) {
    const limitNum = Number(limit);
    if (!isNaN(limitNum)) {
      userExercises = userExercises.slice(0, limitNum);
    }
  }

  // Map to clean log object structure
  const log = userExercises.map(e => ({
    description: e.description,
    duration: e.duration,
    date: e.dateString
  }));

  res.json({
    username: user.username,
    count: log.length,
    _id: user._id,
    log: log
  });
});

const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port)
}) 