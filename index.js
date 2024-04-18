require("dotenv").config();
const express = require("express");
const cors = require("cors");
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const jwt = require("jsonwebtoken");
const cookieParser = require("cookie-parser");
const app = express();
const port = process.env.PORT || 2000;


app.use(express.json());
// app.use(cors());
app.use(cookieParser());
app.use(
  cors({
    origin: ["http://localhost:5173", 
             "https://hitech-10215.web.app",
             "https://hitech-10215.firebaseapp.com"
            ],
    credentials: true,
  })
);

// conect mongodb 

const uri = "mongodb+srv://rahman:12345@cluster0.nxhbkwn.mongodb.net/?retryWrites=true&w=majority";

const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});
// mongodb connection techproduct

const productdata = client.db("techproduct").collection("product");
const review = client.db("techproduct").collection("review");
const report = client.db("techproduct").collection("report");
const usercontrol = client.db("techproduct").collection("usercontrol");
const productqueue = client.db("techproduct").collection("productqueue");
const rejectedproduct =  client.db("techproduct").collection("reject");
const feature =  client.db("techproduct").collection("feature");




// jwt 
  // Jwt
  app.post('/jwt', async(req, res)=>{
    try{
     const user = req.body
     const token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, {expiresIn: '1h'})
 
     res
     .cookie('token', token, {
       httpOnly: true,
       secure: process.env.NODE_ENV === 'production', // Set to true in production
       sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'strict', // Adjust based on your requirements
       // maxAge: // how much time the cookie will exist
   })
     .send({success: true})
    }
    catch(err){
     console.log(err);
        }
   });
 
   // middleware
 const verifyToken = async(req, res, next)=>{
   try{
     const token = req?.cookies?.token
   // console.log('value of token ', token);
   if(!token){
       return res.status(401).send({message: 'Not Authorized'})
   }
   jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, decoded) =>{
     if(err){
       // console.log(err);
       return res.status(401).send({message: 'Not Authorized'})
     }
     // console.log('value in the token', decoded);
     req.user = decoded
     next()
   })
 
   }
   catch(err){
     console.log(err);
   }
   
 }


 app.get("/", (req, res) => {
  res.send("Crud is running...");
});

// get all productdata 

app.get("/allproduct", async (req, res) =>{
  try {
    const cursor =productdata.find();
    const result = await cursor.toArray();
    res.send(result)
  } catch (error) {
 console.log(error);     
  }
});

// get productqueue, post productqueue, delete productqueue
app.get("/productqueue", async(req,res) => {
  try {
    const cursor =productqueue.find();
    const result = await cursor.toArray();
    res.send(result)
  } catch (error) {
 console.log(error);     
  }
});
app.post("/productqueue", async (req,res) => {
  try {
      const product = req.body;
      console.log(req.body);
      const result = await productqueue.insertOne(product)
      res.send(result)
  } catch (error) {
      console.log(error);
  }
})

app.delete("/productqueue/:id", async (req,res) =>{
  try {
    const id = req.params.id
    const query = { _id: new ObjectId(id)  }; 
    const result = await productqueue.deleteOne(query)
    res.send(result)
  } catch (error) {
    console.log(error);
  }
})

// get productdata, post productdata ,update productdata
app.get("/product", async (req, res) =>{
  try {
    const cursor =productdata.find();
    const result = await cursor.toArray();
    res.send(result)
  } catch (error) {
 console.log(error);     
  }
});

app.post("/product",async (req,res) => {
  try {
    const product = req.body;
    console.log(req.body);
    const result = await productdata.insertOne(product)
    res.send(result)
} catch (error) {
    console.log(error);
}
})

app.delete("/product/:id", async (req,res) =>{
  try {
    const id = req.params.id;
    console.log(id);
    const query = { _id: (id)  }; 
    const result = await productdata.deleteOne(query)
    console.log(result);
    res.send(result)
  } catch (error) {
    console.log(error);
  }
})

app.put("/product/:id",async (req, res) => {
  try {
    const id = { _id:(req.params.id) };
  const body = req.body;
  console.log(body);
  const updatedData = {
    $set: {
      ...body,
    },
  };
  const option = { upsert: true };
  const result = await productdata.updateOne(id, updatedData, option);
  console.log(body);
  res.send(result);
  } catch (error) {
    console.log(error);
  }
});

// rejected productdata 
app.get("/rejectedproduct", async(req,res) =>{
  const cursor = rejectedproduct.find();
  const result = await cursor.toArray();
  res.send(result)
})

app.post("/rejectedproduct",async (req,res) => {
  try {
    const product = req.body;
    console.log(req.body);
    const result = await rejectedproduct.insertOne(product)
    res.send(result)
} catch (error) {
    console.log(error);
}
})

// get,add review 

app.get("/review", async(req,res) =>{
  const cursor = review.find();
  const result = await cursor.toArray();
  res.send(result)
})

app.post("/review",async (req,res) => {
  try {
    const product = req.body;
    console.log(req.body);
    const result = await review.insertOne(product)
    res.send(result)
} catch (error) {
    console.log(error);
}
})


// get add remove feature product 

app.get("/feature", async(req,res) =>{
  const cursor = feature.find();
  const result = await cursor.toArray();
  res.send(result)
})

app.post("/feature",async (req,res) => {
  try {
    const product = req.body;
    console.log(req.body);
    const result = await feature.insertOne(product)
    res.send(result)
} catch (error) {
    console.log(error);
}
})
app.delete("/feature/:id", async (req,res) =>{
  try {
    const id = req.params.id;
    console.log(id);
    const query = { _id: (id)  }; 
    const result = await feature.deleteOne(query)
    console.log(result);
    res.send(result)
  } catch (error) {
    console.log(error);
  }
})

// get add and update usercontrol

app.get("/user", async(req,res) =>{
  const cursor = usercontrol.find();
  const result = await cursor.toArray();
  res.send(result)
})

app.post("/user",async (req,res) => {
  try {
    const product = req.body;
    console.log(req.body);
    const result = await usercontrol.insertOne(product)
    res.send(result)
} catch (error) {
    console.log(error);
}
})

app.put("/user/:id",async (req, res) => {
  try {
    const id = { _id:new ObjectId(req.params.id) };
  const body = req.body;
  console.log(body);
  const updatedData = {
    $set: {
      ...body,
    },
  };
  const option = { upsert: true };
  const result = await usercontrol.updateOne(id, updatedData, option);
  console.log(body);
  res.send(result);
  } catch (error) {
    console.log(error);
  }
});




// see if the server is runnig or not 
async function run() {
    try {
        client.connect();
     client.db("admin").command({ ping: 1 });
    console.log(
      "Pinged your deployment. You successfully connected to MongoDB!"
    );
        
    } catch (error) {
        
    }
}

app.listen(port, () => {
    console.log(`Simple Crud is Running on port ${port}`);
  });
run().catch(console.dir);