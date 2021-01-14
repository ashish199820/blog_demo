const express = require('express');
const crypto = require('crypto');
const app = express();
const bodyparser = require('body-parser');
const cors = require('cors');
const mongoose = require('mongoose');
const UserModel = require('./models/user');
const Contest = require('./models/contest');
const Blog = require('./models/blog');
const Ques = require('./models/question');
const isAuth = require('./routes/is-auth');
const bcrypt = require('bcryptjs');
const session = require('express-session');
const csrf = require('csurf');
app.use(cors())
app.use(bodyparser.json());
app.use(bodyparser.urlencoded({extended:true}));
// const sendgridTransport = require('nodemailer-sendgrid-transport');
// app.set('view engine', 'ejs');
// app.set('views','views');
const MongoDBStore = require('connect-mongodb-session')(session);
const store = new MongoDBStore({
    uri : 'mongodb://127.0.0.1:27017?retryWrites=true&w=majority',
    collection: 'sessions'
});


app.use(session({secret:'my secret', resave: false, saveUninitialized: false,store: store}))
console.log("I came back up!!");

//////// get all the blogs in the db
app.get('/api/blog',isAuth.authCheck,(req,res,next) => {
  Blog.find().then((data)=>{
      res.send(data);
  }).catch(err=>{                               
     res.send({err:err})
  })
})


///////add new blogs //////
app.post('/api/blog',isAuth.authCheck, (req,res,next) => {
   console.log("My blog");
   const title= req.body.title;
    const desc = req.body.content;
    const date = Date();
    const image = req.body.image;
    const userid = req.body.user;
     const blog = new Blog ({
       title: title,
       desc: desc,
       date: date,
       imgUrl: image,
       userName : req.session.user.username,
      //  email: req.user.email,
       like: 0,
       userid: userid
    }); 
    blog.save()

    .then(result => {
         res.send({status:'success'})
    })
    .catch(err => {
       console.log(err);
    })
})
app.get('/api/myBlogs',(req,res)=>{
   Blog.find({userid: req.session.user._id})
   .then(result=>{
      console.log(res)
      res.send(result);
   })
})
app.post('/comment/:blogId',isAuth.authCheck, (req,res,next) => {
   const params = req.params.blogId;
   const name = req.session.user.username;
   Blog.findById(params).then(result => {
     return result.docomment(req.body.comment,name,Date());
   })
   .then(t => {
      res.send({status: 'success',comments: t})
   })
   .catch(err => console.log(err));
})


app.get('/full-blog/:blogId',isAuth.authCheck, (req,res,next) => {
   const content  = req.params.blogId;
   console.log("Params: ", content);
   Blog.findById(content).then(result =>{
      if(!result) return res.redirect('/blogs');
      
      res.render('full-blog', {
         title: result.title,
         desc: result.desc,
         date: result.date,
         name: result.userName,
         blogId : content,
         like: result.like,
         userid: result.userid,
         
         comment: result.comment,
         path:'none',
         currentUser : req.user._id.toString()
         
      });
   })
   .catch(err => console.log(err));
})

app.get('/like/:blogid',isAuth.authCheck, (req,res,next) =>{
   const blogid = req.params.blogid;
   console.log("blogiddd:  ",blogid);
   Blog.findById(blogid).then(result => {
   //   console.log(result);
     console.log(req.session.user._id)
    return result.incLike(blogid,req.session.user._id);
     
   })
   .then(f => {
      console.log(f);
      res.send({status:'success',like:f})
   })
   .catch(err=>{
      res.send({status: 'failed'})
   })
})


app.get('/profile/:userid',isAuth.authCheck,(req,res,next) => {
   const userid = req.params.userid;
   if(userid === req.user._id.toString())
   {
      return res.redirect('/dashboard')
   }
   let blog;
   console.log(userid,req.user._id)
   Blog.find({userid: userid}).then(result => {
      blog = result;
      UserModel.findById(userid)
      .then(user => {
         
         res.render('profile',{
            path: null,
            name: user.name,
            institution: user.institution,
            branch: user.branch,
            email: user.email,
            currentUser: req.user._id.toString(),
            userid: userid,
            blog: blog,
           
         })
      })
   })

  


})




app.use('/admin-blog',isAuth.adminCheck,(req,res,next) => {
   Blog.find()
   .then(blogs => {
     console.log("blogs:: ",blogs);
    res.render('admin-blog', {
       blog: blogs
       ,path: '/admin-blog'
    })
   })
   .catch(err => {
      console.log(err);
   })
})

app.get('/delete-blog/:blogid', isAuth.authCheck,(req,res,next) =>{
   console.log(req.url);
   const blogid = req.params.blogid;
   console.log(blogid)
   Blog.findByIdAndRemove(blogid).then(result =>{
      console.log('removed');
      res.send({status:'success'});
   })
})

app.get('/api/trending',(req,res)=>{
   Blog.find().sort({like: -1}).limit(5).then(result=>{
      res.send(result);
   })
})

app.get('/api/people',isAuth.authCheck,(req,res)=>{
   UserModel.find({"_id":{'$ne':req.session.user._id}})
   .then(result=>{
      console.log(result);
      res.send(result);
   })
})
//follower
app.get('/api/follow/',(req,res)=>{
   const follower_id =  req.params.id;
   UserModel.findById(req.session.user._id)
   .then(user=>{
      user.following.push({username:req.body.username,_id:req.body._id});
      user.save();
   }).catch(err=>console.log(err));

   UserModel.findById(req.body._id)
   .then(user=>{
      user.addFollower(req.session.user._id,res.session.user.username);
   })

})




 app.get('/api/login', (req,res,next) => {

   if(req.session.user)
   {
      res.send({logged:true, user: req.session.user});
   }
   else{
      res.send({logged:false})
   }
 }) 



 app.post('/api/login',(req,res,next) => {
   const email = req.body.email
   const password = req.body.password
   UserModel.findOne({email: email})
   .then(user => {
       //console.log("USERMODEL",user._id)
       if(!user) {
         return res.send({status:'failed', err: 'invalid username'});
      }
       bcrypt.compare(password, user.password).then(doMatch => {
             console.log(doMatch);
             if(doMatch) {
               req.session.user = user //new UserModel(user.name,user.email,user.cart, user._id);
               req.session.isLoggedIn = true
            return  req.session.save((err) => {
                    console.log(err);
                    console.log("Yesss");
                    res.send({status:'success', isLogged: true});
                    
              })
             }
             else {   
                res.send({status:'failed', isLogged: false});}
       }).catch(err => {
             console.log(err);
             res.send({status:'failed', isLogged: false});
       })
       
   })
   .catch(err => console.log(err));
 })



app.get('/logout', isAuth.authCheck,(req,res,next) => {
   req.session.destroy((err) => {
         //console.log(err);
         res.send({status:'success'});
   })

} ) 




app.post('/api/signup',(req,res,next) => {
   const email = req.body.email;
   const password = req.body.password;
   
   UserModel.findOne({email: email})
   .then(userDoc => {
         if(userDoc)
         {     
               res.send({err: 'Email Already exists',status: 'failed'});
               return res.end();
         }
         return bcrypt.hash(password, 12).then(hashedPassword => {
               const user = new UserModel({
                     email: email,
                     password: hashedPassword,
                     username: req.body.username
               })
               return user.save();
         })
         .then(result => {
               console.log("Hey created")
                res.send({email:email,status:'success'}).end();
         });
        
   })
   
   .catch(err => {
         console.log(err);
   })

})


app.use((req,res,next) => {
   res.status(404).send("Page Not Found");
})

mongoose.connect('mongodb://localhost:27017?retryWrites=true&w=majority', {useNewUrlParser: true,useUnifiedTopology: true})
.then(result => {     
   console.log('db connected ')
      app.listen(8080);
   

}).catch(err => {
   console.log(err);
})

