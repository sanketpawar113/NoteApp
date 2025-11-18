if (process.env.NODE_ENV !== "production") {
  require("dotenv").config();
}

// requiring package
const express = require("express");
const app = express();
const path = require("path");
const methodOverride = require("method-override");
const mongoose = require("mongoose");
const ejsMate = require("ejs-mate");
const session = require("express-session");
const passport = require("passport");
const LocalStrategy = require("passport-local");
const flash = require("connect-flash");
const MongoStore = require("connect-mongo");

// requiring files
const Note = require("./models/Note.js");
const User = require("./models/User.js");
const isLoggedIn = require("./middlewares/isLoggedIn");
const ExpressError = require("./utils/ExpressError.js")
const wrapAsync = require("./utils/wrapAsync.js");


// EJS
app.engine("ejs", ejsMate);
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));  

// Static
app.use(express.static(path.join(__dirname, "public")));

// Body parser
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// Method override
app.use(methodOverride("_method"));

// MongoDB
const dburl = process.env.MONGO_ATLASDB || "mongodb://127.0.0.1:27017/NOTEAPP";
mongoose.connect(dburl)
  .then(() => console.log("MongoDB Connected"))
  .catch(err => console.log(err));


//storing session
const store = MongoStore.create({
    mongoUrl: process.env.MONGO_ATLASDB,
    crypto: {
        secret: "thisisasecret"
    },
    touchAfter: 24 * 3600 
    
});

store.on("error", function (e) {
    console.log("SESSION STORE ERROR", e);
});

// Session config
app.use(session({
    store,
    secret: process.env.SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: {
        httpOnly: true,
        secure: false,  
        maxAge: 1000 * 60 * 60 * 24 * 7 
    }
}));

// Passport setup
app.use(flash());
app.use(passport.initialize());
app.use(passport.session());

passport.use(new LocalStrategy(User.authenticate()));
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

// Allow req.user in all EJS files
app.use((req, res, next) => {
    res.locals.success = req.flash("success");
    res.locals.error = req.flash("error");
    res.locals.req = req;
    next();
});

//api routs

// index
app.get("/notes", isLoggedIn, async (req, res) => {
  const notes = await Note.find({ owner: req.user._id });
  res.render("note/home", { notes });
});

// new
app.get("/notes/new", isLoggedIn, (req, res) => {
  res.render("note/new");
});

// create
app.post("/notes", isLoggedIn,wrapAsync(async (req, res) => {
  const note = new Note(req.body.note);
  note.owner = req.user._id;
  await note.save();
  res.redirect("/notes");
}));

// show
app.get("/notes/:id", isLoggedIn, wrapAsync(async (req, res) => {
  const note = await Note.findById(req.params.id);
  res.render("note/show", { note });
}));

// edit
app.get("/notes/:id/edit", isLoggedIn, wrapAsync(async (req, res) => {
  const note = await Note.findById(req.params.id);

  if (!note.owner.equals(req.user._id)) {
    return res.send("You don't have permission.");
  }

  res.render("note/edit", { note });
}));

// update
app.put("/notes/:id", isLoggedIn, wrapAsync(async (req, res) => {
  const note = await Note.findById(req.params.id);

  if (!note.owner.equals(req.user._id)) {
    return res.send("Access Denied");
  }

  await Note.findByIdAndUpdate(req.params.id, req.body.note);
  res.redirect("/notes");
}));

// delete
app.delete("/notes/:id", isLoggedIn, wrapAsync(async (req, res) => {
  const note = await Note.findById(req.params.id);

  if (!note.owner.equals(req.user._id)) {
    return res.send("Not allowed");
  }

  await Note.findByIdAndDelete(req.params.id);
  res.redirect("/notes");
}));


//Auth

// signup
app.get("/register", (req, res) => {
  res.render("auth/register");
});

// post signup
app.post("/register", wrapAsync(async(req, res, next) => {
  try {
    const { username, email, password } = req.body;
    const user = new User({ username, email });
    const registeredUser = await User.register(user, password);

    req.login(registeredUser, (err) => {
    if (err) return next(err);
    req.flash("success", "Account created successfully!");
    res.redirect("/notes");
});

  } catch (e) {
    res.send(e.message);
  }
}));

// login form
app.get("/login", (req, res) => {
  res.render("auth/login");
});

// login user
app.post("/login",
  passport.authenticate("local", {
    failureRedirect: "/login",
    failureFlash: true  
  }),
  (req, res) => {
    req.flash("success", "Welcome back, " + req.user.username + "!");
    res.redirect("/notes");
  }
);


// logout
app.get("/logout", (req, res, next) => {
  req.logout(function (err) {
    if (err) {
      req.flash("error", "Logout failed. Try again.");
      return next(err);
    }

    req.flash("success", "Logged out successfully.");
    res.redirect("/login");
  });
});


//error handling
//page not found
app.use((req,res,next)=>{
  next(new ExpressError(404, "Page Not Found!"));
})

app.use((err, req, res, next) => {
  const { status = 500, message = "Something went wrong!" } = err;
  res.status(status).render("note/error", { status, message });
});


//port
const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log("Server running on port", port);
});

