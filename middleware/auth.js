const express = require("express");
const jwt = require("jsonwebtoken");
const config = require("config");

const requireAuth = (req, res, next) => {
	// get token from header
	const token = req.header("x-auth-token");

	// check if no token
	if (!token) {
		return res.status(401).json({ msg: "No token, authorisation failed!" });
	}

	// verify token
	try {
		const decodedToken = jwt.verify(token, config.get("jwtToken"));

		req.user = decodedToken.user;

		next();
	} catch (error) {
		res.status(401).json({ msg: "Token is invalid" });
	}
};

module.exports = requireAuth;
