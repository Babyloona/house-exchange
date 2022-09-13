const express = require("express")
const app = express()
const mongoose = require("mongoose")
const bodyParser=require("body-parser")
const multer = require('multer')

const passport = require("passport")
const passportLocalMongoose = require("passport-local-mongoose")
const session = require("express-session")
const findOrCreate = require('mongoose-findorcreate')



app.use(bodyParser.urlencoded({extended:true}))



app.use(express.static("public"))
app.set("view engine", "ejs")




//mongo conncetction

mongoose.connect("mongodb://127.0.0.1:27017/project")

const userSchema = mongoose.Schema({
  email: String,
  password: String,
  role: {
    type: String,
    default: 'User'
  }
})



userSchema.plugin(passportLocalMongoose)
userSchema.plugin(findOrCreate)
const User = mongoose.model("User", userSchema)


passport.use(User.createStrategy());

passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());


const GoogleStrategy = require('passport-google-oauth20').Strategy
const GOOGLE_CLIENT_ID = '137339416212-84i3uon4req12amk4lhrokr95g40ob6o.apps.googleusercontent.com'
const GOOGLE_CLIENT_SECRET = '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'


passport.use(new GoogleStrategy({
        clientID: GOOGLE_CLIENT_ID,
        clientSecret: GOOGLE_CLIENT_SECRET,
        callbackURL: "http://localhost:5000/google/callback"
    },
    function(accessToken, refreshToken, profile, cb) {
        User.findOrCreate({ googleId: profile.id }, function (err, user) {
            return cb(err, user);
        });
    }
));
// _______________________________________________________________


//express session
app.use(session({
  secret: 'keyboard cat',
  resave: false,
  saveUninitialized: false
}))


// passport
app.use(passport.initialize())
app.use(passport.session())

// for file and picture by tutorual
const storage = multer.diskStorage({//Для настройки сохранения файлов
  destination: function(req, file, callback){//для место хранения
    callback(null, './public/uploads')
  },
  filename: function(req, file, callback) {//определяет имя для загруженных файлов
    callback(null, file.originalname)
  },
})
const upload = multer({
  storage: storage,
})
//-----
const homeSchema = new mongoose.Schema({
  city:{
      type:String
},
  conditions:String,
  day:{
      type:String
    },
  myFile:{
      type:String,
  },
  author:{
    type:String
  },
  location:{
    type:String
  },
  time:{
    type: String,
  },
  clock:{
    type: String,
  }
})
const commentSchema = new mongoose.Schema({
  teg:String,
  comments:String,
  avtor:String

})
const Comment = mongoose.model('Com', commentSchema)//модель на основе схемы
const House = mongoose.model('house', homeSchema)//модель на основе схемы
//_________________________________________________________________________________
app.get('/',(async(req, res) => {
  if(req.isAuthenticated()){
    let user= req.user.username
    let home = await House.find({})
    res.render('index', {req: req,user:user,home:home})
  }else{
      let home = await House.find({})
    res.render('index', {req: req,home:home})
  }

}))
app.post('/',(async(req, res) => {
  let home = await House.find({city: req.body.city, day: req.body.day, time: req.body.time})
    res.render('index', {req: req,home:home})
}))
app.get('/signIN',((req, res) => {

      res.render('signIN')
  }))
app.get('/account',((req, res) => {

    res.render('account')
}))
app.get('/about',((req, res) => {
  if(req.isAuthenticated()){
  let user= req.user.username
res.render('about', {req: req,user:user})
}else{
res.render('about', {req: req})
}

}))
app.get('/home',(async(req, res) => {
  if(req.isAuthenticated()){
    let user= req.user.username
    let home = await House.find({author:user})
res.render('home', {req: req,user:user,home:home})
}else{
    res.redirect("/signIN")
}

}))
app.get("/registr",((req, res) => {

    res.render("registration", {req: req})

}))
app.get('/saved',((req, res) => {
  if(req.isAuthenticated()){
    let user= req.user.username
res.render('saved', {req: req,user:user})
}else{
    res.redirect("/signIN")
}
}))
app.post('/addcomments/:_id',(async(req,res)=>{
  let id=req.params._id
  let home = await House.find({})
  let user=req.user.username
  const com = new Comment ({
    teg:id,
    comments:req.body.comments,
    avtor:user
  })
  com.save()
  res.redirect("/")
}))
app.get('/addhome',((req, res) => {
  if(req.isAuthenticated()){
    let user= req.user.username
    res.render("addHome",{user:user,req:req})
  }else{
    res.redirect("/signIN")
  }

}))

//__________________________________________________

app.post("/addhome/:username", upload.single('myFile') ,(req,res) => { // upload.single() для загрузки\сохранения файла
     let user=req.params.username
      const d = new Date();
       const home = new House({
        city: req.body.city,
        conditions: req.body.conditions,
        day:req.body.day,
        myFile: req.file.filename ,
        author:user,
    location:req.body.location,
      time: d.toLocaleString('en-US', {day:'numeric', month: 'numeric', year: 'numeric'}),
      clock:d.toLocaleString('en-US',{hour: 'numeric', second: 'numeric', minute: 'numeric', hour12: true})
    })
    home.save();
    res.redirect("/home")

})
// __________________________________________________


app.post('/:actoin/:_id', async function(req,res){
   let homeid = req.params._id
    let button=req.body.button
    console.log(button);
    if (button=="delete"){
     await House.deleteOne({_id:  homeid})
        res.redirect("/home")
    }
  else if (button=="edit"){
  let home= await House.findOne({_id: homeid})
        res.render("edit",{home:home})
    }

})
app.post('/update/:_id/oe', upload.single('myFile'),(async (req,res) => {


    let homeid = req.params._id
    let user= req.user.username
    let d=new Date()
    if(req.body.button=="edit"){
       await House.updateOne({ _id: homeid }, {$set:{
         city: req.body.city,
         conditions: req.body.conditions,
         day:req.body.day,
         myFile: req.file.filename ,
         author:user,
     location:req.body.location,
       time: d.toLocaleString('en-US', {day:'numeric', month: 'numeric', year: 'numeric'}),
       clock:d.toLocaleString('en-US',{hour: 'numeric', second: 'numeric', minute: 'numeric', hour12: true})
    }})
    }
    res.redirect('/home')
}))
app.get('/read/:_id/:_city', async function(req, res) {
  if(req.isAuthenticated()){
    let user= req.user.username
    let comments = await Comment.find({})
    let u = req.params._id
    let home = await House.findOne({_id:u})
    res.render("readHome", {home:home,user:user,req:req})
  }else{
    res.redirect("/home")
  }
})
app.post("/read/:_id",upload.single('myFile'),(async(req,res)=>{
  if(req.isAuthenticated()){
    let user= req.user.username
    let id=req.params._id
    let home = await House.find({_id:id})
    let comments = await Comment.find({})
    res.render('read', {req: req,user:user,home:home,comments:comments})
}else{

  let id=req.params._id
  let home = await House.find({_id:id})
  let comments = await Comment.find({})
  res.render('read', {req: req,home:home,comments:comments})
}
}))

app.route("/registr")
.get(function(req, res){
      res.render("registration")
  })

.post(function(req, res) {
  User.register({
    username: req.body.username,
    email: req.body.username
  }, req.body.password, function(err, user) {
    if (err) {
      console.log(err)
      res.redirect("/registr")
    } else {
      passport.authenticate("local")(req, res, function() {
        res.redirect("/")
      })
    }
  })
})
//_____________________________________________________

app.route("/signIN")
  .get(function(req, res) {

    res.render("signIN")
  })
  .post(function(req, res) {

    const user = new User({
      username: req.body.username,
      password: req.body.password
    })

    req.login(user, function(err) {
      if (err) {
        console.log(err);
        res.redirect("/signIN")

        console.log(err)
      } else {
        passport.authenticate("local")(req, res, function() {
          res.redirect("/")
        })
      }
    })
  })
// ____________________________________________________________

app.get('/logout', function(req, res, next) {
  req.logout(function(err) {
    if (err) { return next(err); }
    res.redirect('/');
  });
});

app.listen(5000,()=>{
    console.log(`5000 gotov k robote.GoooodLuck`)
    console.log("//AigerimSuperCode");
})
app.get('/google',
    passport.authenticate('google', { scope: ['profile', 'email'] }));

app.get('/google/callback',
    passport.authenticate('google', { failureRedirect: '/registr' }),
    function(req, res) {
        res.redirect('/');

    });
/*
 * in order to fix errors:
 * 1) add a route '/home' with get method which will send 'home.html' as a response
 * 2) go to the file "index.html" and change <a href="home.html"> to <a href="home.html">
 */
