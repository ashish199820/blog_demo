const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const userSchema = new Schema ({

    password: {
        type: String,
        required: true
    },
    email : {
        type: String,
        required: true
    },
    username : {
        type: String,
        required: true
    },
    following:[{username:{type: String},_id:{type: String}}]
    ,
    follower: [{username:{type: String},_id:{type: String}}],

    resetToken : String,
    resetTokenExpiration: String,
})
userSchema.methods.addFollower = function (_id,username){
    this.follower.push({username:username, _id:id});
    return this.save();
}


module.exports = mongoose.model('User', userSchema);