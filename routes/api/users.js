const express = require("express");
const app = express.Router();
const { check, validationResult } = require("express-validator");
const User = require("../../models/User");
const gravatar = require("gravatar");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const config = require("config");

// @route POST api/users
// @desc register user
// @access Public

app.post(
	"/",
	[
		check("name", "Name is required").not().isEmpty(),
		check("email", "Please include a valid email").isEmail(),
		check(
			"password",
			"Please enter a password with 8 or more characters"
		).isLength({ min: 8 }),
	],
	async function (req, res) {
		const errors = validationResult(req);
		// if there are errors
		if (!errors.isEmpty()) {
			return res.status(400).json({ errors: errors.array() });
		}
		const { name, email, password } = req.body;

		try {
			// does user exist
			let user = await User.findOne({ email });

			if (user) {
				return res
					.status(400)
					.json({ errors: [{ msg: "User already exists" }] });
			}
			// get users gravatar
			const avatar = gravatar.url(email, {
				s: "200",
				r: "pg",
				d: "mm",
			});

			//  creating new instance
			user = new User({
				name,
				email,
				avatar,
				password,
			});
			// Encrypt password
			const salt = await bcrypt.genSalt(12);

			user.password = await bcrypt.hash(password, salt);

			// anything that returns a promise, use await infront of it

			await user.save();

			// return jwt
			const payload = {
				user: {
					id: user.id,
				},
			};

			jwt.sign(
				payload,
				config.get("jwtToken"),
				{ expiresIn: 36000 },
				(err, token) => {
					if (err) throw err;
					res.json({ token });
				}
			);
		} catch (error) {
			console.log(error);
			res.status(500).send("Server error");
		}
	}
);

module.exports = app;
