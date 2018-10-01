const helper = require("../utilities/functions");
const User = require("../Models/User");
const passport = require("passport");
const Member = require("../Models/Member");
const Intern = require("../Models/Intern");
const jwt = require("jwt-simple");
const keys = require("../config/keys");
require("../services/passport");

function tokenForUser(user) {
  const timestamp = new Date().getTime();
  return jwt.encode({ sub: user.id, iat: timestamp }, keys.tokenSecret);
}

const requireLogin = passport.authenticate("local", { session: false });

module.exports = app => {
  app.post("/user/register", helper.checkBody, async (req, res) => {
    const possibleNewUser = req.body.user;
    try {
      const existingUser = await User.findOne({
        $or: [
          { email: possibleNewUser.email },
          { typeId: possibleNewUser.typeId }
        ]
      });
      if (existingUser) {
        return res.status(422).send("User Already Exits");
      }
      let modelOfUser;
      let attributeToCheck;
      switch (possibleNewUser.typeOfUser) {
        case "Member":
          modelOfUser = Member;
          attributeToCheck = "memberId";
          break;
        case "Intern":
          modelOfUser = Intern;
          attributeToCheck = "internId";
          break;
        default:
          return res.json({ error: "Invalid user type" });
      }
      const idMatched = await modelOfUser.findOne({
        [attributeToCheck]: possibleNewUser.typeId
      });
      if (!idMatched) {
        return res.json({ error: "Invalid id" });
      }
      const newUser = new User(possibleNewUser);
      await newUser.save();
      res.json({ token: tokenForUser(newUser) });
    } catch (err) {
      console.log(err);
      res.send("An error occured. Please try again later.");
    }
  });

  app.post("/user/login", helper.checkBody, requireLogin, async (req, res) => {
    console.log(req.user);
    res.json({ token: tokenForUser(req.user) });
  });
};
