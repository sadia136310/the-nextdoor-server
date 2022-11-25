const express = require('express');
const cors = require('cors');
const port = process.env.PORT || 5000;

const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
require('dotenv').config();
const app = express();

// middleware 
app.use(cors());
app.use(express.json());


const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@cluster0.wg03kwr.mongodb.net/?retryWrites=true&w=majority`;

const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });



async function run() {
    try {
        const categoriesCollection = client.db('nextdoor').collection('categories');
        const furnitureCollection = client.db('nextdoor').collection('furniture');

        app.get('/categories', async (req, res) => {
            const query = {}
            const cursor = categoriesCollection.find(query);
            const categories = await cursor.toArray();
            res.send(categories);
        });

        app.get('/categories/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: ObjectId(id) };
            const category = await categoriesCollection.findOne(query);
            res.send(category);
        });

        app.get('/categoryName', async (req, res) => {
            const query = {}
            const cursor = categoriesCollection.find(query).project({Category_name:1});
            const categories = await cursor.toArray();
            res.send(categories);
        });

        app.post('/add', async (req, res) => {
            const add = req.body;
            const result = await furnitureCollection.insertOne(add);
            res.send(result);
        });

    }
    finally {

    }
}
run().catch(error => console.error(error));

app.get('/', async (req, res) => {
    res.send('nextdoor server is running')
})

app.listen(port, () => console.log(`nextdoor running on ${port}`))