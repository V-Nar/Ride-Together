const router = require("express").Router();
const { json } = require("express");
const User = require("../models/User.model");
const bcrypt = require("bcryptjs");
const {
  isAuthenticated,
  isAdmin,
  isAdminOrPromoter,
} = require("../middleware/middleware");
const Attendees = require("../models/attendees.model");
const Event = require("../models/Event.model");

/**
 * All routes are prefixed with /api/user
 */

/**
 * ACCOUNT MANAGEMENT
 */

// update user profile
router.patch("/:id", isAuthenticated, async (req, res, next) => {
  try {
    const { id } = req.user;
    const { password, level } = req.body;
    // encrypt password for security reason
    const hashedPassword = bcrypt.hashSync(password);
    const updateCharacter = await User.findByIdAndUpdate(
      id,
      { password: hashedPassword, level },
      {
        new: true,
      }
    );
    res.status("201").json(updateCharacter);
  } catch (error) {
    next("error");
  }
});

// delete user profile
router.delete("/:id", isAuthenticated, async (req, res, next) => {
  try {
    if (req.user.role === "admin" || req.user.id === req.params.id) {
      await User.findByIdAndDelete(req.params.id);
      return res.status("201").send(`Character deleted : ${req.params.id}`);
    }

    res.sendStatus(301).json({ message: `Account deleted!` }); // do some stuff
  } catch (error) {
    next(error);
  }
});

//get all joined event list
router.get("/joined", isAuthenticated, async (req, res, next) => {
  try {
    const myJoinedEvents = await Attendees.find({
      user: req.user.id,
    }).populate({
      path: "event",
      match: { isFinished: false },
      select: "title city date -_id",
    });
    res.status(202).json(myJoinedEvents);
  } catch (error) {
    next(error);
  }
});

//get all promoted event list
router.get("/promoted", isAuthenticated, async (req, res, next) => {
  try {
    const myPromotedEvents = await Event.find(
      { promoter: req.user.id },
      "title date city"
    );
    res.status(202).json(myPromotedEvents);
  } catch (error) {
    next(error);
  }
});

/**
 * USERS INTERACTTIONS
 */

//Display all signed up users
router.get("/", async (req, res, next) => {
  try {
    const allUser = await User.find({}, "username level");
    res.status("200").json(allUser);
  } catch (error) {
    next(error);
  }
});

//Display one user profile
router.get("/:id", async (req, res, next) => {
  const { id } = req.params;
  try {
    const thisUser = await User.findById(id, "username level");
    res.status("200").json(thisUser);
  } catch (error) {
    next(error);
  }
});

module.exports = router;
