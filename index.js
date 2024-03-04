const express = require('express')
require('dotenv').config()
const cors = require('cors')
const app = express()
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const port = process.env.PORT || 8000;

app.use(cors())
app.use(express.json())



var uri = `mongodb://${process.env.DB_USER}:${process.env.DB_PASS}@ac-8pabrgd-shard-00-00.q1kedym.mongodb.net:27017,ac-8pabrgd-shard-00-01.q1kedym.mongodb.net:27017,ac-8pabrgd-shard-00-02.q1kedym.mongodb.net:27017/?ssl=true&replicaSet=atlas-uqgq0w-shard-0&authSource=admin&retryWrites=true&w=majority`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
    serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
    },
    useNewUrlParser: true,
    useUnifiedTopology: true,
    maxPoolSize: 10,
});

async function run() {
    try {
        // Connect the client to the server	(optional starting in v4.7)
        await client.connect();

        const userCollection = client.db('TaskDB').collection('users')
        const workCollection = client.db('TaskDB').collection('works')
        const donationCollection = client.db('TaskDB').collection('donation')
        const toysCollection = client.db("TaskDB").collection("Toys");



        app.post('/works', async (req, res) => {
            const addWork = req.body;
            console.log(addWork);
            const result = await workCollection.insertOne(addWork)
            res.send(result)
        })


        app.get('/worksInfo/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: new ObjectId(id) }
            const result = await workCollection.findOne(query)
            res.send(result);
        })

        app.get('/users', async (req, res) => {
            console.log(req.headers);
            const cursor = userCollection.find()
            const result = await cursor.toArray()
            res.send(result)
        })

        app.post('/users', async (req, res) => {
            const user = req.body;
            const query = { email: user.email }
            const existingUser = await userCollection.findOne(query);
            if (existingUser) {
                return res.send({ message: 'user already exists', insertedId: null })
            }
            const result = await userCollection.insertOne(user);
            res.send(result);
        });
        app.get('/workdatas/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: new ObjectId(id) }
            const result = await workCollection.findOne(query)
            res.send(result);
        })

        app.delete('/workdata/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: new ObjectId(id) }
            const result = await workCollection.deleteOne(query)
            res.send(result)
        })

        app.get('/workdata', async (req, res) => {
            console.log(req.headers);
            const cursor = workCollection.find()
            const result = await cursor.toArray()
            res.send(result)
        })


        app.put("/workdatas/:id", async (req, res) => {
            const id = req.params.id;
            const body = req.body;
            const filter = { _id: new ObjectId(id) };
            const updatedDoc = {
                $set: {
                    title: body.title,
                    description: body.description,
                    priority: body.priority,
                    isCompleted: body.isCompleted,
                },
            };
            const options = { upsert: true };
            const result = await workCollection.updateOne(
                filter,
                updatedDoc,
                options
            );
            res.send(result);
        });

        // donation API

        app.get('/donation', async (req, res) => {
            console.log(req.headers);
            const cursor = donationCollection.find()
            const result = await cursor.toArray()
            res.send(result)
        })

        app.get('/donations', async (req, res) => {

            const nameQuery = req.query.category;
            const query = {
                category: {
                    $regex: new RegExp(nameQuery, "i"),
                },
            };
            const cursor = donationCollection.find(query)
            const result = await cursor.toArray()
            res.send(result)
        })



        // toys collection

        app.get("/allToys", async (req, res) => {
            const cursor = toysCollection.find().limit(20);
            const result = await cursor.toArray();
            res.send(result);
        });

        app.get("/allToys/:category", async (req, res) => {
            const result = await toysCollection
                .find({ toyCategory: req.params.category })
                .toArray();
            res.send(result);
        });

        app.get("/getToysByText/:text", async (req, res) => {
            const text = req.params.text;
            const result = await toysCollection
                .find({
                    $or: [
                        { toyName: { $regex: text, $options: "i" } },
                        { toyCategory: { $regex: text, $options: "i" } },
                    ],
                })
                .toArray();
            res.send(result);
        });

        app.get("/toys/:id", async (req, res) => {
            const id = req.params.id;
            const query = { _id: new ObjectId(id) };
            const result = await toysCollection.findOne(query);
            res.send(result);
        });

        app.get("/myToys/:email", async (req, res) => {
            const result = await toysCollection
                .find({ sellerEmail: req.params.email })
                .toArray();
            res.send(result);
        });

        app.get("/myToysHigh", async (req, res) => {
            let query = {};
            if (req.query?.sellerEmail) {
                query = { sellerEmail: req.query.sellerEmail };
            }
            const result = await toysCollection
                .find(query)
                .sort({ price: -1 })
                .collation({ locale: "en_US", numericOrdering: true })
                .toArray();
            res.send(result);
        });

        app.get("/myToysLow", async (req, res) => {
            let query = {};
            if (req.query?.sellerEmail) {
                query = { sellerEmail: req.query.sellerEmail };
            }
            const result = await toysCollection
                .find(query)
                .sort({ price: 1 })
                .collation({ locale: "en_US", numericOrdering: true })
                .toArray();
            res.send(result);
        });

        app.post("/addToy", async (req, res) => {
            const body = req.body;
            const result = await toysCollection.insertOne(body);
            res.send(result);
        });

        app.put("/updatedToy/:id", async (req, res) => {
            const id = req.params.id;
            const body = req.body;
            const filter = { _id: new ObjectId(id) };
            const updateDoc = {
                $set: {
                    toyName: body.toyName,
                    toyPictureUrl: body.toyPictureUrl,
                    rating: body.rating,
                    price: body.price,
                    description: body.description,
                    availableQuantity: body.availableQuantity,
                },
            };
            const result = await toysCollection.updateOne(filter, updateDoc);
            res.send(result);
        });

        app.delete("/remove/:id", async (req, res) => {
            const result = await toysCollection.deleteOne({
                _id: new ObjectId(req.params.id),
            });
            res.send(result);
        });

        // Send a ping to confirm a successful connection
        await client.db("admin").command({ ping: 1 });
        console.log("Pinged your deployment. You successfully connected to MongoDB!");
    } finally {
        // Ensures that the client will close when you finish/error
        // await client.close();
    }
}
run().catch(console.dir);



app.get('/', (req, res) => {
    res.send('Hello From Task Management')
})

app.listen(port, () => {
    console.log(`Task Management is running ${port}`);
})