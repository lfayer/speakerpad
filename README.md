# SpeakerPad
![logo](public/img/SpeakerPad-logo-icon.png)

Service for speakers to manage bios and talks.  Using PostgreSQL (tentatively 9.5) and node.js with express.

### Setup Instructions
 * Configure webserver/database in [etc/config.js](etc/config.js)
 * Import database schema from [etc/schema.sql](etc/schema.sql)
 * Install npm dependencies
 * Run [bin/www](speaker-pad/bin/www)