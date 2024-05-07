const {
  client,
  createTables,
  createCustomer,
  createReservation,
  createRestaurant,
  fetchCustomers,
  fetchRestaurants,
  fetchReservations,
  destroyReservation,
} = require("./db");
const express = require("express");
const app = express();
app.use(express.json());
app.use(require("morgan")("dev"));

app.get("/api/customers", async (req, res, next) => {
  try {
    res.send(await fetchCustomers());
  } catch (ex) {
    next(ex);
  }
});

app.get("/api/restaurants", async (req, res, next) => {
  try {
    res.send(await fetchRestaurants());
  } catch (ex) {
    next(ex);
  }
});

app.get("/api/reservations", async (req, res, next) => {
  try {
    res.send(await fetchReservations());
  } catch (ex) {
    next(ex);
  }
});

app.delete(
  "/api/customers/:customer_id/reservations/:id",
  async (req, res, next) => {
    try {
      await destroyReservation({
        customer_id: req.params.customer_id,
        id: req.params.id,
      });
      res.sendStatus(204);
    } catch (ex) {
      next(ex);
    }
  }
);

app.post("/api/customers/:customer_id/reservations", async (req, res, next) => {
  try {
    res.status(201).send(
      await createReservation({
        customer_id: req.params.customer_id,
        restaurant_id: req.body.restaurant_id,
        date: req.body.date,
        party_count: req.body.party_count,
      })
    );
  } catch (ex) {
    next(ex);
  }
});

app.use((err, req, res, next) => {
  res.status(err.status || 500).send({ error: err.message || err });
});

const init = async () => {
  console.log("connecting to database");
  await client.connect();
  console.log("connected to database");
  await createTables();
  console.log("created tables");
  const [drake, kendrick, tyler, restaurant1, restaurant2, restaurant3] =
    await Promise.all([
      createCustomer({ name: "Drake" }),
      createCustomer({ name: "Kendrick" }),
      createCustomer({ name: "Tyler" }),
      createRestaurant({ name: "Restaurant A" }),
      createRestaurant({ name: "Restaurant B" }),
      createRestaurant({ name: "Restaurant C" }),
    ]);
  console.log(await fetchCustomers());
  console.log(await fetchRestaurants());

  const [reservation1, reservation2] = await Promise.all([
    createReservation({
      customer_id: drake.id,
      restaurant_id: restaurant1.id,
      date: "2024-05-15",
      party_count: 4,
    }),
    createReservation({
      customer_id: kendrick.id,
      restaurant_id: restaurant2.id,
      date: "2024-05-20",
      party_count: 2,
    }),
  ]);
  console.log(await fetchReservations());
  await destroyReservation({
    id: reservation1.id,
    customer_id: reservation1.customer_id,
  });
  console.log(await fetchReservations());

  const port = process.env.PORT || 3000;
  app.listen(port, () => {
    console.log(`listening on port ${port}`);
    console.log("some curl commands to test");
    console.log(`curl localhost:${port}/api/customers`);
    console.log(`curl localhost:${port}/api/restaurants`);
    console.log(`curl localhost:${port}/api/reservations`);
    console.log(
      `curl -X DELETE localhost:${port}/api/customers/${drake.id}/reservations/${reservation2.id}`
    );
    console.log(
      `curl -X POST localhost:${port}/api/customers/${tyler.id}/reservations/ -d '{"restaurant_id":"${restaurant3.id}", "date": "2024"}' -H "Content-Type:application/json"`
    );
  });
};

init();
