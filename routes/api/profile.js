const express = require("express");
const app = express.Router();
const mongoose = require("mongoose");
const auth = require("../../middleware/auth");
const { check, validationResult } = require("express-validator");
const request = require("request");
const config = require("config");
const axios = require("axios");

// Load Profile Model
const Profile = require("../../models/Profile");
// Load User Model
const User = require("../../models/User");

// @route   GET api/profile/test
// @desc    Tests profile route
// @access  Public
app.get("/test", (req, res) => res.json({ msg: "Profile Works" }));

// @route   GET api/profile/me
// @desc    Get current users profile
// @access  Private
app.get("/me", auth, async (req, res) => {
	try {
		const profile = await Profile.findOne({ user: req.user.id }).populate(
			"user",
			["name", "avatar"]
		);

		if (!profile) {
			return res.status(400).json({ msg: "There is no profile for this user" });
		}
		res.json(profile);
	} catch (err) {
		console.err(err.message);
		res.status(500).send("Server error");
	}
});

// @route   GET api/profile
// @desc    Get all profiles
// @access  Public
app.get("/", async (req, res) => {
	try {
		const profiles = await Profile.find().populate("user", ["name", "avatar"]);
		res.json(profiles);
	} catch (err) {
		console.error(err.message);
		res.status(500).send("Server error");
	}
});

// @route   GET api/profile/handle/:handle
// @desc    Get profile by handle
// @access  Public

app.get("/handle/:handle", (req, res) => {
	const errors = {};

	Profile.findOne({ handle: req.params.handle })
		.populate("user", ["name", "avatar"])
		.then((profile) => {
			if (!profile) {
				errors.noprofile = "There is no profile for this user";
				res.status(404).json(errors);
			}

			res.json(profile);
		})
		.catch((err) => res.status(404).json(err));
});

// @route   GET api/profile/user/:user_id
// @desc    Get profile by user ID
// @access  Public

app.get("/user/:user_id", async (req, res) => {
	try {
		const profile = await Profile.findOne({
			user: req.params.user_id,
		}).populate("user", ["name", "avatar"]);

		if (!profile) {
			return res.status(400).send({ msg: "Profile not found" });
		}

		res.json(profile);
	} catch (err) {
		console.error(err.message);
		if (err.kind === "ObjectId") {
			return res.status(400).send({ msg: "Profile not found" });
		}
		res.status(500).send("Server error");
	}
});

// // @route   POST api/profile
// // @desc    Create or edit user profile
// // @access  Private
app.post(
	"/",
	[
		auth,
		[
			check("status", "Status is required").not().isEmpty(),
			check("skills", "Skills is required").not().isEmpty(),
		],
	],
	async (req, res) => {
		const errors = validationResult(req);

		if (!errors.isEmpty()) {
			return res.status(400).json({ errors: errors.array() });
		}

		const {
			company,
			website,
			location,
			bio,
			status,
			githubusername,
			skills,
			youtube,
			facebook,
			twitter,
			instagram,
			linkedin,
		} = req.body;

		// Get fields
		const profileFields = {};
		profileFields.user = req.user.id;
		if (company) profileFields.company = company;
		if (website) profileFields.website = website;
		if (location) profileFields.location = location;
		if (bio) profileFields.bio = bio;
		if (status) profileFields.status = status;
		if (githubusername) profileFields.githubusername = githubusername;
		// Skills - Spilt into array
		if (skills !== "undefined") {
			profileFields.skills = skills
				.toString()
				.split(",")
				.map((skill) => skill.trim());
		}

		// Social
		profileFields.social = {};
		if (youtube) profileFields.social.youtube = youtube;
		if (twitter) profileFields.social.twitter = twitter;
		if (facebook) profileFields.social.facebook = facebook;
		if (linkedin) profileFields.social.linkedin = linkedin;
		if (instagram) profileFields.social.instagram = instagram;

		try {
			let profile = await Profile.findOne({ user: req.user.id });

			if (profile) {
				profile = await Profile.findOneAndUpdate(
					{ user: req.user.id },
					{ $set: profileFields },
					{ new: true }
				);
				return res.json(profile);
			}
			// create profile
			profile = new Profile(profileFields);

			await profile.save();
			res.json(profile);
		} catch (error) {
			console.error(err.message);
		}
	}
);

// // @route   PUT api/profile/experience
// // @desc    Add experience to profile
// // @access  Private
app.put(
	"/experience",
	[
		auth,
		[
			check("title", "title is required").not().isEmpty(),
			check("company", "company is required").not().isEmpty(),
			check("from", "from date is required").not().isEmpty(),
		],
	],
	async (req, res) => {
		const errors = validationResult(req);
		if (!errors.isEmpty()) {
			return res.status(400).json({ errors: errors.array() });
		}

		const { title, company, location, from, to, current, description } =
			req.body;

		const newExp = {
			title,
			company,
			location,
			from,
			to,
			current,
			description,
		};

		try {
			const profile = await Profile.findOne({ user: req.user.id });
			// Add to exp array
			profile.experience.unshift(newExp);

			await profile.save();
			res.json(profile);
		} catch (error) {
			console.error(error.message);
			res.status(500).send("Server error");
		}
	}
);

// // @route   POST api/profile/education
// // @desc    Add education to profile
// // @access  Private
app.put(
	"/education",
	[
		auth,
		[
			check("school", "school is required").not().isEmpty(),
			check("fieldOfStudy", "Field of study is required").not().isEmpty(),
			check("from", "from date is required").not().isEmpty(),
		],
	],
	async (req, res) => {
		const errors = validationResult(req);
		if (!errors.isEmpty()) {
			return res.status(400).json({ errors: errors.array() });
		}

		const { school, course, fieldOfStudy, from, to, current, description } =
			req.body;

		const newEdu = {
			school,
			course,
			fieldOfStudy,
			from,
			to,
			current,
			description,
		};

		try {
			const profile = await Profile.findOne({ user: req.user.id });
			// Add to exp array
			profile.education.unshift(newEdu);

			await profile.save();
			res.json(profile);
		} catch (error) {
			console.error(error.message);
			res.status(500).send("Server error");
		}
	}
);

// // @route   DELETE api/profile/experience/:exp_id
// // @desc    Delete experience from profile
// // @access  Private
app.delete("/experience/:exp_id", auth, async (req, res) => {
	try {
		const profile = await Profile.findOne({ user: req.user.id });

		// Get remove index
		const removeIndex = profile.experience
			.map((item) => item.id)
			.indexOf(req.params.exp_id);

		// Splice out of array
		profile.experience.splice(removeIndex, 1);

		// Save
		await profile.save();
		res.json(profile);
	} catch (error) {
		console.error(error.message);
		res.status(500).send("Server error");
	}
});

// // @route   DELETE api/profile/education/:edu_id
// // @desc    Delete education from profile
// // @access  Private
app.delete("/education/:edu_id", auth, async (req, res) => {
	try {
		const profile = await Profile.findOne({ user: req.user.id });

		// Get remove index
		const removeIndex = profile.education
			.map((item) => item.id)
			.indexOf(req.params.edu_id);

		// Splice out of array
		profile.education.splice(removeIndex, 1);

		// Save
		await profile.save();
		res.json(profile);
	} catch (error) {
		console.error(error.message);
		res.status(500).send("Server error");
	}
});

// // @route   DELETE api/profile
// // @desc    Delete user, profile & posts
// // @access  Private
app.delete("/", auth, async (req, res) => {
	try {
		// remove profile
		const profile = await Profile.findOneAndRemove({ user: req.user.id });

		await User.findOneAndRemove({ _id: req.user.id });
		res.json({ msg: "User deleted" });
	} catch (error) {
		console.error(error.message);
	}
});

// // @route   GET api/profile/github/:username
// // @desc    Get user profiles repos from Github
// // @access  Public

app.get("/github/:username", async (req, res) => {
	try {
		const options = {
			uri: `https://api.github.com/users/${
				req.params.username
			}/repos?per_page=5&sort=created:asc&client_id=${config.get(
				"githubClientId"
			)}&client_secret=${config.get("githubSecret")} `,
			method: "GET",
			headers: { "user-agent": "node-js" },
		};

		request(options, (error, response, body) => {
			if (error) console.error(error);
			if (response.statusCode !== 200) {
				res.status(404).json({ mesg: "No Github profile was found" });
			}
			res.json(JSON.parse(body));
		});
	} catch (error) {
		console.error(error.meesage);
		res.status(500).send("Server error");
	}
});

module.exports = app;
