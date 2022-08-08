module.exports = (plugin) => {
	plugin.controllers.auth.refreshToken = async (ctx) => {
		// refresh userself token
		const newJwt = strapi.plugins['users-permissions'].services.jwt.issue({
			id: ctx.state.user.id
		})
		return { jwt: newJwt }
	}

	plugin.routes['content-api'].routes.push({
		method: 'POST',
		path: '/auth/refreshToken',
		handler: 'auth.refreshToken',
		config: {
			prefix: ''
		}
	});

	return plugin
}