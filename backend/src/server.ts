import "dotenv/config";
import express from "express";
import cors from "cors";
import multer from "multer";
import path from "path";
import fs from "fs";
import { AppDataSource } from "./data-source";
import { Trail } from "./entities/Trail";
import { User } from "./entities/User";

const app = express();
app.use(cors());
app.use(express.json());

const uploadDir = path.join(__dirname, "../uploads");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir);
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + '-' + file.originalname);
  }
});
const upload = multer({ storage });

app.use("/uploads", express.static(uploadDir));

const formatImageUrl = (req: express.Request, url: string | null) => {
  if (!url) return null;
  const uploadIndex = url.indexOf("/uploads/");
  if (uploadIndex !== -1) {
    const relativePath = url.substring(uploadIndex);
    const host = req.headers.host || "localhost:3000";
    return `${req.protocol}://${host}${relativePath}`;
  }
  return url;
};

// --- ROTAS DE TRILHAS ---
app.get("/trails", async (req, res) => {
  try {
    const trails = await AppDataSource.getRepository(Trail).find();
    const formattedTrails = trails.map((trail) => ({
      ...trail,
      image_url: formatImageUrl(req, trail.image_url),
    }));
    res.json(formattedTrails);
  } catch (error) {
    res.status(500).json({ error: "Erro ao buscar dados no banco" });
  }
});

app.get("/trails/:id", async (req, res) => {
  try {
    const trail = await AppDataSource.getRepository(Trail).findOneBy({ id: req.params.id });
    if (!trail) return res.status(404).json({ error: "Trilha não encontrada" });
    
    res.json({
      ...trail,
      image_url: formatImageUrl(req, trail.image_url),
    });
  } catch (error) {
    res.status(500).json({ error: "Erro ao buscar detalhes no banco" });
  }
});

app.post("/trails", upload.single("image"), async (req, res) => {
  try {
    const { title, type, difficulty, distance_km, duration_mins, elevation_m, history, user_id } = req.body;
    
    let image_url = null;
    if (req.file) {
      image_url = `/uploads/${req.file.filename}`;
    }

    const trailRepository = AppDataSource.getRepository(Trail);
    const newTrail = trailRepository.create({
      title, 
      type, 
      difficulty, 
      distance_km: parseFloat(distance_km.replace(',', '.')), 
      duration_mins: parseInt(duration_mins, 10), 
      elevation_m: parseInt(elevation_m, 10), 
      history,
      image_url,
      user_id: user_id || null
    });
    
    await trailRepository.save(newTrail);
    
    res.status(201).json({
      ...newTrail,
      image_url: formatImageUrl(req, newTrail.image_url),
    });
  } catch (error) {
    console.error("Erro ao criar trilha:", error);
    res.status(500).json({ error: "Erro ao salvar a trilha" });
  }
});

// PUT: Editar Trilha (Apenas o autor pode editar)
app.put("/trails/:id", upload.single("image"), async (req, res) => {
  try {
    const { id } = req.params;
    const { title, type, difficulty, distance_km, duration_mins, elevation_m, history, user_id } = req.body;

    const trailRepository = AppDataSource.getRepository(Trail);
    const trail = await trailRepository.findOneBy({ id });

    if (!trail) {
      return res.status(404).json({ error: "Trilha não encontrada" });
    }

    if (trail.user_id && trail.user_id !== user_id) {
      return res.status(403).json({ error: "Sem permissão. Apenas o criador pode editar esta rota." });
    }

    if (title) trail.title = title;
    if (type) trail.type = type;
    if (difficulty) trail.difficulty = difficulty;
    if (distance_km) trail.distance_km = parseFloat(String(distance_km).replace(',', '.'));
    if (duration_mins) trail.duration_mins = parseInt(String(duration_mins), 10);
    if (elevation_m) trail.elevation_m = parseInt(String(elevation_m), 10);
    if (history) trail.history = history;

    if (req.file) {
      trail.image_url = `/uploads/${req.file.filename}`;
    }

    await trailRepository.save(trail);

    res.json({
      ...trail,
      image_url: formatImageUrl(req, trail.image_url),
    });
  } catch (error) {
    console.error("Erro ao editar trilha:", error);
    res.status(500).json({ error: "Erro ao editar trilha" });
  }
});

// DELETE: Excluir Trilha (Apenas o autor pode excluir)
app.delete("/trails/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { user_id } = req.body;

    const trailRepository = AppDataSource.getRepository(Trail);
    const trail = await trailRepository.findOneBy({ id });

    if (!trail) {
      return res.status(404).json({ error: "Trilha não encontrada" });
    }

    if (trail.user_id && trail.user_id !== user_id) {
      return res.status(403).json({ error: "Sem permissão. Apenas o criador pode excluir esta rota." });
    }

    await trailRepository.remove(trail);
    res.json({ message: "Trilha excluída com sucesso" });
  } catch (error) {
    console.error("Erro ao excluir trilha:", error);
    res.status(500).json({ error: "Erro ao excluir trilha" });
  }
});

// --- ROTAS DE USUÁRIO ---
app.post("/register", async (req, res) => {
  try {
    const { name, email, password } = req.body;
    const userRepository = AppDataSource.getRepository(User);
    const userExists = await userRepository.findOneBy({ email });
    if (userExists) return res.status(400).json({ error: "E-mail já cadastrado" });

    const user = userRepository.create({ name, email, password });
    await userRepository.save(user);
    res.status(201).json({ id: user.id, name: user.name, email: user.email });
  } catch (error) {
    res.status(500).json({ error: "Erro ao criar usuário" });
  }
});

app.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await AppDataSource.getRepository(User).findOneBy({ email, password });
    if (!user) return res.status(401).json({ error: "E-mail ou senha incorretos" });
    res.json({ id: user.id, name: user.name, email: user.email });
  } catch (error) {
    res.status(500).json({ error: "Erro ao realizar login" });
  }
});

// DELETE: Excluir Conta do Usuário
app.delete("/users/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const userRepository = AppDataSource.getRepository(User);
    const user = await userRepository.findOneBy({ id });

    if (!user) {
      return res.status(404).json({ error: "Usuário não encontrado" });
    }

    // Remove as trilhas criadas pelo usuário para evitar erros de FK
    const trailRepository = AppDataSource.getRepository(Trail);
    await trailRepository.delete({ user_id: id });

    await userRepository.remove(user);
    res.json({ message: "Conta excluída com sucesso" });
  } catch (error) {
    console.error("Erro ao excluir conta:", error);
    res.status(500).json({ error: "Erro ao excluir conta" });
  }
});

AppDataSource.initialize()
  .then(() => {
    console.log("📦 Banco de dados conectado!");
    app.listen(3000, "0.0.0.0", () => console.log("🚀 Servidor rodando na porta 3000"));
  })
  .catch((error) => console.error("❌ Erro ao conectar:", error));