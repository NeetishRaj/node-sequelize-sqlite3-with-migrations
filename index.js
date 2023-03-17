const express = require("express");
const bodyParser = require("body-parser");
const jwt = require("jsonwebtoken");

const db = require("./models");

const app = express();
const SECRET_PASSWORD = "somethingsecret";

app.use(bodyParser.json());
app.use(express.static(__dirname + "/static"));

app.get("/api/player", async (req, res) => {
  try {
    const players = await db.Players.findAll();
    const result = [];

    for (let i = 0; i < players.length; i++) {
      const playerSkills = await db.Skills.findAll({
        where: { playerId: players[i].id },
      });

      result.push({
        ...players[i].dataValues,
        playerSkills,
      });
    }

    res.send(result);
  } catch (error) {
    console.log("There was an error querying players", JSON.stringify(error));
    return res.send(err);
  }
});

app.get("/api/player/:id", async (req, res) => {
  const playerId = parseInt(req.params.id);

  const player = await db.Players.findByPk(playerId);

  if (!player) {
    return res.status(404).send("Player not found");
  }

  const skills = await db.Skills.findAll({ where: { playerId } });

  return res.send({
    ...player.dataValues,
    skills: [...skills],
  });
});

app.post("/api/player", async (req, res) => {
  const { name, position, playerSkills } = req.body;

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
      for (const skill of playerSkills) {
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
        ...createdPlayer.dataValues,
        playerSkills: createdSkills,
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

app.put("/api/player/:playerId", async (req, res) => {
  const playerId = parseInt(req.params.playerId);
  const { name, position, playerSkills } = req.body;

  try {
    const result = await db.sequelize.transaction(async (t) => {
      const updatedPlayer = await db.Players.update(
        {
          name,
          position,
        },
        { where: { id: playerId } },
        { transaction: t }
      );

      const deletedSkills = await db.Skills.destroy({
        where: { playerId },
      });

      const createdSkills = [];
      for (const skill of playerSkills) {
        const createdSkill = await db.Skills.create(
          {
            playerId: playerId,
            skill: skill.skill,
            value: skill.value,
          },
          { transaction: t }
        );
        createdSkills.push(createdSkill);
      }

      const player = await db.Players.findByPk(playerId);

      return {
        ...player.dataValues,
        playerSkills: createdSkills,
      };
    });

    return res.send(result);
  } catch (error) {
    console.log(
      "***There was an error updating a player",
      JSON.stringify(error)
    );
    return res.status(400).send(error);
  }
});

app.delete("/api/player/:playerId", async (req, res) => {
  const token = req.headers["authorization"];
  if (!token)
    return res.status(401).send({
      message: "Authorization Token not found",
    });

  jwt.verify(token.split(/\s/)[1], SECRET_PASSWORD, function (err, decoded) {
    if (err)
      return res.status(500).send({
        message: "Invalid Authorization Token",
      });
  });
  const playerId = parseInt(req.params.playerId);

  try {
    const result = await db.sequelize.transaction(async (t) => {
      const deletedPlayer = await db.Players.destroy({
        where: { id: playerId },
      });

      const deletedSkills = await db.Skills.destroy({
        where: { playerId },
      });

      return {
        ...deletedPlayer,
        ...deletedSkills,
      };
    });

    return res.send(result);
  } catch (error) {
    console.log(
      "***There was an error deleting a player",
      JSON.stringify(error)
    );
    return res.status(400).send(error);
  }
});

app.post("/api/auth", (req, res) => {
  // var hashedPassword = bcrypt.hashSync(req.body.password, 8);
  var token = jwt.sign(
    { user: "Authorised User for deletion" },
    SECRET_PASSWORD,
    {
      expiresIn: 86400, // expires in 24 hours
    }
  );

  res.status(200).send({ token });
});

app.listen(3000, () => {
  console.log("Server is up on port 3000");
});
