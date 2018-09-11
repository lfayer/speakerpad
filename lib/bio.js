var db = app_require('lib/db.js');
var assign = require('object-assign');

var Bio = function(props){
    var _bio = {
        bioid:'',
        userid: '',
        title:'',
        body:'',

        save : function(callback){
            if(this.bioid){
                //this.update(callback);
            } else {
                this.insert(callback);
            }
        },
        insert : function(callback){
            var bio = this;
                db.query("INSERT INTO bios (userid, title, body) values ($1,$2,$3) returning bioid",[
                    bio.userid,
                    bio.title == '' ? null : bio.title,
                    bio.body == '' ? null : bio.body,
                ],function(err,result){
                    if(err){
                        console.log(err);
                        return callback('Something went wrong with adding a bio');
                    } else {
                        bio.bioid = result.rows[0].bioid;
                        callback(undefined);
                    }
                });
        },
        delete : function(callback){
            var bio = this;
                db.query("delete from bios where bioid = $1 and userid = $2",[bio.bioid,bio.userid],function(err,result){
                    if(err){
                        console.log(err);
                        return callback('Something went wrong with deleting a bio '+bio.bioid);
                    } else {
                        callback(undefined);
                    }
                });
        }
    };

    props = assign(_bio,props);
    return _bio;
};

Bio.getAllbyUser = function(userid,callback){
    db.query("SELECT * FROM bios where userid = $1",[userid],function(err,result){
        if(err){
            callback(err);
        } else {
            var results = [];
            for(var i = 0,r; r = result.rows[i]; i++){
                results.push(new Bio(r));
            }
            callback(null,results);
        }
    });
};

module.exports = Bio;
