const express = require('express');
const mongoose = require('mongoose');
const livereload = require('livereload');
const connectLiveReload = require('connect-livereload');
const fs = require('fs');
const { check, validationResult } = require('express-validator');
const multer = require('multer');
const methodOverride = require('method-override');
const session = require('express-session');
const MongoStore = require('connect-mongo');
const User = require('./models/users');
const bcrypt = require('bcryptjs');
const path = require('path');
const app = express();
const port = 8080;

// Set up multer for file uploads (if necessary)
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

// Set up live reload
const liveReloadServer = livereload.createServer();
liveReloadServer.watch(path.join(__dirname, 'public'));

app.use(connectLiveReload());
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(methodOverride('_method'));
app.use(express.static(path.join(__dirname, 'public')));
app.use('/css', express.static(path.join(__dirname, 'public/css')));
app.use('/img', express.static(path.join(__dirname, 'public/images')));
app.use('/js', express.static(path.join(__dirname, 'public/js')));

app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

// MongoDB connection
mongoose.connect("mongodb+srv://sela:f6q7PMFCnNplyR2G@cluster0.yeqfq6g.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0", {
    useNewUrlParser: true,
    useUnifiedTopology: true,
})
    .then(() => {
        console.log("MongoDB connected successfully");
    })
    .catch((err) => {
        console.log(err);
    });

// Session configuration
app.use(session({
    secret: 'secret',
    resave: false,
    saveUninitialized: false,
    store: MongoStore.create({ mongoUrl: 'mongodb://localhost:27017/loginDB' }),
    cookie: { maxAge: 1000 * 60 * 60 * 24 } // 1 day
}));

// Routes
app.get('/', (req, res) => {
    res.render('index');
});

app.get('/index.ejs', (req, res) => {
    res.render('index');
});

app.get('/ser.ejs', (req, res) => {
    res.render('ser');
});

app.get('/login.ejs', (req, res) => {
    res.render('login');
});

app.get('/rate.ejs', (req, res) => {
    res.render('rate');
});

app.get('/cont.ejs', (req, res) => {
    res.render('cont');
});

app.get('/sign.ejs', (req, res) => {
    res.render('sign');
});

app.get('/buy.ejs', (req, res) => {
    res.render('buy');
});

app.post('/purchase', (req, res) => {
    const { name, address, product, quantity } = req.body;
    res.send(`Thank you, ${name}! You have purchased ${quantity} unit(s) of ${product}.`);
});

// Handle signup
app.post('/sign', async (req, res) => {
    const { email, password } = req.body;
    try {
        const hashedPassword = await bcrypt.hash(password, 10);
        const user = new User({ email, password: hashedPassword });
        await user.save();
        res.redirect('/login.ejs');
    } catch (err) {
        res.status(500).send('Error creating user');
    }
});

// Handle login
app.post('/login', async (req, res) => {
    const { email, password } = req.body;
    try {
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(400).send('Invalid credentials');
        }
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).send('Invalid credentials');
        }
        req.session.userId = user._id;
        res.redirect('/');
    } catch (err) {
        res.status(500).send('Error logging in');
    }
});

// Start server
app.listen(port, () => {
    console.log(`Server is running at http://localhost:${port}`);
    liveReloadServer.server.once("connection", () => {
        setTimeout(() => {
            liveReloadServer.refresh("/");
        }, 100);
    });
});
