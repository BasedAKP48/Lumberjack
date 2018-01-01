const admin = require('firebase-admin');
const serviceAccount = require('./serviceAccount.json');
const pino = require('pino');
const logger = pino({ prettyPrint: true });

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: `https://${serviceAccount.project_id}.firebaseio.com`
});

const rootRef = admin.database().ref();

// Listen to all messages (made after we started)
rootRef.child('messages').orderByChild('timeReceived').startAt(Date.now()).on('child_added', (e) => {
  let msg = e.val();

  // we can only log for messages that have the info we need.
  if (msg.extra_client_info) {
    let extra = msg.extra_client_info;
    let connector = `${(extra.connectorType || 'Unknown')}/${(extra.connectorName || msg.cid || 'Unknown')}`;
    let server = extra.server || 'Unknown';
    let channel = extra.channel || 'Unknown';
    let source = extra.source || 'Unknown';

    let logMsg = `[${e.key}] {${connector}} ${server}/${channel}: ${source}`;

    logger.info(logMsg);
  }
});
