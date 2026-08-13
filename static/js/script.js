const sendBtn = document.getElementById("send-btn");
const input = document.getElementById("user-input");
const chatBox = document.getElementById("chat-box");

sendBtn.addEventListener("click", sendMessage);

input.addEventListener("keypress", function(event) {
    if (event.key === "Enter") {
        sendMessage();
    }
});

function addMessage(message, className) {
    const div = document.createElement("div");
    div.className = className;
    div.innerText = message;
    chatBox.appendChild(div);
    chatBox.scrollTop = chatBox.scrollHeight;
}

async function sendMessage() {
    const message = input.value.trim();

    if (message === "") {
        return;
    }

    addMessage(message, "user-message");
    input.value = "";

    try {
        const response = await fetch("/chat", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                message: message
            })
        });

        const data = await response.json();

        if (data.type === "prediction") {
            showResultCard(data.department);
        } else {
            addMessage(data.reply, "bot-message");
        }

        if (data.type === "gender") {
            showOptions([
                { label: "👨 Male", value: "Male" },
                { label: "👩 Female", value: "Female" }
            ]);
        } else if (data.type === "duration") {
            showOptions([
                { label: "1 Day", value: "1" },
                { label: "2-3 Days", value: "3" },
                { label: "4-7 Days", value: "7" },
                { label: "More than 1 Week", value: "10" }
            ]);
        } else if (data.type === "severity") {
            showOptions([
                { label: "🟢 Low", value: "Low" },
                { label: "🟡 Medium", value: "Medium" },
                { label: "🟠 High", value: "High" },
                { label: "🔴 Critical", value: "Critical" }
            ]);
        }
    } catch (error) {
        console.error("JavaScript Error:", error);
        addMessage("Something went wrong. Please try again.", "bot-message");
    }
}

function showOptions(options) {
    input.disabled = true;
    sendBtn.disabled = true;

    const optionContainer = document.createElement("div");
    optionContainer.className = "option-container";

    options.forEach(function(option) {
        const btn = document.createElement("button");

        btn.innerText = option.label;
        btn.className = "option-btn";

        btn.onclick = function() {
            input.disabled = false;
            sendBtn.disabled = false;
            optionContainer.remove();
            input.value = option.value;
            sendMessage();
        };

        optionContainer.appendChild(btn);
    });

    chatBox.appendChild(optionContainer);
    chatBox.scrollTop = chatBox.scrollHeight;
}

function showResultCard(department) {
    const resultCard = document.createElement("div");

    resultCard.className = "result-card";

    resultCard.innerHTML = `
        <div class="result-icon">🏥</div>

        <div class="result-title">
            Recommended Department
        </div>

        <div class="department-name">
            ${department}
        </div>

        <div class="result-message">
            Based on the information you provided,
            this department may be appropriate
            for your symptoms.
        </div>

        <div class="medical-note">
            ⚠️ This recommendation is generated
            by a machine-learning model trained on
            the project dataset. It may be inaccurate
            and should not be considered a medical
            diagnosis.

            Please consult a qualified healthcare
            professional.
        </div>

        <button class="new-consultation-btn"
                onclick="startNewConsultation()">
            🔄 Start New Consultation
        </button>
    `;

    chatBox.appendChild(resultCard);
    chatBox.scrollTop = chatBox.scrollHeight;

    input.disabled = true;
    sendBtn.disabled = true;
}

function startNewConsultation() {
    window.location.reload();
}