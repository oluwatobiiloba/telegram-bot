module.exports = function (args) {
  const argsClone = { ...args };
  delete argsClone.bot;
  delete argsClone.mws;
  delete argsClone.handler;
  delete argsClone.body?.user;

  return {
    chatId: args.chatId,
    botToken: args.bot.token,
    mws: args.mws,
    handler: args.handler,
    reqArgs: argsClone,
  };
};
