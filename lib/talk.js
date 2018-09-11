var db = app_require('lib/db.js');
var assign = require('object-assign');
var tools = app_require('lib/tools.js');

var Talk = function(props){
    var _talk = {
        talkid:'',
        userid: '',
        title:'',
        slide_link:'',
        abstract:'',
        short_abstract:'',
        notes:'',
        talk_type:'',
        accepted:'',
        submitted:'',

        save : function(callback){
            if(this.talkid){
                this.update(callback);
            } else {
                this.insert(callback);
            }
        },
        insert : function(callback){
            var talk = this;
                db.query("INSERT INTO talks (userid, title,abstract,short_abstract,slide_link, notes, talk_type, slug) values ($1,$2,$3,$4,$5,$6,$7,$8) returning talkid",[
                    talk.userid,
                    talk.title == '' ? null : talk.title,
                    talk.abstract == '' ? null : talk.abstract,
                    talk.short_abstract == '' ? null : talk.short_abstract,
                    talk.slide_link == '' ? null : talk.slide_link,
                    talk.notes == '' ? null : talk.notes,
                    talk.talk_type == '' ? '30 minutes' : talk.talk_type,
                    tools.slugify(talk.title)
                ],function(err,result){
                    if(err){
                        console.log(err);
                        return callback('Something went wrong with adding a talk');
                    } else {
                        talk.talkid = result.rows[0].talkid;
                        callback(undefined);
                    }
                });
        },
        update : function(callback){
            var talk = this;
                db.query("UPDATE talks set title=$1, abstract=$2, short_abstract=$3, slide_link=$4, notes=$5, talk_type=$6, slug=$7 where talkid = $8 and userid = $9",[
                    talk.title == '' ? null : talk.title,
                    talk.abstract == '' ? null : talk.abstract,
                    talk.short_abstract == '' ? null : talk.short_abstract,
                    talk.slide_link == '' ? null : talk.slide_link,
                    talk.notes == '' ? null : talk.notes,
                    talk.talk_type == '' ? '30 minutes' : talk.talk_type,
                    tools.slugify(talk.title),
                    talk.talkid,
                    talk.userid
                ],function(err,result){
                    if(err){
                        console.log(err);
                        return callback('Something went wrong with modifying a talk '+talk.talkid);
                    } else {
                        callback(undefined);
                    }
                });
        },
        delete : function(callback){
            var talk = this;
                db.query("delete from talks where talkid = $1 and userid = $2",[talk.talkid,talk.userid],function(err,result){
                    if(err){
                        console.log(err);
                        return callback('Something went wrong with deleting a talk '+talk.talkid);
                    } else {
                        callback(undefined);
                    }
                });
        }

    };

    props = assign(_talk,props);
    return _talk;
};

//static methods
Talk.get = function(talkid,callback){
    db.query("SELECT * FROM talks WHERE talkid = $1",[talkid],function(err,result){
        if(err){
            callback(err);
        } else {
            callback(null,new Talk(result.rows[0]));
        }
    });
};
Talk.getAllbyUser = function(userid,callback){
    db.query("SELECT * FROM talks where userid = $1 ORDER BY created_timestamp",[userid],function(err,result){
        if(err){
            callback(err);
        } else {
            var results = [];
            for(var i = 0,r; r = result.rows[i]; i++){
                results.push(new Talk(r));
            }
            callback(null,results);
        }
    });
};
Talk.getAllbyUserWithStats = function(userid,callback){
    db.query("SELECT t.talkid, t.title, t.slide_link, t.talk_type, t.abstract, "+
              " sum(CASE WHEN accepted is true THEN 1 ELSE 0 END) as accepted, count(s.talkid) as submitted "+
              " FROM talks t left join submitted_talks s on t.talkid = s.talkid "+
              " where t.userid = $1 "+
              " GROUP by  t.talkid, t.title, t.slide_link, t.talk_type, t.abstract "+
              " ORDER by t.created_timestamp",[userid],function(err,result){
        if(err){
            console.log(err);
            callback(err);
        } else {
            var results = [];
            for(var i = 0,r; r = result.rows[i]; i++){
                results.push(new Talk(r));
            }
            callback(null,results);
        }
    });
};

Talk.getSubmittedByUser = function(userid, callback){
    db.query("SELECT t.talkid, t.title, c.conferenceid, c.conference_name, to_char(s.submitted_timestamp,'Month DD, YYYY') as submitted_date, s.accepted, c.slug||'/'||t.slug as feedback_slug "+
                "FROM talks t, submitted_talks s, conferences c " +
                "WHERE t.talkid = s.talkid " +
                "AND s.conferenceid = c.conferenceid " +
                "AND t.userid = $1" +
                "ORDER by s.submitted_timestamp DESC",       
                [userid],function(err,result){
        if(err){
            callback(err);
        } else {
            callback(null,result.rows);
        }
    });
};

// FEEDBACK

Talk.getBySlugs = function(conference_slug, talk_slug, callback){
    db.query("SELECT t.talkid, t.title, c.conferenceid, c.conference_name, t.abstract, t.slide_link, u.first_name, u.last_name "+
                "FROM talks t, submitted_talks s, conferences c, users u " +
                "WHERE t.talkid = s.talkid " +
                "AND s.conferenceid = c.conferenceid " +
                "AND u.userid = t.userid " +
                "AND s.accepted is true " +
                "AND c.slug = $1 " +
                "AND t.slug = $2 ",
                [conference_slug, talk_slug],function(err,result){
        if(err){
            callback(err);
        } else {
            callback(null,result.rows[0]);
        }
    });
};

Talk.saveFeedback = function(data, callback) {
    db.query("INSERT into talk_feedback (conferenceid, talkid, rating, comment, ip) "+
                "VALUES ($1,$2,$3,$4,$5)",
                    [data.conferenceid,
                    data.talkid,
                    data.rating == null? 0 : data.rating,
                    data.comment,
                    data.ip],function(err,result){
                       if(err){
                            callback(err);
                        } else {
                            callback(null);
                        }
                    });
};

// USER DASHBOARD
Talk.getUpcomingTalks = function(userid, callback){
    db.query("SELECT c.conferenceid, c.conference_name, c.start_date, t.title, "+
                    "to_char(c.start_date, 'Month DD, YYYY') as start_date, "+
                    "to_char(c.end_date, 'Month DD, YYYY') as end_date "+
                        "FROM conferences c, submitted_talks s, talks t "+
                            "WHERE c.start_date >= current_timestamp "+ 
                            "and t.userid = $1 "+
                            "and s.accepted = true "+
                            "and s.conferenceid = c.conferenceid "+
                            "and t.talkid = s.talkid "+
                    "ORDER BY c.start_date",[userid],function(err,result){
        if(err){
            console.log(err);
            callback(err);
        } else {
            callback(null,result.rows);
        }
    });
};

module.exports = Talk;
