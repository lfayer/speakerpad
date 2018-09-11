var db = app_require('lib/db.js');
var assign = require('object-assign');
var User = app_require('lib/user.js');

var Org = function(props){
    var _org = {
        orgid:'',
        org_name: '',
        created_by: '',

        save : function(callback){
            if(this.orgid){
                this.update(callback);
            } else {
                this.insert(callback);
            }
        },
        insert : function(callback){
            var org = this;
                db.query("INSERT INTO orgs (org_name, created_by) values ($1,$2) returning orgid",[
                    org.org_name,
                    org.created_by
                ],function(err,result){
                    if(err){
                        return callback('Something went wrong with adding a org');
                    } else {
                        org.orgid = result.rows[0].orgid;
                        Org.addMember(org.orgid, org.created_by, 'manager', function(callback) {
                            if (err){
                                return callback('Something went wrong with adding a member to org');
                            }
                        });
                        return callback(undefined);
                    }
                });
        },
        update : function(callback){
            var org = this;
            db.query("UPDATE orgs set org_name=$1 where orgid = $1",[
                    org.org_name,
                    org.orgid
                ],function(err,result){
                    if(err){
                        return callback('Something went wrong with modifying a org '+org.orgid);
                    } else {
                        callback(undefined);
                    }
                });
        },
        delete : function(callback){
            var org = this;
                db.query("delete from orgs where orgid = $1",[org.orgid],function(err,result){
                    if(err){
                        return callback('Something went wrong with deleting a org '+org.orgid);
                    } else {
                        callback(undefined);
                    }
                });
        },
    };
    props = assign(_org,props);
    return _org;
};

//static methods
Org.get = function(orgid,callback){
    db.query("SELECT * FROM orgs WHERE orgid = $1",[orgid],function(err,result){
        if(err){
            callback(err);
        } else {
            callback(null,new Conference(result.rows[0]));
        }
    });
};

Org.getOrgsByUser = function(userid,callback){
    db.query("SELECT o.*, m.role, c.member_count "+
                "FROM org_members m, orgs o, "+
                "(select orgid, count(userid) as member_count from org_members group by orgid) c "+
                "where m.userid = $1 and m.orgid = o.orgid "+
                "and c.orgid = o.orgid "+ 
                "order by org_name DESC",[userid],function(err,result){
        if(err){
            callback(err);
        } else {
            callback(null,result.rows);
        }
    });
};

Org.addMember = function(orgid, userid, role, callback) {
    db.query("insert into org_members (orgid, userid, role) VALUES ($1,$2,$3)",[orgid, userid, role == '' ? 'member' : role],function(err,result){
        if(err){
            return callback('Something went wrong with adding member '+userid+' to org '+orgid);
        } else {
            callback(undefined);
        }
    });
}

Org.getMembers = function(orgid,callback){
    db.query("SELECT u.* FROM org_members m, users u where m.orgid = $1 and m.userid = u.userid",[orgid],function(err,result){
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

Org.getLatestAccepted = function(orgid,userid,callback){
    db.query("SELECT u.first_name || ' ' || u.last_name as member_name, u.userid, t.talkid, t.title, t.talk_type, t.abstract, "+
                    "c.conference_name, c.conferenceid, s.accepted, "+
                    "to_char(s.submitted_timestamp,'Month DD, YYYY') as submitted_date, "+
                    "to_char(s.last_updated,'Month DD, YYYY') as accepted_date, "+
                    "to_char(c.start_date,'Month DD, YYYY') as start_date "+
                "FROM org_members m, users u, talks t, submitted_talks s, conferences c "+
                "where m.orgid = $1 and m.userid = u.userid "+
                    "and t.talkid = s.talkid and m.userid = t.userid "+
                    "and c.conferenceid = s.conferenceid "+
                    "and s.accepted = true "+
                    "and submitted_timestamp >= CURRENT_DATE - INTERVAL '3 months' "+
                    "order by accepted_date desc",[orgid],function(err,result){
        if(err){
            callback(err);
        } else {
            callback(null,result.rows);
        }
    });
};

Org.getMemberSubmissions = function(orgid,callback){
    db.query("SELECT u.first_name || ' ' || u.last_name as member_name, u.userid, t.talkid, t.title, t.talk_type, t.abstract, "+
                    "c.conference_name, c.conferenceid, s.accepted, "+
                    "to_char(s.submitted_timestamp,'Month DD, YYYY') as submitted_date "+
                "FROM org_members m, users u, talks t, submitted_talks s, conferences c "+
                "where m.orgid = $1 and m.userid = u.userid "+
                    "and t.talkid = s.talkid and m.userid = t.userid "+  
                    "and c.conferenceid = s.conferenceid "+
                    "and submitted_timestamp >= CURRENT_DATE - INTERVAL '3 months'",[orgid],function(err,result){
        if(err){
            callback(err);
        } else {
            callback(null,result.rows);
        }
    });
};

Org.getConferences = function(orgid,userid,callback){
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
                    "FROM submitted_talks s, talks t, users u, org_members m "+
                        "WHERE s.talkid = t.talkid "+
                        "and t.userid = u.userid "+
                        "and u.userid = m.userid "+
                        "and m.orgid = $2 "+
                    ") ut "+
                    "GROUP BY conferenceid " +
                ") p "+
                "ON c.conferenceid = p.conferenceid "+
                "WHERE start_date >= current_date or start_date is null "+ 
                "GROUP BY c.conferenceid, c.conference_name, c.website, "+
                "start_date, end_date, cfp_start_date, cfp_end_date, mine, p.speakers",

                [userid, orgid],function(err,result){
                    if(err){
                        console.log(err);
                        callback(err);
                    } else {
                        callback(null,result.rows);
                    }
                });
};

module.exports = Org;
