import { Router } from "express";
import { listProducts, createProduct } from "../services/product.service.js";
import { validateProductCreate } from "../middleware/product.validation.js";

const router = Router();

router.get("/products", async (req, res) => {
  res.json(await listProducts());
});

router.post("/products", validateProductCreate, async (req, res) => {
  res.status(201).json(await createProduct(req.body));
});

export default router;
