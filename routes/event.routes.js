const router = require("express").Router();
const User = require("../models/User.model");
const Event = require("../models/Event.model");
const Attendees = require("../models/attendees.model");
const {
  isAuthenticated,
  isAdminOrPromoter,
} = require("../middleware/middleware");

/**
 * all routes are prefix by /api/event
 */

// event creation
router.post("/newEvent", isAuthenticated, async (req, res, next) => {
  const { title, date, address, city } = req.body;
  Date.now();
  try {
    const newEvent = await Event.create({
      title,
      date,
      address,
      city,
      promoter: req.user.id,
    });
    res.status(201).json({ newEvent });
  } catch (error) {
    next(error);
  }
});

// events search
router.get("/event-list", async (req, res, next) => {
  const city = req.query.city;
  try {
    if (city) {
      const cityEvents = await Event.find({ city, isFinished: false }, 'title date city');
      return res.status(302).json({ cityEvents });
    }
    res.status(302).json(await Event.find());
  } catch (error) {
    next(error);
  }
});

// display all details of an event
router.get("/:id/event-details", isAuthenticated, async (req, res, next) => {
  try {
    const listOfAttendees = await Attendees.find({
      event: req.params.id,
    }).populate({ path: "user", select: "username level email -_id" });
    res.status(202).send({
      "list of Attendees": listOfAttendees,
    });
  } catch (error) {
    next(error);
  }
});

// event update
router.patch(
  "/:id/update-event/",
  isAuthenticated,
  isAdminOrPromoter,
  async (req, res, next) => {
    const { title, date } = req.body;
    const { id } = req.params;
    try {
      await Event.findByIdAndUpdate(id, { title, date }, { new: true });
      res.status(202).json(await Event.findById(req.params.id));
    } catch (error) {
      next(error);
    }
  }
);

// close event manually
router.patch(
  "/:id",
  isAuthenticated,
  isAdminOrPromoter,
  async (req, res, next) => {
    try {
      await Event.findByIdAndUpdate(
        req.params.id,
        { isFinished: true },
        { new: true }
      );
      res.status(202).json({ message: `event has been closed!` });
    } catch (error) {
      next(error);
    }
  }
);

// cancel an event
router.delete(
  "/:id",
  isAuthenticated,
  isAdminOrPromoter,
  async (req, res, next) => {
  try {
    const idEvent = req.params.id;
    await Event.findByIdAndDelete(idEvent);
    await Attendees.deleteMany({ event: `${idEvent}`})
    res.status(301).send({ message: `Event deleted : ${idEvent}` });
  } catch (error) {
    next(error);
  }
});

// join an event
router.post("/:id/join", isAuthenticated, async (req, res, next) => {
  try {
    const joinEvent = await Attendees.findOneAndUpdate(
      {
        event: req.params.id,
        user: req.user.id,
      },
      {},
      { upsert: true }
    );
    res.status(202).json({ message: `Event joined!`});
  } catch (error) {
    next(error);
  }
});

// leave an event
router.delete("/:id/leave", isAuthenticated, async (req, res, next) => {
  try {
    await Attendees.findOneAndDelete({
      event: req.params.id,
      user: req.user.id,
    });
    res.status(202).send({
      message: `You are no longer taking part of this event : ${req.params.id}`,
    });
  } catch (error) {
    next(error);
  }
});


module.exports = router;
