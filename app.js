var express = require('express');
var bodyParser = require('body-parser');
var mongoose = require('mongoose');
var expressSanitizer = require('express-sanitizer');
var methodOverride = require('method-override');
var passport = require('passport');
var app = express();
var session = require('express-session');
var port = 3000;
var blog = require('./models/blog');
var User = require('./models/user');

const { check, validationResult } = require('express-validator');
app.set("view engine","ejs");

app.use(express.static('public'));
app.use(bodyParser.urlencoded({extended : true}));

app.set('trust proxy', 1) // trust first proxy
app.use(session({
  secret: 'keyboard cat',
  resave: true,
  saveUninitialized: true,
 // cookie: { secure: true }
}))

require('./config/passport')(passport);
app.use(passport.initialize());
app.use(passport.session());

app.use(expressSanitizer());
app.use(methodOverride("_method"));

app.use((req, res, next) => {
    res.locals.user = req.user;
    next();
});

const options = {
    useNewUrlParser: true,
  };

mongoose.connect('mongodb://127.0.0.1:27017/bloggingApp', options).then(()=>{
    console.log("Connected to mongoDB");
})
.catch((err)=>{
    console.log("Error",err);
    process.exit(1);
});



app.get("/",function(req, res){
    res.redirect("/blogs");
});

app.get("/user/login", function(req, res){
    res.render("login");
});

app.post("/user/login", function(req, res, next){
    passport.authenticate('local',{
        successRedirect: '/',
        failureRedirect: '/user/login',
        failureFlash: true
    })(req, res, next);
});

app.get("/user/register", function(req, res){
    res.render("register");
});

app.post("/user/register",(req, res)=>{

    var name = req.body.name;
    var email = req.body.email;
    var username = req.body.username;
    var password = req.body.password;
    
    var newUser = new User({
        name:name,
        email: email,
        username: username,
        password: password
    });

    newUser.save( (err) => {
        if(err){
            console.log(err);
            return res.render("register");
        }else{
            console.log("Created a User");
            res.redirect("/");
        }
        
    });
    
});

app.get("/blogs",function(req, res){
    blog.find({}, function(err, blogs){
        if(err){
            console.log("An Error Occured");
            console.log(err);
        }
        else{
            res.render("index",{blogs: blogs});
        }
    });
});

app.get("/blogs/new", function(req, res){
    res.render("new");
});

app.post("/blogs",function(req, res){
    req.body.blog.body = req.sanitize(req.body.blog.body);
    blog.create(req.body.blog, function(err, Blog){
        if(err){
            console.log(err);
            res.send("There occurred an Error");
        }else{
            console.log(Blog);
            res.redirect("/");
        }
    });
});

app.get("/blogs/:id", function(req, res){
    var id = req.params.id;
    console.log(id);
    blog.findById(id, function(err, foundblog) {
        if(err){
            console.log("Error Occurred");
            console.log(err);
            res.redirect("/");
        }else{
            res.render("show",{blog: foundblog});
        }
    });
});

app.get("/blogs/:id/edit", function(req, res){
    blog.findById(req.params.id, function(err, foundblog) {
        if(err){
            console.log("Error Occurred");
            console.log(err);
            res.redirect("/");
        }else{
            res.render("edit",{blog: foundblog});
        }
    });
});

app.put("/blogs/:id", function(req, res){
    req.body.blog.body = req.sanitize(req.body.blog.body);
    blog.findByIdAndUpdate(req.params.id, req.body.blog,function(err, updatedBlog){
        if(err){
            console.log("Error", err);
            res.redirect("/");
        }else{
            res.redirect("/blogs/"+req.params.id);
        }
    });
});

app.delete("/blogs/:id", function(req, res){
    blog.findByIdAndRemove(req.params.id, function(err){
        if(err){
            console.log("An error occurred", err);
            res.redirect("/");
        }else{
            res.redirect("/");
        }
    });
});

app.listen(port , function(){
    console.log("The server started on port"+port);
});