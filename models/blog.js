var mongoose = require('mongoose');


var blogSchema = new mongoose.Schema({
    title : String,
    image : String,
    body  : String,
    comments:[
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Comment"
        }
    ],
    created : {type : Date, default:  Date.now}
});

var blog = module.exports = mongoose.model("blog", blogSchema);