'use strict';

const { sanitize } = require('@strapi/utils');
const Moralis = require("moralis/node");

module.exports = {

  async login(ctx) {
    const { moralis_session_id } = ctx.request.body
    const { user: userService, jwt: jwtService } = strapi.plugins['users-permissions'].services;

    const publicKey = await this.getDataFromMoralis(moralis_session_id);

    if(!publicKey) {
      ctx.send({ message: "User is not authorized, invalid session ID" }, 401);
      return;
    }

    let user = await strapi.query('plugin::users-permissions.user').findOne({
      where: { username: publicKey }
    });

    if (!user) {
      user = await this.createUser({ email: `${publicKey}@kassandra.com`, username: publicKey, provider: "local" })
      await userService.edit(user.id, { confirmed: true });
    }

    console.log(user)

    const userSchema = strapi.getModel('plugin::users-permissions.user');
    const sanitizedUserInfo = await sanitize.sanitizers.defaultSanitizeOutput(userSchema, user);

    ctx.send({
      jwt: jwtService.issue({ id: user.id }),
      user: sanitizedUserInfo
    });
  },

  userSettings() {
    const pluginStore = strapi.store({
      environment: '',
      type: 'plugin',
      name: 'users-permissions',
    });
    return pluginStore.get({ key: 'advanced' });
  },

  async createUser(user) {
    const userSettings = await this.userSettings();
    const role = await strapi
      .query('plugin::users-permissions.role')
      .findOne({
        where: { name: "Creator" }
      });

    const newUser = {
      email: user.email,
      username: user.username || user.email,
      provider: user.provider,
      role: { id: role.id }
    };
    return strapi
      .query('plugin::users-permissions.user')
      .create({ data: newUser, populate: ['role'] });
  },

  async getDataFromMoralis(moralis_session_id) {
    /* Moralis init code */
    const serverUrl = process.env.MORALIS_SERVER_URL;
    const appId = process.env.MORALIS_APP_ID;
    const masterKey = process.env.MORALIS_MASTER_KEY;

    await Moralis.start({ serverUrl, appId, masterKey });

    const _Session = Moralis.Object.extend("_Session");
    const sessionQuery = new Moralis.Query(_Session);
    sessionQuery.equalTo("objectId", moralis_session_id);
    const sessions = await sessionQuery.find({ useMasterKey: true }); 

    if(sessions.length > 0) {
      const userId = JSON.parse(JSON.stringify(sessions[0])).user.objectId;

      const _User = Moralis.Object.extend("_User");
      const userQuery = new Moralis.Query(_User);
      userQuery.equalTo("objectId", userId);
      const user = await userQuery.find({ useMasterKey: true });

      return user[0].get("solAddress");
    } 
  }
};
