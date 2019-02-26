const express = require("express");
const logger = require("morgan");
const mongoose = require("mongoose");

// Require axios and cheerio to scrape website and use it's data
const axios = require("axios");
const cheerio = require("cheerio");

// Require models
const db = require("./models");

const PORT = 3000;

const app = express();

app.use(logger("dev"));

app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static("public"));

// Connect to mongo databse
mongoose.connect("mongodb://localhost/newsScraper", { useNewUrlParser: true });


// Route to scrape website for data
app.get("/scrape", function (req, res) {
  axios.get("http://www.echojs.com/").then(function (response) {
    const $ = cheerio.load(response.data);
    const articleArr = [];
    $("article h2").each(function (i, element) {
      const result = {};

      result.title = $(this)
        .children("a")
        .text();
      result.link = $(this)
        .children("a")
        .attr("href");

      console.log(result.title)
      console.log(result.link)
      articleArr.push(result);
     
    });

    db.Article.create(articleArr)
      .then(() => res.send("Scrape Complete"))
      .catch(err => {
        console.log(err);
        res.json(err);
      })

  });
});

// Get route to retrieve data from db
app.get("/articles", function (req, res) {
  db.Article.find({})
    .then(function (dbArticle) {
      res.json(dbArticle);
    })
    .catch(function (err) {
      res.json(err);
    });
});

// Route for grabbing a specific article by id and populate it with it's note
app.get("/articles/:id", function (req, res) {
  db.Article.findOne({ _id: req.params.id })
    .populate("note")
    .then(function (dbArticle) {
      res.json(dbArticle);
    })
    .catch(function (err) {
      res.json(err);
    });
});

// Route for saving/updating an Article's associated Note
app.post("/articles/:id", function (req, res) {
  db.Note.create(req.body)
    .then(function (dbNote) {
      return db.Article.findOneAndUpdate({ _id: req.params.id }, { note: dbNote._id }, { new: true });
    })
    .then(function (dbArticle) {
      res.json(dbArticle);
    })
    .catch(function (err) {
      res.json(err);
    });
});

// Start the server
app.listen(PORT, function () {
  console.log("App running on port " + PORT + "!");
});
