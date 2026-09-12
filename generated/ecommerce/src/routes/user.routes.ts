import { Router } from "express";
import { listUsers, createUser, getUser, updateUser, deleteUser } from "../services/user.service.js";
import {
  validateUserCreate,
  validateUserUpdate
} from "../middleware/user.validation.js";

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

router.post("/users", validateUserCreate, async (req, res) => {
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

router.get("/users/:id", async (req, res) => {
  try {
    const id = Number(req.params.id);

    const user = await getUser(id);

    if (!user) {
      res.status(404).json({
        error: "User not found"
      });

      return;
    }

    res.json(user);
  } catch (error) {
    console.error(error);

    res.status(500).json({
      error: "Internal server error"
    });
  }
});

router.put("/users/:id", validateUserUpdate, async (req, res) => {
  try {
    const id = Number(req.params.id);

    const user = await updateUser(id, req.body);

    res.json(user);
  } catch (error) {
    console.error(error);

    res.status(500).json({
      error: "Internal server error"
    });
  }
});

router.delete("/users/:id", async (req, res) => {
  try {
    const id = Number(req.params.id);

    await deleteUser(id);

    res.status(204).send();
  } catch (error) {
    console.error(error);

    res.status(500).json({
      error: "Internal server error"
    });
  }
});

export default router;
