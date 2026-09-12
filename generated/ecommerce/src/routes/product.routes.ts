import { Router } from "express";
import { listProducts, createProduct } from "../services/product.service.js";
import {
  validateProductCreate,
  validateProductUpdate
} from "../middleware/product.validation.js";

const router = Router();

router.get("/products", async (_req, res) => {
  try {
    const products = await listProducts();

    res.json(products);
  } catch (error) {
    console.error(error);

    res.status(500).json({
      error: "Internal server error"
    });
  }
});

router.post("/products", validateProductCreate, async (req, res) => {
  try {
    const product = await createProduct(req.body);

    res.status(201).json(product);
  } catch (error) {
    console.error(error);

    res.status(500).json({
      error: "Internal server error"
    });
  }
});

export default router;
