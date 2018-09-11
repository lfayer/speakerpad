var db = app_require('lib/db.js');
var assign = require('object-assign');

var User = function(props){
    var _user = {
        userid:'',
        email:'',
        first_name:'',
        last_name:'',
        status:'',
        user_type:'',
        password:null,

        save : function(callback){
            if(this.userid){
                this.update(callback);
            } else {
                this.insert(callback);
            }
        },
        insert : function(callback){
            var user = this;
                db.query("INSERT INTO users (email,first_name,last_name,password,status,user_type) values ($1,$2,$3,crypt( $4, gen_salt('md5') ),$5,$6) returning userid",[
                    user.email == '' ? null : user.email,
                    user.first_name == '' ? null : user.first_name,
                    user.last_name == '' ? null : user.last_name,
                    user.password == '' ? null : user.password,
                    user.status == '' ? 'active' : user.status,
                    user.user_type == '' ? 'speaker' : user.user_type,
                ],function(err,result){
                    if(err){
                        console.log(err);
                        return callback('There was a problem with registration');
                    } else {
                        user.userid = result.rows[0].userid;
                        callback(undefined);
                    }
                });
        },
        update : function(callback){
            var user = this;
            db.query("UPDATE users SET email=$1,first_name=$2,last_name=$3,password=case when $4<>'' then crypt( $4, gen_salt('md5') ) else password end,status=$5,user_type=$6 WHERE userid = $7",[
                user.email == '' ? null : user.email,
                user.first_name == '' ? null : user.first_name,
                user.last_name == '' ? null : user.last_name,
                user.password == '' ? null : user.password,
                user.status == '' ? 'active' : user.status,
                user.user_type == '' ? 'speaker' : user.user_type,
                user.userid
            ],function(err,result){
                if(err){
                    console.log(err);
                    return callback('Something went wrong with updating user information');
                } else {
                    return callback(undefined);
                }
            });
        }
    };

    props = assign(_user,props);
    return _user;
};

//static methods
User.get = function(userid,callback){
    db.query("SELECT * FROM users WHERE userid = $1",[userid],function(err,result){
        if(err){
            callback(err);
        } else {
            callback(null,new User(result.rows[0]));
        }
    });
};
User.getByEmailPassword = function(email,password,callback){
    db.query("select * from users where lower(email) = lower($1) and password = crypt($2, password) and status = 'active'",[email,password],function(err,result){
        if(err){
            callback(err);
        } else {
            callback(null,new User(result.rows[0]));
        }
    });
};
User.getByEmail = function(email,callback){
    db.query("SELECT * FROM users WHERE email = $1",[email],function(err,result){
        if(err){
            callback(err);
        } else {
            callback(null,new User(result.rows[0]));
        }
    });
};
User.getAll = function(callback){
    db.query("SELECT * FROM users ORDER BY email",function(err,result){
        if(err){
            callback(err);
        } else {
            var results = [];
            for(var i = 0,r; r = result.rows[i]; i++){
                results.push(new User(r));
            }
            callback(null,results);
        }
    });
};

module.exports = User;
