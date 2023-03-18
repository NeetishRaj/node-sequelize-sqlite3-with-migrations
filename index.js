const express = require("express");
const bodyParser = require("body-parser");
const jwt = require("jsonwebtoken");

const db = require("./models");
const {
  get_team_process_query,
  is_position_count_valid,
} = require("./Queries/sql_queries");

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
  const token = jwt.sign(
    { user: "Authorised User for deletion" },
    SECRET_PASSWORD,
    {
      expiresIn: 86400, // expires in 24 hours
    }
  );

  res.status(200).send({ token });
});

app.post("/api/team/process", async (req, res) => {
  const teamReq = req.body;
  try {
    let players = await db.sequelize.query(get_team_process_query(teamReq));
    players = players[0];
    const result = [];

    for (let i = 0; i < players.length; i++) {
      let playerSkills = await db.Skills.findAll({
        where: { playerId: players[i].id },
      });
      playerSkills = playerSkills.map(x => x.dataValues);
      result.push({
        ...players[i],
        playerSkills,
      });
    }

    if (!is_position_count_valid(result, teamReq)){
      return res.status(400).send("Players are missing for some positions");
    } 
    let finalResult = [];

    for (const tr of teamReq) {
      const trPlayers = result
      .filter(x => x.position === tr.position)
      .sort((a, b) => {
        const a_skill = a.playerSkills.find(x => x.skill === tr.mainSkill)
        const b_skill = a.playerSkills.find(x => x.skill === tr.mainSkill)

        if(a_skill && b_skill) {
          return b_skill.value - a_skill.value;
        } else if(a_skill && !b_skill) {
          return 1;
        } else if(!a_skill && b_skill) {
          return -1;
        } else {
          Array.prototype.max = function() {
            return Math.max.apply(null, this);
          };

          const a_max_skill = a.playerSkills.map(x => x.value).max();
          const b_max_skill = b.playerSkills.map(x => x.value).max();

          return b_max_skill - a_max_skill;
        }
      })
      .slice(0, tr.numberOfPlayers);

      finalResult = [...finalResult, ...trPlayers];    }
    
    return res.status(200).send(finalResult);
  } catch (error) {
    console.log(
      "Error fetching team process details\n" + JSON.stringify(error)
    );
    return res.status(500).send(error);
  }
});

app.listen(3000, () => {
  console.log("Server is up on port 3000");
});
