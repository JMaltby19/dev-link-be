const express = require("express");
const { check, validationResult } = require("express-validator");
const auth = require("../../middleware/auth");
const User = require("../../models/User");
const Profile = require("../../models/Profile");
const Post = require("../../models/Posts");
// const Posts = require("../../models/Posts");

const app = express.Router();

// @route GET api/posts
// @desc Test route
// @access Public

// app.get("/", (req, res) => res.send("posts route"));

// @route POST api/posts
// @desc Create a post
// @access Private

app.post(
	"/",
	[auth, [check("text", "Text is required").not().isEmpty()]],
	async (req, res) => {
		const errors = validationResult(req);
		if (!errors.isEmpty()) {
			return res.status(400).json({ errors: errors.array() });
		}

		try {
			const user = await User.findById(req.user.id).select("-password");

			const newPost = new Post({
				text: req.body.text,
				name: user.name,
				avatar: user.avatar,
				user: req.user.id,
			});

			const post = await newPost.save();
			res.json(post);
		} catch (error) {
			console.error(error.message);
			res.status(500).send("Server error");
		}
	}
);

// @route GET api/posts
// @desc Get all posts
// @access Private

app.get("/", auth, async (req, res) => {
	try {
		const posts = await Post.find().sort({ date: -1 });
		res.json(posts);
	} catch (error) {
		console.error(error.message);
		res.status(500).send("Server error");
	}
});

// @route GET api/posts/:id
// @desc Get posts by id
// @access Private

app.get("/:id", auth, async (req, res) => {
	try {
		const post = await Post.findById(req.params.id);

		if (!post) {
			return res.status(404).json({ msg: "Post not found" });
		}

		res.json(post);
	} catch (error) {
		console.error(error.message);
		if (error.kind === "ObjectId") {
			return res.status(404).json({ msg: "Post not found" });
		}
		res.status(500).send("Server error");
	}
});

// @route DELETE api/posts/:id
// @desc Delete a post
// @access Private

app.delete("/:id", auth, async (req, res) => {
	try {
		const post = await Post.findById(req.params.id);

		if (!post) {
			return res.status(404).json({ msg: "Post not found" });
		}

		// check if it is the same user
		if (post.user.toString() !== req.user.id) {
			return res.status(401).json({ msg: "User is not authorised" });
		}

		await post.remove();

		res.json({ msg: "Post removed" });
	} catch (error) {
		console.error(error.message);
		if (error.kind === "ObjectId") {
			return res.status(404).json({ msg: "Post not found" });
		}
		res.status(500).send("Server error");
	}
});

// @route PUT api/posts/like/:id
// @desc Like a post
// @access Private

app.put("/like/:id", auth, async (req, res) => {
	try {
		const post = await Post.findById(req.params.id);

		// check if post has already been liked
		if (
			post.likes.filter((like) => like.user.toString() === req.user.id).length >
			0
		) {
			return res.status(400).json({ msg: "Post already liked" });
		}

		post.likes.unshift({ user: req.user.id });

		await post.save();
		res.json(post.likes);
	} catch (error) {
		console.error(error.message);
		res.status(500).send("Server error");
	}
});

// @route PUT api/posts/unlike/:id
// @desc Unlike a post
// @access Private

app.put("/unlike/:id", auth, async (req, res) => {
	try {
		const post = await Post.findById(req.params.id);

		// check if post has already been liked
		if (
			post.likes.filter((like) => like.user.toString() === req.user.id)
				.length === 0
		) {
			return res.status(400).json({ msg: "Post has not been liked" });
		}

		// Get remove index
		const removeIndex = post.likes
			.map((like) => like.user.toString())
			.indexOf(req.user.id);

		post.likes.splice(removeIndex, 1);

		await post.save();
		res.json(post.likes);
	} catch (error) {
		console.error(error.message);
		res.status(500).send("Server error");
	}
});

// @route POST api/comment/:id
// @desc Comment on a post
// @access Private

app.post(
	"/comment/:id",
	[auth, [check("text", "Text is required").not().isEmpty()]],
	async (req, res) => {
		const errors = validationResult(req);
		if (!errors.isEmpty()) {
			return res.status(400).json({ errors: errors.array() });
		}

		try {
			const user = await User.findById(req.user.id).select("-password");
			const post = await Post.findById(req.params.id);

			const newComment = {
				text: req.body.text,
				name: user.name,
				avatar: user.avatar,
				user: req.user.id,
			};

			post.comments.unshift(newComment);

			await post.save();
			res.json(post.comments);
		} catch (error) {
			console.error(error.message);
			res.status(500).send("Server error");
		}
	}
);

// @route DELETE api/comment/:id/:comment_id
// @desc Delete a comment
// @access Private

app.delete("/comment/:id/:comment_id", auth, async (req, res) => {
	const errors = validationResult(req);
	if (!errors.isEmpty()) {
		return res.status(400).json({ errors: errors.array() });
	}

	try {
		const post = await Post.findById(req.params.id);

		// Pull out comment from post
		const comment = post.comments.find(
			(comment) => comment.id === req.params.comment_id
		);

		// Make sure comment exists
		if (!comment) {
			return res.status(404).json({ msg: "Comment does not exist" });
		}

		// check user
		if (comment.user.toString() !== req.user.id) {
			return res.status(401).json({ msg: "User not authorised" });
		}

		// Get remove index
		const removeIndex = post.comments
			.map((comment) => comment.user.toString())
			.indexOf(req.user.id);

		post.comments.splice(removeIndex, 1);

		await post.save();
		res.json(post.comments);
	} catch (error) {
		console.error(error.message);
		res.status(500).send("Server error");
	}
});

module.exports = app;
