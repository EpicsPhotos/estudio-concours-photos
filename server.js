
const express = require('express');
const multer = require('multer');
const sharp = require('sharp');
const fs = require('fs');
const path = require('path');
const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.static('public'));
app.use(express.json());

const storage = multer.memoryStorage();
const upload = multer({ storage });

const ensurePhotosDir = () => {
  const dir = path.join(__dirname, 'public', 'photos');
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
};
ensurePhotosDir();

app.post('/upload', upload.single('photo'), (req, res) => {
  const username = req.body.username || 'anonymous';
  const ext = 'jpg';
  const filename = `${Date.now()}_${username}.${ext}`;
  const filepath = path.join(__dirname, 'public', 'photos', filename);

  sharp(req.file.buffer)
    .resize({ width: 1024 })
    .jpeg({ quality: 70 })
    .toFile(filepath, (err, info) => {
      if (err) {
        console.error("Erreur compression :", err);
        return res.status(500).send("Erreur lors de l'enregistrement.");
      }
      res.redirect('/page_concours.html');
    });
});

// ADMIN routes (pour theme, prix, usernames)

app.get('/admin/theme', (req, res) => {
  fs.readFile('./theme_du_mois.txt', 'utf8', (err, data) => {
    if (err) return res.status(500).send('');
    res.send(data);
  });
});
app.post('/admin/theme', (req, res) => {
  fs.writeFile('./theme_du_mois.txt', req.body.content, err => {
    if (err) return res.status(500).send('Erreur écriture');
    res.sendStatus(200);
  });
});

app.get('/admin/prix', (req, res) => {
  fs.readFile('./prix_du_mois.txt', 'utf8', (err, data) => {
    if (err) return res.status(500).send('');
    res.send(data);
  });
});
app.post('/admin/prix', (req, res) => {
  fs.writeFile('./prix_du_mois.txt', req.body.content, err => {
    if (err) return res.status(500).send('Erreur écriture');
    res.sendStatus(200);
  });
});

app.get('/admin/usernames', (req, res) => {
  fs.readFile('./usernames.txt', 'utf8', (err, data) => {
    if (err) return res.status(500).send('');
    res.send(data);
  });
});
app.post('/admin/usernames', (req, res) => {
  fs.writeFile('./usernames.txt', req.body.content, err => {
    if (err) return res.status(500).send('Erreur écriture');
    res.sendStatus(200);
  });
});

app.get('/admin/users', (req, res) => {
  fs.readFile('./usernames.txt', 'utf8', (err, data) => {
    if (err) return res.status(500).send([]);
    const list = data.split('\n').filter(Boolean);
    res.json(list);
  });
});
app.post('/admin/remove-user', express.json(), (req, res) => {
  const username = req.body.username;
  fs.readFile('./usernames.txt', 'utf8', (err, data) => {
    if (err) return res.status(500).send('Erreur lecture');
    const updated = data.split('\n').filter(u => u.trim() !== username).join('\n');
    fs.writeFile('./usernames.txt', updated + '\n', (err2) => {
      if (err2) return res.status(500).send('Erreur écriture');
      res.sendStatus(200);
    });
  });
});
app.post('/admin/reset', (req, res) => {
  fs.writeFile('./usernames.txt', '', (err) => {
    if (err) return res.status(500).send('Erreur reset');
    res.sendStatus(200);
  });
});

app.listen(PORT, () => {
  console.log(`Serveur en cours d'exécution sur http://localhost:${PORT}`);
});


app.delete('/photos/:filename', (req, res) => {
  const fs = require('fs');
  const path = require('path');
  const photosDir = path.join(__dirname, 'public', 'photos');
  const fileToDelete = path.join(photosDir, req.params.filename);

  // Supprimer le fichier demandé
  fs.unlink(fileToDelete, err => {
    if (err) return res.status(500).send('Erreur suppression');

    // Lire les autres fichiers
    fs.readdir(photosDir, (err2, files) => {
      if (err2) return res.status(500).send('Erreur lecture dossier');

      const jpgs = files.filter(f => f.endsWith('.jpg') || f.endsWith('.jpeg')).sort();
      const newFilenames = jpgs.map((f, i) => `photo (${i + 1}).jpg`);

      // Renommer les fichiers restants
      Promise.all(jpgs.map((oldName, idx) => {
        const oldPath = path.join(photosDir, oldName);
        const newPath = path.join(photosDir, newFilenames[idx]);
        return fs.promises.rename(oldPath, newPath);
      }))
      .then(() => res.sendStatus(200))
      .catch(e => {
        console.error("Erreur renommage :", e);
        res.status(500).send("Erreur renommage");
      });
    });
  });
});