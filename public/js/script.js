async function translateText() {

    const text =
        document.getElementById("text").value;

    const source =
        document.getElementById("source").value;

    const target =
        document.getElementById("target").value;

    if(text.trim() === ""){
        alert("Masukkan teks");
        return;
    }

    try{

        const response = await fetch(
            "/translate",
            {
                method: "POST",

                headers: {
                    "Content-Type":
                        "application/json"
                },

                body: JSON.stringify({
                    text,
                    source,
                    target
                })
            }
        );

        const data =
            await response.json();

        // tampilkan hasil translate
        document.getElementById("result")
            .innerText =
            data.translatedText;

        // tambah history otomatis
        addHistory(
            text,
            data.translatedText,
            source,
            target
        );

    }catch(error){

        console.log(error);

        alert("Translate gagal");
    }
}



// TAMBAH HISTORY KE TAMPILAN
function addHistory(
    text,
    result,
    source,
    target
){

    const historyBox =
        document.querySelector(".history-box");

    const card =
        document.createElement("div");

    card.className =
        "history-card";

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
                '${text}',
                '${result}',
                '${source}',
                '${target}'
            )"
        >
            Gunakan
        </button>
    `;

    const firstCard =
        historyBox.querySelector(".history-card");

    if(firstCard){

        historyBox.insertBefore(
            card,
            firstCard
        );

    }else{

        historyBox.appendChild(card);
    }
}



// GUNAKAN HISTORY
function useHistory(
    text,
    result,
    source,
    target
){

    document.getElementById("text")
        .value = text;

    document.getElementById("result")
        .innerText = result;

    document.getElementById("source")
        .value = source;

    document.getElementById("target")
        .value = target;
}



// JIKA TEXTAREA DIHAPUS
document.getElementById("text")
.addEventListener("input", function(){

    if(this.value.trim() === ""){

        document.getElementById("result")
            .innerText = "";
    }
});