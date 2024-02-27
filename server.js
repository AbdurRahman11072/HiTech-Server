const express = require("express");
const app = express();
const jwt = require("jsonwebtoken"); //npm i jsonwebtoken
const port = process.env.PORT || 5000;
const cors = require("cors");
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const cookieParser = require("cookie-parser");

//middlewartes
require("dotenv").config();
// app.use(
//   cors({
//     origin: ["http://localhost:5173"],
//     credentials: true,
//   })
// );

app.use(express.json());
app.use(cookieParser());
app.use(
  cors({
    origin: ["http://localhost:5173"],
    credentials: true,
  })
);

// const logger = async (req, res, next) => {
//   console.log("called:", req.hostname, req.originalUrl);
//   next();
// };
const uri = process.env.URI;
// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

//Secret
//ACcess Token =  secret + userInformation
//

async function test() {
  try {
    client.connect();
     client.db("admin").command({ ping: 1 });
    console.log(
      "Pinged your deployment. You successfully connected to MongoDB!"
    );
  } finally {
    // await client.close();
  }
}
test().catch(console.dir);

//jwt middleWare
const verify = async (req, res, next) => {
  //Coockies ache kina check koro
  const token = req.cookies?.token;
  console.log({ token });
  if (!token) {
    res.status(401).send({ status: "unAuthorized Access", code: "401" });
    return;
  }
  jwt.verify(token, process.env.SECRET, (error, decode) => {
    if (error) {
      res.status(401).send({ status: "unAuthorized Access", code: "401" });
    } else {
      //   console.log(decode);
      req.decode = decode;
    }
  });
  next();
};

// const verifyToken = async (req, res, next) => {
//   const token = req.cookies?.token;
//   if (!token) {
//     return res.status(401).send({ message: "unauthorized access" });
//   }
//   jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, decoded) => {
//     if (err) {
//       return res.status(401).send({ message: "unauthorized access" });
//     }
//     req.user = decoded;
//     next();
//   });
// };

//databases
const database = client.db("chef-notes-db");
//collections
const categoriesCollection = database.collection("categories");
const recipieCollection = database.collection("recipies");
const kichenCollection = database.collection("kitchen");

//jwt
// app.post("/jwt", logger, async (req, res) => {
//   const user = req.body;
//   console.log(user);

//   const token = jwt.sign(user, process.env.SECRET, {
//     expiresIn: "1h",
//   });
//   const threeDaysInMilliseconds = 3 * 24 * 60 * 60 * 1000;

//   const expirationDate = new Date(Date.now() + threeDaysInMilliseconds);

//   res
//     .cookie("token", token, {
//       httpOnly: true,
//       secure: false,
//       expires: expirationDate,
//     })
//     .send({ success: true, token });
// });

app.post("/jwt", async (req, res) => {
  const body = req.body;
  //   jwt.sign("payload", "secretKey", "expireInfo");
  // user: abc@gmail.com
  const token = jwt.sign(body, process.env.SECRET, { expiresIn: "10h" });
  const expirationDate = new Date(); // Create a new Date object
  expirationDate.setDate(expirationDate.getDate() + 7); // Set the expiration date to 7 days from the current date
  res
    .cookie("token", token, {
      httpOnly: true,
      secure: false,
      expires: expirationDate,
    })
    .send({ msg: "Succeed" });

  //   res.send({ body, token });
});

//get-Api-Start

app.get("/", (req, res) => {
  res.send({ status: "Server running ", code: "200" });
});

//Get::All Categories
app.get("/categories", async (req, res) => {
  try {
    const result = await categoriesCollection.find().toArray();
    res.send(result);
  } catch (error) {
    console.log(error);
  }
});

//Get::All Recipies
app.get("/recipies", async (req, res) => {
  try {
    const projection = {
      // Include propertyName1
      strInstructions: 0,
      strYoutube: 0, // Include propertyName2
      strTags: 0,
      strTheme: 0, // Exclude the _id field
    };
    const result = await recipieCollection.find().project(projection).toArray();

    res.send(result);
  } catch (error) {
    console.log(error);
  }
});

//Get:: Recipies by Category
app.get("/recipies/:category", async (req, res) => {
  try {
    const foods = await recipieCollection
      .find({ strCategory: { $regex: req.params.category, $options: "i" } })
      .toArray();

    const categoryInfo = await categoriesCollection.findOne({
      strCategory: { $regex: req.params.category, $options: "i" },
    });

    res.send({ categoryInfo, foods });
  } catch (error) {
    console.log(error);
  }
});

//Get:: Recipies by ID
app.get("/recipie/:id", verify, async (req, res) => {
  console.log(req.decode);

  try {
    const foods = await recipieCollection.findOne({
      _id: new ObjectId(req.params.id),
    });

    console.log(foods);

    res.send(foods);
  } catch (error) {
    console.log(error);
  }
});

app.get("/cart", verify, async (req, res) => {
  try {
    const email = req.query?.email;
    if (!email) {
      return res.send([]);
    }

    const result = await kichenCollection.find({ email }).toArray();
    res.send(result);
  } catch (error) {
    console.log(error);
  }
});

//post Method::Started

//post:: Add recipies
app.post("/recipie", async (req, res) => {
  try {
    const body = req.body;
    const result = await recipieCollection.insertOne(body);
    console.log(result);
    res.send(result);
  } catch (error) {
    console.log(error);
    res.send(error);
  }
});

//post::user while Register

//Post::AddToKitchen
app.post("/add-to-kitchen", verify, async (req, res) => {
  try {
    // console.log(req.body);
    const kitchen = req.body;
    const isAdded = await kichenCollection.findOne({
      recipieId: kitchen.recipieId,
      email: kitchen.email,
    });
    if (isAdded) {
      return res.send({
        acknowledged: true,
        insertedId: isAdded._id,
        status: "Allready Added",
      });
    }
    const result = await kichenCollection.insertOne(kitchen);
    res.send({ ...result, status: " Added" });
  } catch (err) {
    console.log(err);
  }
});

//update Method Started
app.put("/recipie/:id", verify, async (req, res) => {
  const id = { _id: new ObjectId(req.params.id) };
  const body = req.body;
  const updatedData = {
    $set: {
      ...body,
    },
  };
  const option = { upsert: true };
  const result = await recipieCollection.updateOne(id, updatedData, option);
  console.log(body);
  res.send(result);
});

//Delete Method::Started
//delete a recipie
app.delete("/recipie/:id", verify, async (req, res) => {
  try {
    const id = req.params.id;
    const query = { _id: new ObjectId(id) };
    const result = await recipieCollection.deleteOne(query);

    res.send(result);
  } catch (err) {
    console.log(err);
  }
});
//delete form cart
app.delete("/cart/:id", async (req, res) => {
  try {
    const id = req.params.id;
    const query = { _id: new ObjectId(id) };
    const result = await kichenCollection.deleteOne(query);
    res.send(result);
  } catch (err) {
    console.log(err);
  }
});

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});
