module.exports = {
  port: process.env.PORT || 3080,
  postgres: {
        hostname: 'localhost',
        port: 5432,
        database: 'speaker',
        /* These should be changed */
        user: 'speaker',
        password: 'speakerpwd'
    }
}
