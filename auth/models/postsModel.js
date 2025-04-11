const mongoose = require('mongoose');

const postsModel = mongoose.Schema({
    
},{
    timestamps:true
});

module.exports = mongoose.model("User", userSchema);