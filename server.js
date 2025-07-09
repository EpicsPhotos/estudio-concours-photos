const express = require('express');
const multer = require('multer');
const { v2: cloudinary } = require('cloudinary');
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const path = require('path');
const fs = require('fs');

const app = express();
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

cloudinary.config({
  cloud_name: 'dhezgooph',
  api_key: '261332123791848',
  api_secret: 'T3Vu0vw1b4crf35NFPecBlHd_rw'
});

const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'concours_photos',
    format: async (req, file) => 'jpg',
    public_id: (req, file) => Date.now() + '-' + file.originalname
  }
});

const upload = multer({ storage: storage });
const URLS_FILE = 'urls.txt';

// Upload + enregistrement de l'URL dans urls.txt
app.post('/upload', upload.single('photo'), (req, res) => {
  if (!req.file || !req.file.path) {
    return res.status(400).json({ error: "Erreur d'envoi" });
  }

  fs.appendFile(URLS_FILE, req.file.path + '\n', (err) => {
    if (err) console.error("Erreur d'enregistrement dans urls.txt");
  });

  res.json({ url: req.file.path });
});

// Route pour lire toutes les URLs
app.get('/photos', (req, res) => {
  fs.readFile(URLS_FILE, 'utf8', (err, data) => {
    if (err) return res.status(500).json({ error: "Erreur lecture URLs" });
    const urls = data.split('\n').filter(line => line.trim() !== '');
    res.json(urls);
  });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log("Serveur lancé sur le port " + PORT));