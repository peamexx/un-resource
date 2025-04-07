const express = require("express");
const multer = require("multer");
const unzipper = require("unzipper");
const fs = require("fs");
const path = require("path");
const cheerio = require("cheerio");
const cors = require("cors");

const app = express();
app.use(cors()); 
const upload = multer({ dest: "uploads/" });

const extractZip = (zipPath, extractTo) => {
  return fs
    .createReadStream(zipPath)
    .pipe(unzipper.Extract({ path: extractTo }))
    .promise();
};

const scanFiles = (dir) => {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach((file) => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    if (stat && stat.isDirectory()) {
      results = results.concat(scanFiles(filePath));
    } else {
      results.push(path.relative(dir, filePath).replace(/\\/g, "/"));
    }
  });
  return results;
};

const extractResourcesFromHTML = (htmlPath) => {
  const content = fs.readFileSync(htmlPath, "utf-8");
  const $ = cheerio.load(content);
  const resources = new Set();

  $("img[src], script[src], link[href]").each((_, el) => {
    const src = $(el).attr("src") || $(el).attr("href");
    if (src) {
      resources.add(src.replace(/^\//, ""));
    }
  });

  return resources;
};

app.post("/upload", upload.single("folder"), async (req, res) => {
  const zipPath = req.file.path;
  const extractPath = path.join("extracted", Date.now().toString());
  fs.mkdirSync(extractPath, { recursive: true });

  await extractZip(zipPath, extractPath);

  const allFiles = scanFiles(extractPath);
  const htmlFiles = allFiles.filter((f) => f.endsWith(".html"));

  const usedResources = new Set();
  htmlFiles.forEach((relPath) => {
    const absPath = path.join(extractPath, relPath);
    const found = extractResourcesFromHTML(absPath);
    found.forEach((r) => usedResources.add(r));
  });

  const missing = Array.from(usedResources).filter(
    (res) => !allFiles.includes(res)
  );
  const unused = allFiles.filter(
    (file) => !usedResources.has(file) && !file.endsWith(".html")
  );

  res.json({ missing, unused });

  fs.rmSync(zipPath);
  fs.rmSync(extractPath, { recursive: true, force: true });
});

app.listen(3001, () => console.log("Server running on http://localhost:3001"));
