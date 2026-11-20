import express from "express";
import { 
  PutCommand, 
  GetCommand, 
  UpdateCommand, 
  DeleteCommand,
  ScanCommand
} from "@aws-sdk/lib-dynamodb";
import { docClient } from "./db.js";

const app = express();
app.use(express.json());

const TABLE_NAME = "Users";

// 1. CREATE: POST /users
app.post("/users", async (req, res) => {
  try {
    const { UserID, name, email } = req.body;
    await docClient.send(new PutCommand({
      TableName: TABLE_NAME,
      Item: { UserID, name, email, createdAt: new Date().toISOString() },
      ConditionExpression: "attribute_not_exists(UserID)"
    }));
    res.status(201).json({ message: "User created", UserID });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// 2. READ: GET /users/:id
app.get("/users/:id", async (req, res) => {
  try{
    const { Item } = await docClient.send(new GetCommand({
      TableName: TABLE_NAME,
      Key: { UserID: req.params.id }
    }));
    if (!Item) return res.status(404).json({ error: "User not found" });
    res.json(Item);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 3. UPDATE: PATCH /users/:id
app.patch("/users/:id", async (req, res) => {
  try {
    const { name } = req.body;
    const { Attributes } = await docClient.send(new UpdateCommand({
      TableName: TABLE_NAME,
      Key: { UserID: req.params.id },
      UpdateExpression: "SET #n = :name",
      ExpressionAttributeNames: { "#n": "name" },
      ExpressionAttributeValues: { ":name": name },
      ReturnValues: "ALL_NEW"
    }));
    res.json(Attributes);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 4. DELETE: DELETE /users/:id
app.delete("/users/:id", async (req, res) => {
  try {
    await docClient.send(new DeleteCommand({
      TableName: TABLE_NAME,
      Key: { UserID: req.params.id }
    }));
    res.json({ message: "User deleted" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 5. READ ALL: GET /users
app.get("/users", async (req, res) => {
  try {
    const { Items } = await docClient.send(new ScanCommand({
      TableName: TABLE_NAME
    }));
    res.json(Items);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.listen(3000, () => console.log("Server running on http://localhost:3000"));
