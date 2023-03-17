const express = require("express");
const bodyParser = require("body-parser");
const db = require("./models");
// const Sequelize = require('sequelize');

const app = express();

app.use(bodyParser.json());
app.use(express.static(__dirname + "/static"));

app.get("/api/players", (req, res) => {
  return db.Players.findAll()
    .then((players) => res.send(players))
    .catch((err) => {
      console.log("There was an error querying players", JSON.stringify(err));
      return res.send(err);
    });
});

app.post("/api/players", async (req, res) => {
  const { name, position, skills } = req.body;

  try {
    const result = await db.sequelize.transaction(async (t) => {
      const createdPlayer = await db.Players.create(
        {
          name,
          position,
        },
        { transaction: t }
      );

      const createdSkills = [];
      for (const skill of skills) {
        const createdSkill = await db.Skills.create(
          {
            playerId: createdPlayer.id,
            skill: skill.skill,
            value: skill.value,
          },
          { transaction: t }
        );
        createdSkills.push(createdSkill);
      }

      return {
        ...createdPlayer,
        skills: createdSkills,
      };
    });

    return res.send(result);
  } catch (error) {
    // If the execution reaches this line, an error occurred.
    // The transaction has already been rolled back automatically by Sequelize!
    console.log(
      "***There was an error creating a player",
      JSON.stringify(error)
    );
    return res.status(400).send(error);
  }
});

// app.put("/api/players/:id", (req, res) => {
//   const id = parseInt(req.params.id);
//   const { firstName, lastName, phone } = req.body;
//   // TODO: find and update player by id
// });

app.listen(3000, () => {
  console.log("Server is up on port 3000");
});
