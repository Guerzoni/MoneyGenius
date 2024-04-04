const jwt = require('jsonwebtoken'); // used to create, sign, and verify tokens

const groupTokenChecker = function(req, res, next) {
	
	// check header or url parameters or post parameters for token
	var token = req.body.group_token || req.query.group_token || req.headers['x-access-token'];

	// if there is no token
	if (!token) {
		return res.status(401).send({ 
			success: false,
			message: 'No group token provided.'
		});
	}

	// decode token, verifies secret and checks exp
	jwt.verify(token, process.env.SUPER_SECRET, function(err, decoded) {		
        if (err) {
			return res.status(403).send({
				success: false,
				message: 'Failed to authenticate group token.'
			});		
		} else {

			// if everything is good, save to request for use in other routes
			req.group_id = decoded.group_id;
			next();
		}
	});
	
};

module.exports = groupTokenChecker