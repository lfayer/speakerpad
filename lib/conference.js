var db = app_require('lib/db.js');
var assign = require('object-assign');
var tools = app_require('lib/tools.js');

var Conference = function(props){
    var _conference = {
        conferenceid: null,
        conference_name: null,
        website: null,
        start_date: null,
        end_date: null,
        cfp_start_date: null,
        cfp_end_date: null,
        website: null,
        added_by: null,

        save : function(callback){
            if(this.conferenceid){
                this.update(callback);
            } else {
                this.insert(callback);
            }
        },
        insert : function(callback){
            var conference = this;
                db.query("INSERT INTO conferences (conference_name, added_by, start_date, end_date, "+
                            "cfp_start_date, cfp_end_date, website, slug) "+
                          "values "+
                        "($1,$2,$3,$4,$5,$6,$7,$8) returning conferenceid",[
                    conference.conference_name,
                    conference.added_by,
                    conference.start_date ? conference.start_date : null,
                    conference.end_date ? conference.end_date : null,
                    conference.cfp_start_date ? conference.cfp_start_date : null,
                    conference.cfp_end_date ? conference.cfp_end_date : null,
                    conference.website,
                    tools.slugify(conference.conference_name)
                ],function(err,result){
                    if(err){
                        console.log(err);
                        return callback('Something went wrong with adding a conference');
                    } else {
                        conference.conferenceid = result.rows[0].conferenceid;
                        callback(undefined);
                    }
                });
        },
        update : function(callback){
            var conference = this;
                db.query("UPDATE conferences set conference_name=$1, start_date=$2, end_date=$3, "+
                            "cfp_start_date=$4, cfp_end_date=$5, website=$6, slug=$7  where conferenceid = $8",[
                    conference.conference_name,
                    conference.start_date ? conference.start_date : null,
                    conference.end_date ? conference.end_date : null,
                    conference.cfp_start_date ? conference.cfp_start_date : null,
                    conference.cfp_end_date ? conference.cfp_end_date : null,
                    conference.website,
                    tools.slugify(conference.conference_name),
                    conference.conferenceid
                ],function(err,result){
                    if(err){
                        console.log(err);
                        return callback('Something went wrong with modifying a conference '+conference.conferenceid);
                    } else {
                        callback(undefined);
                    }
                });
        },
        delete : function(callback){
            var conference = this;
                db.query("delete from conferences where conferenceid = $1",[conference.conferenceid],function(err,result){
                    if(err){
                        console.log(err);
                        return callback('Something went wrong with deleting a conference '+conference.conferenceid);
                    } else {
                        callback(undefined);
                    }
                });
        },
        submitTalk : function(talkid, callback){
            var conference = this;
                db.query("insert into submitted_talks (conferenceid, talkid) VALUES ($1,$2)",[conference.conferenceid, talkid],function(err,result){
                    if(err){
                        console.log(err);
                        return callback('Something went wrong with submitting a talk '+talkid+' to a conference '+conference.conferenceid);
                    } else {
                        callback(undefined);
                    }
                });
        }

    };

    props = assign(_conference,props);
    return _conference;
};

//static methods
Conference.get = function(conferenceid,callback){
    db.query("SELECT conference_name, website, " +
                " to_char(start_date,'YYYY-MM-DD') as start_date, "+
                " to_char(end_date,'YYYY-MM-DD') as end_date, "+
                " to_char(cfp_start_date,'YYYY-MM-DD') as cfp_start_date, "+
                " to_char(cfp_end_date,'YYYY-MM-DD') as cfp_end_date "+
                "FROM conferences WHERE conferenceid = $1",[conferenceid],function(err,result){
        if(err){
            callback(err);
        } else {
            callback(null,new Conference(result.rows[0]));
        }
    });
};

Conference.getByName = function(conference_name,callback){
    db.query("SELECT * FROM conferences WHERE conference_name = $1 and (start_date > CURRENT_DATE or start_date is NULL)",[conference_name],function(err,result){
        if(err){
            callback(err);
        } else {
            callback(null,new Conference(result.rows[0]));
        }
    });
};

Conference.getListByPartial = function(searchstr,callback){
    db.query("SELECT * FROM conferences where lower(conference_name) like CONCAT('%',$1::TEXT,'%') and (start_date > CURRENT_DATE or start_date is NULL) ORDER BY conference_name",[searchstr.toLowerCase()],function(err,result){
        if(err){
            callback(err);
        } else {
            var results = [];
            for(var i = 0,r; r = result.rows[i]; i++){
                results.push(new Conference(r));
            }
            callback(null,results);
        }
    });
};

Conference.getUpcomingCFPs = function(callback){
    db.query("SELECT c.conferenceid, c.conference_name, "+
                    "to_char(c.start_date, 'Month DD, YYYY') as start_date, "+
                    "to_char(c.end_date, 'Month DD, YYYY') as end_date, "+
                    "to_char(c.cfp_start_date, 'Month DD, YYYY') as cfp_start_date, "+
                    "to_char(c.cfp_end_date, 'Month DD, YYYY') as cfp_end_date "+
                        "FROM conferences c "+
                        "WHERE (cfp_start_date < current_timestamp OR cfp_start_date is NULL)"+
                            "and cfp_end_date > current_timestamp "+
                    "ORDER BY c.cfp_end_date",[],function(err,result){
        if(err){
            callback(err);
        } else {
            callback(null,result.rows);
        }
    });
};

Conference.getConferencesForUser = function(userid,callback){
    db.query("SELECT c.conferenceid, c.conference_name, c.website, CASE WHEN c.added_by = $1 THEN true ELSE false END as mine, "+
                    "to_char(c.start_date, 'Month DD, YYYY') as start_date, "+
                    "to_char(c.end_date, 'Month DD, YYYY') as end_date, "+
                    "to_char(c.cfp_start_date, 'Month DD, YYYY') as cfp_start_date, "+
                    "to_char(c.cfp_end_date, 'Month DD, YYYY') as cfp_end_date, "+
                    "sum(CASE WHEN accepted is true THEN 1 ELSE 0 END) as accepted, count(s.talkid) as submitted, p.speakers "+
                    "FROM conferences c LEFT JOIN submitted_talks s on c.conferenceid = s.conferenceid "+
                    "LEFT JOIN "+
                "( SELECT conferenceid, array_to_json(array_agg(ut))::text as speakers FROM ( "+
                    "SELECT s.conferenceid, u.first_name || ' ' || u.last_name as name, u.userid, t.*, s.accepted "+
                    "FROM submitted_talks s, talks t, users u "+
                        "WHERE s.talkid = t.talkid "+
                        "and t.userid = u.userid "+
                        "and u.userid = $2 "+
                    ") ut "+
                    "GROUP BY conferenceid " +
                ") p "+
                "ON c.conferenceid = p.conferenceid "+
                "WHERE start_date >= current_date or start_date is null "+
                "GROUP BY c.conferenceid, c.conference_name, c.website, "+
                "start_date, end_date, cfp_start_date, cfp_end_date, mine, p.speakers",

                [userid, userid],function(err,result){
                    if(err){
                        console.log(err);
                        callback(err);
                    } else {
                        callback(null,result.rows);
                    }
                });
};

Conference.acceptTalk = function(conferenceid, talkid, accepted, callback){
    db.query("UPDATE submitted_talks set accepted = $1, last_updated = current_timestamp where conferenceid = $2 and talkid = $3",[
        accepted,
        conferenceid,
        talkid
    ],function(err,result){
        if(err){
            console.log(err);
            return callback('Something went wrong with accepting a talk '+talkid+' for conference '+conferenceid);
        } else {
            callback(undefined);
        }
    });
};

module.exports = Conference;
