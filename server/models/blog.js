const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const Blog = new Schema ( {
    title: {
        type: String,
        required: true
    },
    desc: {
        type: String,
        required: true
    },
    date: {
        type: String,
        required: true
    },
    userName : {
        type: String,
        
    },
    imgUrl : {
        type: String
    },
    email: {
        type: String,
        
    },
    like : {
        type:Number,
        required: true
    },
    likeuserid: [{userid: {type: String, required: true}}],
    comment: [{comments: {type: String, required: false}, username: {type: String, required: false ,ref:'User'},
       userid: {type: String, required: false ,ref:'User'} , date: {type: String, required: false}
    }],
    userid : {
        type:String,
    }
    
    
})

Blog.methods.incLike = function (blogid,userid) {
    let array = this.likeuserid;
    let f=-1;
    for(let i=0;i<array.length;i++)
    {
        if(array[i].userid == userid)
        {
            f=i; break;
        }
    }
    if(f>-1) 
    {
        this.like = this.like-1;
        array.splice(f, 1);
        this.likeuserid = array;
    }
    else
   { this.like = this.like+1;
        let user = {
            userid: userid
        }
    array.push(user);
    this.likeuserid = user;
    }
    console.log("incLike," ,this.like);
    this.save();
    return this.like;
}

Blog.methods.docomment = function (comment,username,date) {
   const Commenting = [...this.comment];
   const object = {
       comments : comment,
       username: username,
       date: date,
   }
   Commenting.push(object);
   this.comment = Commenting;
    this.save();
    return  Commenting;
}



module.exports = mongoose.model('Blog', Blog);
