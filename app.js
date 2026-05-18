const express = require("express");

const translate =
require("@vitalets/google-translate-api");

const mysql = require("mysql2");
const bodyParser = require("body-parser");
const cors = require("cors");

const app = express();

app.use(cors());
app.use(bodyParser.json());
app.use(express.static("public"));

app.set("view engine", "ejs");

const db = mysql.createConnection({
    host: "localhost",
    user: "root",
    password: "",
    database: "nlp_translator"
});

db.connect((err) => {

    if (err) {
        console.log("Database gagal terhubung");
    } else {
        console.log("Database berhasil terhubung");
    }
});


// HOME
app.get("/", (req, res) => {

    const sql =
        "SELECT * FROM history_translate ORDER BY id DESC";

    db.query(sql, (err, result) => {

        // jika error database
        if (err) {

            console.log(err);

            return res.render("index", {
                histories: []
            });
        }

        // jika kosong
        if(!result){
            result = [];
        }

        res.render("index", {
            histories: result
        });
    });
});


// TRANSLATE
app.post("/translate", async (req, res) => {

    const { text, source, target } = req.body;

    if(!text || text.trim() === ""){

        return res.json({
            translatedText: ""
        });
    }

    try {

        const result =
            await translate.translate(
                text,
                {
                    from: source,
                    to: target
                }
            );

        const translatedText =
            result.text;

        const sql = `
            INSERT INTO history_translate
            (
                text_asal,
                text_hasil,
                bahasa_asal,
                bahasa_tujuan
            )
            VALUES (?, ?, ?, ?)
        `;

        db.query(
            sql,
            [
                text,
                translatedText,
                source,
                target
            ],
            (err) => {

                if(err){
                    console.log(err);
                }
            }
        );

        res.json({
            translatedText
        });

    } catch (error) {

        console.log(error);

        res.json({
            translatedText:
                "Translate gagal"
        });
    }
});


// HAPUS SATU HISTORY
app.get("/delete/:id", (req, res) => {

    const id = req.params.id;

    db.query(
        "DELETE FROM history_translate WHERE id=?",
        [id],
        (err) => {

            if (err) {
                console.log(err);
            }

            res.redirect("/");
        }
    );
});


// HAPUS SEMUA HISTORY
app.get("/delete-all", (req, res) => {

    db.query(
        "DELETE FROM history_translate",
        (err) => {

            if(err){
                console.log(err);
            }

            res.redirect("/");
        }
    );
});


app.listen(3000, () => {

    console.log(
        "Server berjalan di http://localhost:3000"
    );
});