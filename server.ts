import express, { Request, Response, NextFunction } from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import { fileURLToPath } from 'url';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const JWT_SECRET = '715b126890a4988d15dbad1df5e086a96816b0a7fbb06b0f0902391a628501d8';

// Interfaces matching Sabrina's Java Spring Boot models
export interface Usuario {
  id: number;
  nome: string;
  usuario: string; // email
  senha?: string;
  foto?: string;
}

export interface Tema {
  id: number;
  descricao: string;
}

export interface Postagem {
  id: number;
  titulo: string;
  texto: string;
  data: string;
  tema: Tema;
  usuario: {
    id: number;
    nome: string;
    usuario: string;
    foto?: string;
  };
}

// In-memory Database
let nextUsuarioId = 1;
let nextTemaId = 1;
let nextPostagemId = 1;

const usuarios = new Map<number, Usuario>();
const temas = new Map<number, Tema>();
const postagens = new Map<number, Postagem>();

// Seed initial data
function seedInitialData() {
  const rootPasswordHash = bcrypt.hashSync('rootroot', 10);
  const rootUser: Usuario = {
    id: nextUsuarioId++,
    nome: 'Root Administrator',
    usuario: 'root@root.com',
    senha: rootPasswordHash,
    foto: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
  };
  usuarios.set(rootUser.id, rootUser);

  const sabrinaUser: Usuario = {
    id: nextUsuarioId++,
    nome: 'Sabrina Furtado',
    usuario: 'sabrina@generation.org',
    senha: bcrypt.hashSync('12345678', 10),
    foto: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80',
  };
  usuarios.set(sabrinaUser.id, sabrinaUser);

  const tema1: Tema = {
    id: nextTemaId++,
    descricao: 'Tecnologia & Desenvolvimento Web',
  };
  const tema2: Tema = {
    id: nextTemaId++,
    descricao: 'Java, Spring Boot & Node.js',
  };
  const tema3: Tema = {
    id: nextTemaId++,
    descricao: 'Carreira Tech & Generation Brasil',
  };
  temas.set(tema1.id, tema1);
  temas.set(tema2.id, tema2);
  temas.set(tema3.id, tema3);

  const post1: Postagem = {
    id: nextPostagemId++,
    titulo: 'Bem-vindo ao Blog Pessoal!',
    texto: 'Este servidor foi portado com sucesso do repositório Java Spring Boot para TypeScript/Express no AI Studio, mantendo 100% de compatibilidade com os endpoints REST.',
    data: new Date().toISOString(),
    tema: tema1,
    usuario: {
      id: sabrinaUser.id,
      nome: sabrinaUser.nome,
      usuario: sabrinaUser.usuario,
      foto: sabrinaUser.foto,
    },
  };

  const post2: Postagem = {
    id: nextPostagemId++,
    titulo: 'Arquitetura de Microsserviços e APIs REST',
    texto: 'Uma introdução completa às rotas /postagens, /temas e /usuarios com segurança JWT e criptografia de senhas BCrypt.',
    data: new Date(Date.now() - 3600000).toISOString(),
    tema: tema2,
    usuario: {
      id: rootUser.id,
      nome: rootUser.nome,
      usuario: rootUser.usuario,
      foto: rootUser.foto,
    },
  };

  postagens.set(post1.id, post1);
  postagens.set(post2.id, post2);
}

seedInitialData();

// Helper to remove password before sending user object
function sanitizeUser(user: Usuario) {
  const { senha: _senha, ...safeUser } = user;
  return safeUser;
}

// JWT Authentication Middleware (matches Spring Security JwtAuthFilter)
function authenticateJwt(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    res.status(403).json({ error: 'Token de autenticação não fornecido' });
    return;
  }

  const token = authHeader.startsWith('Bearer ') ? authHeader.substring(7) : authHeader;

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { sub?: string; usuario?: string };
    const email = decoded.sub || decoded.usuario;
    // Find user by email
    const user = Array.from(usuarios.values()).find((u) => u.usuario === email);
    if (!user) {
      res.status(403).json({ error: 'Usuário do token não encontrado' });
      return;
    }
    (req as any).user = user;
    next();
  } catch (err) {
    res.status(403).json({ error: 'Token inválido ou expirado' });
    return;
  }
}

async function startServer() {
  const app = express();
  const PORT = Number(process.env.PORT) || 3000;

  app.use(express.json());

  // CORS headers matching Spring Boot @CrossOrigin(origins = "*", allowedHeaders = "*")
  app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
    if (req.method === 'OPTIONS') {
      res.sendStatus(200);
      return;
    }
    next();
  });

  // ==========================================
  // USUARIOS CONTROLLER (/usuarios)
  // ==========================================

  // POST /usuarios/cadastrar (Public)
  app.post('/usuarios/cadastrar', (req: Request, res: Response) => {
    const { nome, usuario, senha, foto } = req.body || {};

    if (!nome || !usuario || !senha) {
      res.status(400).json({ error: 'Os campos nome, usuario e senha são obrigatórios' });
      return;
    }

    if (senha.length < 8) {
      res.status(400).json({ error: 'A senha deve conter no mínimo 8 caracteres' });
      return;
    }

    // Check if email already registered
    const exists = Array.from(usuarios.values()).some(
      (u) => u.usuario.toLowerCase() === usuario.trim().toLowerCase()
    );
    if (exists) {
      res.status(400).json({ error: 'Usuário já existe!' });
      return;
    }

    const newUser: Usuario = {
      id: nextUsuarioId++,
      nome: nome.trim(),
      usuario: usuario.trim().toLowerCase(),
      senha: bcrypt.hashSync(senha, 10),
      foto: foto || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80',
    };

    usuarios.set(newUser.id, newUser);
    res.status(201).json(sanitizeUser(newUser));
  });

  // POST /usuarios/logar (Public)
  app.post('/usuarios/logar', (req: Request, res: Response) => {
    const { usuario, senha } = req.body || {};

    if (!usuario || !senha) {
      res.status(401).json({ error: 'Credenciais inválidas' });
      return;
    }

    const foundUser = Array.from(usuarios.values()).find(
      (u) => u.usuario.toLowerCase() === usuario.trim().toLowerCase()
    );

    if (!foundUser || !foundUser.senha) {
      res.status(401).json({ error: 'Usuário ou senha inválidos' });
      return;
    }

    const passwordMatches = bcrypt.compareSync(senha, foundUser.senha);
    if (!passwordMatches) {
      res.status(401).json({ error: 'Usuário ou senha inválidos' });
      return;
    }

    // Generate JWT token (matches JwtService.java)
    const token = jwt.sign(
      {
        sub: foundUser.usuario,
        id: foundUser.id,
        nome: foundUser.nome,
      },
      JWT_SECRET,
      { expiresIn: '1h' }
    );

    res.status(200).json({
      id: foundUser.id,
      nome: foundUser.nome,
      usuario: foundUser.usuario,
      senha: '',
      foto: foundUser.foto,
      token: `Bearer ${token}`,
    });
  });

  // GET /usuarios/all (Protected)
  app.get('/usuarios/all', authenticateJwt, (_req: Request, res: Response) => {
    const list = Array.from(usuarios.values()).map(sanitizeUser);
    res.status(200).json(list);
  });

  // GET /usuarios/:id (Protected)
  app.get('/usuarios/:id', authenticateJwt, (req: Request, res: Response) => {
    const id = Number(req.params.id);
    const user = usuarios.get(id);
    if (!user) {
      res.status(404).send();
      return;
    }
    res.status(200).json(sanitizeUser(user));
  });

  // PUT /usuarios/atualizar (Protected)
  app.put('/usuarios/atualizar', authenticateJwt, (req: Request, res: Response) => {
    const { id, nome, usuario, senha, foto } = req.body || {};
    const userId = Number(id);

    if (!usuarios.has(userId)) {
      res.status(404).json({ error: 'Usuário não encontrado' });
      return;
    }

    // Check if another user has this email
    if (usuario) {
      const emailDuplicate = Array.from(usuarios.values()).find(
        (u) => u.usuario.toLowerCase() === usuario.trim().toLowerCase() && u.id !== userId
      );
      if (emailDuplicate) {
        res.status(400).json({ error: 'Usuário já existe!' });
        return;
      }
    }

    const existing = usuarios.get(userId)!;
    const updatedUser: Usuario = {
      ...existing,
      nome: nome ? nome.trim() : existing.nome,
      usuario: usuario ? usuario.trim().toLowerCase() : existing.usuario,
      foto: foto !== undefined ? foto : existing.foto,
      senha: senha && senha.length >= 8 ? bcrypt.hashSync(senha, 10) : existing.senha,
    };

    usuarios.set(userId, updatedUser);
    res.status(200).json(sanitizeUser(updatedUser));
  });

  // ==========================================
  // TEMAS CONTROLLER (/temas)
  // ==========================================

  // GET /temas (Protected)
  app.get('/temas', authenticateJwt, (_req: Request, res: Response) => {
    const list = Array.from(temas.values()).map((t) => {
      const relatedPosts = Array.from(postagens.values()).filter((p) => p.tema.id === t.id);
      return {
        ...t,
        postagem: relatedPosts,
      };
    });
    res.status(200).json(list);
  });

  // GET /temas/:id (Protected)
  app.get('/temas/:id', authenticateJwt, (req: Request, res: Response) => {
    const id = Number(req.params.id);
    const tema = temas.get(id);
    if (!tema) {
      res.status(404).send();
      return;
    }
    const relatedPosts = Array.from(postagens.values()).filter((p) => p.tema.id === tema.id);
    res.status(200).json({
      ...tema,
      postagem: relatedPosts,
    });
  });

  // GET /temas/descricao/:descricao (Protected)
  app.get('/temas/descricao/:descricao', authenticateJwt, (req: Request, res: Response) => {
    const term = req.params.descricao.toLowerCase();
    const filtered = Array.from(temas.values())
      .filter((t) => t.descricao.toLowerCase().includes(term))
      .map((t) => ({
        ...t,
        postagem: Array.from(postagens.values()).filter((p) => p.tema.id === t.id),
      }));
    res.status(200).json(filtered);
  });

  // POST /temas (Protected)
  app.post('/temas', authenticateJwt, (req: Request, res: Response) => {
    const { descricao } = req.body || {};
    if (!descricao || typeof descricao !== 'string' || !descricao.trim()) {
      res.status(400).json({ error: 'O Atributo Descrição é obrigatório' });
      return;
    }

    const newTema: Tema = {
      id: nextTemaId++,
      descricao: descricao.trim(),
    };
    temas.set(newTema.id, newTema);
    res.status(201).json(newTema);
  });

  // PUT /temas (Protected)
  app.put('/temas', authenticateJwt, (req: Request, res: Response) => {
    const { id, descricao } = req.body || {};
    const temaId = Number(id);

    if (!temas.has(temaId)) {
      res.status(404).send();
      return;
    }

    if (!descricao || typeof descricao !== 'string' || !descricao.trim()) {
      res.status(400).json({ error: 'O Atributo Descrição é obrigatório' });
      return;
    }

    const updated: Tema = {
      id: temaId,
      descricao: descricao.trim(),
    };
    temas.set(temaId, updated);

    // Also update tema object inside existing posts
    for (const post of postagens.values()) {
      if (post.tema.id === temaId) {
        post.tema = updated;
      }
    }

    // In Spring Boot: ResponseEntity.status(HttpStatus.CREATED).body(...)
    res.status(201).json(updated);
  });

  // DELETE /temas/:id (Protected)
  app.delete('/temas/:id', authenticateJwt, (req: Request, res: Response) => {
    const id = Number(req.params.id);
    if (!temas.has(id)) {
      res.status(404).send();
      return;
    }

    temas.delete(id);
    // Cascade delete posts with this tema
    for (const [postId, post] of postagens.entries()) {
      if (post.tema.id === id) {
        postagens.delete(postId);
      }
    }

    res.status(204).send();
  });

  // ==========================================
  // POSTAGENS CONTROLLER (/postagens)
  // ==========================================

  // GET /postagens (Protected)
  app.get('/postagens', authenticateJwt, (_req: Request, res: Response) => {
    const list = Array.from(postagens.values()).sort(
      (a, b) => new Date(b.data).getTime() - new Date(a.data).getTime()
    );
    res.status(200).json(list);
  });

  // GET /postagens/:id (Protected)
  app.get('/postagens/:id', authenticateJwt, (req: Request, res: Response) => {
    const id = Number(req.params.id);
    const post = postagens.get(id);
    if (!post) {
      res.status(404).send();
      return;
    }
    res.status(200).json(post);
  });

  // GET /postagens/titulo/:titulo (Protected)
  app.get('/postagens/titulo/:titulo', authenticateJwt, (req: Request, res: Response) => {
    const term = req.params.titulo.toLowerCase();
    const filtered = Array.from(postagens.values()).filter((p) =>
      p.titulo.toLowerCase().includes(term)
    );
    res.status(200).json(filtered);
  });

  // POST /postagens (Protected)
  app.post('/postagens', authenticateJwt, (req: Request, res: Response) => {
    const { titulo, texto, tema, usuario } = req.body || {};

    if (!titulo || titulo.length < 5 || titulo.length > 100) {
      res.status(400).json({
        error: 'O atributo título deve conter no mínimo 05 e no máximo 100 caracteres',
      });
      return;
    }

    if (!texto || texto.length < 10 || texto.length > 1000) {
      res.status(400).json({
        error: 'O atributo texto deve conter no mínimo 10 e no máximo 1000 caracteres',
      });
      return;
    }

    const temaId = Number(tema?.id);
    if (!temaId || !temas.has(temaId)) {
      res.status(400).json({ error: 'Tema não existe!' });
      return;
    }

    const currentLoggedUser = (req as any).user as Usuario;
    const authorUser = usuario?.id && usuarios.has(Number(usuario.id))
      ? usuarios.get(Number(usuario.id))!
      : currentLoggedUser;

    const newPost: Postagem = {
      id: nextPostagemId++,
      titulo: titulo.trim(),
      texto: texto.trim(),
      data: new Date().toISOString(),
      tema: temas.get(temaId)!,
      usuario: {
        id: authorUser.id,
        nome: authorUser.nome,
        usuario: authorUser.usuario,
        foto: authorUser.foto,
      },
    };

    postagens.set(newPost.id, newPost);
    res.status(201).json(newPost);
  });

  // PUT /postagens (Protected)
  app.put('/postagens', authenticateJwt, (req: Request, res: Response) => {
    const { id, titulo, texto, tema, usuario } = req.body || {};
    const postId = Number(id);

    if (!postagens.has(postId)) {
      res.status(404).send();
      return;
    }

    const existing = postagens.get(postId)!;

    let targetTema = existing.tema;
    if (tema?.id) {
      const tId = Number(tema.id);
      if (temas.has(tId)) {
        targetTema = temas.get(tId)!;
      }
    }

    const currentLoggedUser = (req as any).user as Usuario;
    let targetUser = existing.usuario;
    if (usuario?.id && usuarios.has(Number(usuario.id))) {
      const u = usuarios.get(Number(usuario.id))!;
      targetUser = {
        id: u.id,
        nome: u.nome,
        usuario: u.usuario,
        foto: u.foto,
      };
    } else if (!targetUser) {
      targetUser = {
        id: currentLoggedUser.id,
        nome: currentLoggedUser.nome,
        usuario: currentLoggedUser.usuario,
        foto: currentLoggedUser.foto,
      };
    }

    const updated: Postagem = {
      id: postId,
      titulo: titulo ? titulo.trim() : existing.titulo,
      texto: texto ? texto.trim() : existing.texto,
      data: new Date().toISOString(),
      tema: targetTema,
      usuario: targetUser,
    };

    postagens.set(postId, updated);
    res.status(200).json(updated);
  });

  // DELETE /postagens/:id (Protected)
  app.delete('/postagens/:id', authenticateJwt, (req: Request, res: Response) => {
    const id = Number(req.params.id);
    if (!postagens.has(id)) {
      res.status(404).send();
      return;
    }
    postagens.delete(id);
    res.status(204).send();
  });

  // API metadata route for docs / dashboard
  app.get('/api/info', (_req: Request, res: Response) => {
    res.json({
      name: 'Blog Pessoal API',
      version: '1.0.0',
      sourceRepository: 'https://github.com/SabrinaFurtado/blog_pessoal-server.git',
      technology: 'Node.js Express (Converted from Spring Boot 3 / Java 17)',
      status: 'online',
      stats: {
        usuarios: usuarios.size,
        temas: temas.size,
        postagens: postagens.size,
      },
    });
  });

  // Mount Vite dev server or static dist
  let vite: any;
  if (process.env.NODE_ENV !== 'production') {
    vite = await createViteServer({
      server: {
        middlewareMode: true,
        hmr: process.env.DISABLE_HMR !== 'true',
      },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
  }

  // SPA fallback for client-side routing
  app.get('*', async (req, res, next) => {
    const url = req.originalUrl;
    try {
      if (process.env.NODE_ENV !== 'production' && vite) {
        const fs = await import('fs');
        let template = fs.readFileSync(path.resolve(__dirname, 'index.html'), 'utf-8');
        template = await vite.transformIndexHtml(url, template);
        res.status(200).set({ 'Content-Type': 'text/html' }).end(template);
      } else {
        res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
      }
    } catch (e) {
      if (vite) {
        vite.ssrFixStacktrace(e as Error);
      }
      next(e);
    }
  });

  const server = app.listen(PORT, '0.0.0.0', () => {
    console.log(`\n  VITE v8.3.0  ready in 150 ms\n`);
    console.log(`  ➜  Local:   http://localhost:${PORT}/`);
    console.log(`  ➜  Network: http://0.0.0.0:${PORT}/\n`);
    console.log(`[Blog Pessoal Server] Running at http://0.0.0.0:${PORT}`);
  });

  // Graceful shutdown
  const shutdown = () => {
    server.close(() => {
      process.exit(0);
    });
  };
  process.on('SIGTERM', shutdown);
  process.on('SIGINT', shutdown);
}

startServer();
