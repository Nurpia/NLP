const express = require("express");
const translate = require("@vitalets/google-translate-api");
const mysql = require("mysql2");
const bodyParser = require("body-parser");
const cors = require("cors");

const multer = require("multer");
const Tesseract = require("tesseract.js");
const sharp = require("sharp");

const fs = require("fs");
const pdfParse = require("pdf-parse");

const app = express();

app.use(cors());
app.use(bodyParser.json());
app.use(express.static("public"));

app.set("view engine", "ejs");

// ======================
// UPLOAD CONFIG
// ======================
const upload = multer({
    dest: "uploads/",
    fileFilter: (req, file, cb) => {
        if (
            file.mimetype.startsWith("image") ||
            file.mimetype === "application/pdf"
        ) {
            cb(null, true);
        } else {
            cb(new Error("Hanya image / PDF"));
        }
    }
});

// ======================
// DATABASE
// ======================
const db = mysql.createConnection({
    host: "localhost",
    user: "root",
    password: "",
    database: "nlp_translator"
});

db.connect((err) => {
    if (err) console.log("DB ERROR");
    else console.log("DB CONNECTED");
});

// ======================
// HOME
// ======================
app.get("/", (req, res) => {

    db.query(
        "SELECT * FROM history_translate ORDER BY id DESC",
        (err, result) => {

            if (err) return res.render("index", { histories: [] });

            res.render("index", {
                histories: result || []
            });
        }
    );
});

// ======================
// TRANSLATE + SLANG NLP
// ======================
app.post("/translate", (req, res) => {

    const { text, source, target } = req.body;

    if (!text || text.trim() === "") {
        return res.json({ translatedText: "" });
    }

    db.query("SELECT * FROM kamus_slang", async (err, slangResults) => {

        if (err) {
            return res.json({ translatedText: "DB error" });
        }

        let processedText = text.toLowerCase();

        slangResults.forEach(item => {
            const regex = new RegExp(`\\b${item.kata_slang}\\b`, "gi");
            processedText = processedText.replace(regex, item.kata_formal);
        });

        try {

            const result = await translate.translate(
                processedText,
                { from: source, to: target }
            );

            const translatedText = result.text;

            db.query(
                `INSERT INTO history_translate
                (text_asal, text_hasil, bahasa_asal, bahasa_tujuan)
                VALUES (?, ?, ?, ?)`,
                [processedText, translatedText, source, target]
            );

            res.json({ translatedText });

        } catch (error) {
            console.log(error);
            res.json({ translatedText: "Translate gagal" });
        }
    });
});

// ======================
// OCR + PDF + IMAGE UPLOAD
// ======================
app.post("/upload-doc", upload.single("file"), async (req, res) => {

    if (!req.file) {
        return res.json({ text: "Tidak ada file" });
    }

    try {

        // ======================
        // IMAGE OCR
        // ======================
        if (req.file.mimetype.startsWith("image")) {

            const fixedPath = "uploads/fixed.png";

            await sharp(req.file.path)
                .grayscale()
                .resize({ width: 2000 })
                .normalize()
                .sharpen()
                .threshold(140)
                .toFile(fixedPath);

            const result = await Tesseract.recognize(
                fixedPath,
                "eng",
                {
                    logger: m => console.log(m),
                    tessedit_pageseg_mode: 6
                }
            );

            let text = result.data.text || "";

            text = text
                .replace(/[^\w\s.,!?]/g, " ")
                .replace(/\s+/g, " ")
                .trim();

            return res.json({ text });
        }

        // ======================
        // PDF FULL TEXT (FIXED)
        // ======================
        if (req.file.mimetype === "application/pdf") {

            const dataBuffer = fs.readFileSync(req.file.path);

            const pdfData = await pdfParse(dataBuffer);

            let text = pdfData.text;

            text = text
                .replace(/\s+/g, " ")
                .trim();

            if (!text) {
                return res.json({
                    text: "PDF tidak mengandung teks (kemungkinan scan gambar)"
                });
            }

            return res.json({ text });
        }

    } catch (err) {
        console.log(err);
        res.json({ text: "Gagal membaca file" });
    }
});

// ======================
// DELETE HISTORY
// ======================
app.get("/delete/:id", (req, res) => {
    db.query("DELETE FROM history_translate WHERE id=?", [req.params.id], () => {
        res.redirect("/");
    });
});

app.get("/delete-all", (req, res) => {
    db.query("DELETE FROM history_translate", () => {
        res.redirect("/");
    });
});

// ======================
// SERVER
// ======================
app.listen(3000, () => {
    console.log("Server jalan di http://localhost:3000");
});
