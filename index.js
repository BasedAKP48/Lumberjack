const admin = require('firebase-admin');
const serviceAccount = require('./serviceAccount.json');
const pino = require('pino');
const logger = pino({ prettyPrint: true });
const {initialize} = require('@basedakp48/plugin-utils');

initialize(admin, serviceAccount);

const rootRef = admin.database().ref();

// Listen to all messages (made after we started)
rootRef.child('messages').orderByChild('timeReceived').startAt(Date.now()).on('child_added', (e) => {
  let msg = e.val();

  // we can only log messages that allow it.
  if (msg.data && msg.data.secret || msg.type === 'internal') {
    return;
  }

  let extra = msg.data || {};
  let direction = msg.direction === 'in' ? 'IN :' : 'OUT:';
  let connector = `${(extra.connectorType || 'Unknown')}/${(extra.connectorName || msg.cid || 'Unknown')}`;
  let server = extra.server || 'Unknown';
  let channel = extra.channel || 'Unknown';
  let source = extra.source || 'Unknown';
  let plugin = '';

  if (msg.direction === 'out') {
    plugin = `(${extra.pluginName||'Unknown'}/${extra.pluginInstance||msg.uid})`;
    source = extra.connectorBotName || 'Unknown';
  }

  let logMsg = `${direction} [${e.key}] {${connector}} ${server}/${channel}: ${source} ${plugin}`;

  logger.info(logMsg);
});
