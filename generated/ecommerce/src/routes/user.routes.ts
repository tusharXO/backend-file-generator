import { Router } from "express";
import { listUsers, createUser } from "../services/user.service.js";

const router = Router();

router.get("/users", async (_req, res) => {
  try {
    const users = await listUsers();

    res.json(users);
  } catch (error) {
    console.error(error);

    res.status(500).json({
      error: "Internal server error"
    });
  }
});

router.post("/users", async (req, res) => {
  try {
    const user = await createUser(req.body);

    res.status(201).json(user);
  } catch (error) {
    console.error(error);

    res.status(500).json({
      error: "Internal server error"
    });
  }
});

export default router;
