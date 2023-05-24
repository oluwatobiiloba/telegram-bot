const TelegramBot = require('node-telegram-bot-api');

module.exports = function (token, webhook) {
  const bot = new TelegramBot(token);
  if(webhook) bot.setWebHook(webhook, { drop_pending_updates: true });
  return bot;
};
