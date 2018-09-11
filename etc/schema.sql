/* RUN AS POSTGRES USER */

CREATE DATABASE speaker;

CREATE USER speaker WITH PASSWORD 'speakerpwd';
GRANT ALL PRIVILEGES ON DATABASE speaker TO speaker;


/* INSTALL pgcrypto as postgres on speaker database */
 CREATE EXTENSION pgcrypto;


/* RUN AS *SPEAKER* USER */

/* PROFILE */
CREATE TABLE users (
    userid serial PRIMARY KEY,
    email text NOT NULL UNIQUE,
    first_name text NOT NULL,
    last_name text NOT NULL,
    password text NOT NULL,
    created_timestamp timestamp without time zone DEFAULT current_timestamp,
    user_type varchar(25) check (user_type in ('speaker', 'organizer', 'admin')) DEFAULT 'speaker',
    status varchar(10) check (status in ('active','inactive','banned')) DEFAULT 'active'
);

CREATE TABLE bios (
    bioid serial PRIMARY KEY,
    userid integer NOT NULL references users(userid),
    title text NOT NULL,
    body text NOT NULL
);

/* CONFERENCES */
CREATE TABLE conferences (
    conferenceid serial PRIMARY KEY,
    conference_name text UNIQUE NOT NULL,
    description text,
    start_date date,
    end_date date,
    cfp_start_date date,
    cfp_end_date date,
    website text,
    slug text NOT NULL,
    added_by integer references users(userid)
);

CREATE UNIQUE INDEX current_conf_idx ON conferences (conference_name, COALESCE(start_date,'1969-12-31'));

CREATE TABLE submitted_talks (
    conferenceid integer NOT NULL references conferences(conferenceid),
    talkid integer NOT NULL references talks(talkid),
    submitted_timestamp timestamp without time zone DEFAULT current_timestamp,
    accepted boolean,
    last_updated timestamp without time zone,
    unique (conferenceid, talkid)
);

/* TALKS */
CREATE TABLE talks (
    talkid serial PRIMARY KEY,
    userid integer NOT NULL references users(userid),
    title text NOT NULL UNIQUE,
    abstract text NOT NULL,
    short_abstract text,
    slide_link text,
    notes text,
    slug text NOT NULL,
    talk_type varchar(25) check (talk_type in ('30 minutes', '60 minutes', 'Lightning', 'Ignite', 'Tutorial', 'Workshop', 'Keynote')) DEFAULT '30 minutes',
    created_timestamp timestamp without time zone DEFAULT current_timestamp
);

CREATE TABLE talk_feedback (
    conferenceid integer NOT NULL references conferences(conferenceid),
    talkid integer NOT NULL references talks(talkid),
    feedback_timestamp timestamp without time zone DEFAULT current_timestamp,
    rating real NOT NULL default 0,
    comment text,
    ip text,
    unique (conferenceid, talkid, ip)
);

/* ORG MANAGEMENT */
CREATE TABLE orgs (
    orgid serial PRIMARY KEY,
    org_name text UNIQUE NOT NULL,
    created_timestamp timestamp without time zone DEFAULT current_timestamp,
    created_by integer references users(userid)
);

CREATE TABLE org_members (
    orgid integer references orgs(orgid),
    userid integer references users(userid),
    role varchar(10) check (role in ('member','manager')) DEFAULT 'member',
    unique (orgid, userid)
);
