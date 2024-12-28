const { Router } = require("express");
const multer = require("multer");
const path = require("path");
const fs = require("fs");

const Blog = require("../models/blog");
const Comment = require("../models/comment");

const router = Router();

// Ensure the uploads directory exists
const uploadDir = path.resolve("./public/uploads/");
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

// Configure multer for file uploads
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, uploadDir);
    },
    filename: function (req, file, cb) {
        const uniqueName = `${Date.now()}-${file.originalname}`;
        cb(null, uniqueName);
    },
});

const upload = multer({ storage });

// Routes

// Render the "Add New Blog" page
router.get("/add-new", (req, res) => {
    return res.render("addBlog", {
        user: req.user,
    });
});

// Render a specific blog and its comments
router.get("/:id", async (req, res) => {
    try {
        const blog = await Blog.findById(req.params.id).populate("createdBy");
        const comments = await Comment.find({ blogId: req.params.id }).populate(
            "createdBy"
        );

        return res.render("blog", {
            user: req.user,
            blog,
            comments,
        });
    } catch (error) {
        console.error("Error fetching blog or comments:", error);
        return res.status(500).send("Internal Server Error");
    }
});

// Add a comment to a specific blog
router.post("/comment/:blogId", async (req, res) => {
    try {
        await Comment.create({
            content: req.body.content,
            blogId: req.params.blogId,
            createdBy: req.user._id,
        });
        return res.redirect(`/blog/${req.params.blogId}`);
    } catch (error) {
        console.error("Error adding comment:", error);
        return res.status(500).send("Internal Server Error");
    }
});

// Create a new blog
router.post("/", upload.single("coverImage"), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).send("Cover image is required.");
        }

        const { title, body } = req.body;

        const blog = await Blog.create({
            body,
            title,
            createdBy: req.user._id,
            coverImageURL: `/uploads/${req.file.filename}`,
        });

        return res.redirect(`/blog/${blog._id}`);
    } catch (error) {
        console.error("Error creating blog:", error);
        return res.status(500).send("Internal Server Error");
    }
});

module.exports = router;
