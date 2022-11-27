const express = require('express');
const cors = require('cors');

const jwt = require('jsonwebtoken');
const port = process.env.PORT || 5000;

const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
require('dotenv').config();
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);
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
        const bookingCollection = client.db('nextdoor').collection('booking');
        const paymentsCollection = client.db('nextdoor').collection('payment');

        app.get('/product_categories', async (req, res) => {

            const query = {};
            const categories = await furnitureCollection.find(query).toArray();

            res.send(categories);
        });


        app.get('/product_categories/:id', async (req, res) => {
            const id = req.params.id;
            const query = { category_id: id };
            const category = await furnitureCollection.find(query).toArray();
            res.send(category);
        });

        app.delete('/product_categories/:id', async (req, res) => {
            const id = req.params.id;
            const filter = { _id: ObjectId(id) };
            const result = await furnitureCollection.deleteOne(filter);
            res.send(result);
        });

        app.get('/product', async (req, res) => {
            const query = {};
            const products = await categoriesCollection.find(query).toArray()
            res.send(products);
        });


        app.get('/product/:id', async (req, res) => {
            const id = req.params.id;
            const query = { id: id };
            const products = await categoriesCollection.findOne(query)
            res.send(products);
        });

        app.get('/categoryName', async (req, res) => {
            const query = {}
            const cursor = categoriesCollection.find(query).project({ Category_name: 1 });
            const categories = await cursor.toArray();
            res.send(categories);
        });


        app.post('/add', async (req, res) => {
            const add = req.body;
            const result = await furnitureCollection.insertOne(add);
            res.send(result);
        });

        app.get('/bookings', async (req, res) => {
            const email = req.query.email;
            const query = { email: email }
            const booking = await bookingCollection.find(query).toArray();
            res.send(booking)
        });

        app.get('/bookings/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: ObjectId(id) };
            const booking = await bookingCollection.findOne(query);
            res.send(booking)
        });


        app.post('/bookings', async (req, res) => {
            const booking = req.body;
            console.log(booking)

            const query = {
                productName: booking.productName,
                email: booking.email
            }
            alreadyBooked = await bookingCollection.find(query).toArray();
            if (alreadyBooked.length) {
                const message = `You have already booking this ${booking.productName}`;
                return res.send({ acknowledged: false, message });
            }
            const result = await bookingCollection.insertOne(booking);
            res.send(result);
        });



        app.post('/create-payment-intent', async (req, res) => {
            const booking = req.body;
            const price = booking.resalePrice;
            const amount = price * 100;

            const paymentIntent = await stripe.paymentIntents.create({
                currency: 'usd',
                amount: amount,
                "payment_method_types": [
                    "card"
                ]
            });
            res.send({
                clientSecret: paymentIntent.client_secret,
            });

        });

        app.post('/payments', async (req, res) => {
            const payment = req.body;
            const result = await paymentsCollection.insertOne(payment);
            const id = payment.bookingId
            const filter = { _id: ObjectId(id) }
            const updatedDoc = {
                $set: {
                    paid: true,
                    transactionId: payment.transactionId
                }
            }
            const updatedResult = await bookingCollection.updateOne(filter, updatedDoc)
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