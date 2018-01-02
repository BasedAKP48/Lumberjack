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

  // we can only log messages that allow it.
  if (msg.extra_client_info && msg.extra_client_info.secret || msg.type === 'internal') {
    return;
  }

  let extra = msg.extra_client_info || {};
  let direction = msg.direction === 'in' ? 'IN :' : 'OUT:';
  let connector = `${(extra.connectorType || 'Unknown')}/${(extra.connectorName || msg.cid || 'Unknown')}`;
  let server = extra.server || 'Unknown';
  let channel = extra.channel || 'Unknown';
  let source = extra.source || 'Unknown';
  let plugin = '';

  if (msg.direction === 'out') {
    plugin = `(${extra.pluginName}/${extra.pluginInstance})`;
    source = extra.connectorBotName || 'Unknown';
  }

  let logMsg = `${direction} [${e.key}] {${connector}} ${server}/${channel}: ${source} ${plugin}`;

  logger.info(logMsg);
});
