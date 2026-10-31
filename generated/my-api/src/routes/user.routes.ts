import { Router } from "express";
import { listUsers, createUser, getUser, updateUser, deleteUser } from "../services/user.service.js";
import { validateUserCreate, validateUserUpdate } from "../middleware/user.validation.js";
import { UserIdSchema } from "../validation/user.schema.js";

const router = Router();

router.get("/users", async (req, res) => {
  res.json(await listUsers());
});

router.post("/users", validateUserCreate, async (req, res) => {
  res.status(201).json(await createUser(req.body));
});

router.get("/users/:id", async (req, res) => {
  const id = UserIdSchema.safeParse(req.params["id"]);
  if (!id.success) {
    res.status(400).json({ error: "Invalid ID", details: id.error.issues });
    return;
  }

  const record = await getUser(id.data);
  if (!record) {
    res.status(404).json({ error: "User not found" });
    return;
  }
  res.json(record);
});

router.put("/users/:id", validateUserUpdate, async (req, res) => {
  const id = UserIdSchema.safeParse(req.params["id"]);
  if (!id.success) {
    res.status(400).json({ error: "Invalid ID", details: id.error.issues });
    return;
  }

  res.json(await updateUser(id.data, req.body));
});

router.delete("/users/:id", async (req, res) => {
  const id = UserIdSchema.safeParse(req.params["id"]);
  if (!id.success) {
    res.status(400).json({ error: "Invalid ID", details: id.error.issues });
    return;
  }

  await deleteUser(id.data);
  res.status(204).send();
});

export default router;
