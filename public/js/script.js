// ======================
// TRANSLATE TEXT
// ======================

async function translateText() {

    const text = document.getElementById("text").value;
    const source = document.getElementById("source").value;
    const target = document.getElementById("target").value;

    if (text.trim() === "") {
        alert("Masukkan teks");
        return;
    }

    try {

        const response = await fetch("/translate", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                text,
                source,
                target
            })
        });

        const data = await response.json();

        document.getElementById("result").innerText =
            data.translatedText;

        addHistory(
            text,
            data.translatedText,
            source,
            target
        );

    } catch (err) {

        console.log(err);
        alert("Translate gagal");
    }
}

// ======================
// HISTORY UI
// ======================

function addHistory(text, result, source, target) {

    const box = document.querySelector(".history-box");

    const card = document.createElement("div");

    card.className = "history-card";

    card.innerHTML = `
        <div class="lang-row">
            <span>${source}</span>
            <span>→</span>
            <span>${target}</span>
        </div>

        <div class="history-text">
            ${text}
        </div>

        <div class="history-result">
            ${result}
        </div>

        <button
            class="use-btn"
            onclick="useHistory(
                \`${text}\`,
                \`${result}\`,
                \`${source}\`,
                \`${target}\`
            )"
        >
            Gunakan
        </button>
    `;

    box.prepend(card);
}

// ======================
// USE HISTORY
// ======================

function useHistory(
    text,
    result,
    source,
    target
) {

    document.getElementById("text").value =
        text;

    document.getElementById("result").innerText =
        result;

    document.getElementById("source").value =
        source;

    document.getElementById("target").value =
        target;
}

// ======================
// TOGGLE UPLOAD PANEL
// ======================

function toggleUpload() {

    const panel =
        document.getElementById("uploadPanel");

    panel.classList.toggle("active");
}

// ======================
// SHOW FILE NAME
// ======================

document
.getElementById("docInput")
.addEventListener("change", function () {

    const fileName =
        this.files[0]?.name ||
        "Belum ada file dipilih";

    document.getElementById("fileName")
    .innerText = fileName;
});

// ======================
// UPLOAD DOCUMENT
// ======================

async function uploadDoc() {

    const fileInput =
        document.getElementById("docInput");

    if (!fileInput.files[0]) {

        alert("Pilih file dulu");
        return;
    }

    const formData = new FormData();

    formData.append(
        "file",
        fileInput.files[0]
    );

    try {

        // loading text
        document.getElementById("result")
        .innerText = "AI sedang membaca dokumen...";

        const response =
            await fetch("/upload-doc", {
                method: "POST",
                body: formData
            });

        const data =
            await response.json();

        // hasil OCR
        document.getElementById("text").value =
            data.text;

        // auto close panel
        document
        .getElementById("uploadPanel")
        .classList.remove("active");

        // auto translate
        if (
            data.text &&
            data.text.length > 0
        ) {

            setTimeout(() => {

                translateText();

            }, 300);

        } else {

            document.getElementById("result")
            .innerText =
                "Tidak ada teks terdeteksi";
        }

    } catch (err) {

        console.log(err);

        alert("Upload gagal");
    }
}

// ======================
// CLEAR RESULT AUTO
// ======================

document
.getElementById("text")
.addEventListener("input", function () {

    if (this.value.trim() === "") {

        document.getElementById("result")
        .innerText = "";
    }
});

// ======================
// CTRL + V IMAGE OCR
// ======================

document.addEventListener(
    "paste",
    async (event) => {

        const items =
            event.clipboardData.items;

        for (let item of items) {

            // cek apakah gambar
            if (
                item.type.indexOf("image")
                !== -1
            ) {

                const file =
                    item.getAsFile();

                const formData =
                    new FormData();

                formData.append(
                    "file",
                    file
                );

                try {

                    // loading
                    document.getElementById(
                        "result"
                    ).innerText =
                        "AI sedang membaca gambar hasil paste...";

                    const response =
                        await fetch(
                            "/upload-doc",
                            {
                                method: "POST",
                                body: formData
                            }
                        );

                    const data =
                        await response.json();

                    // hasil OCR
                    document.getElementById(
                        "text"
                    ).value =
                        data.text;

                    // auto translate
                    if (
                        data.text &&
                        data.text.length > 0
                    ) {

                        setTimeout(() => {

                            translateText();

                        }, 300);

                    } else {

                        document.getElementById(
                            "result"
                        ).innerText =
                            "Teks tidak terdeteksi";
                    }

                } catch (err) {

                    console.log(err);

                    alert(
                        "Paste gambar gagal"
                    );
                }
            }
        }
    }
);
