
const micButton = document.getElementById("micButton");
const stopButton = document.getElementById("stopRecord");
const cancelButton = document.getElementById("cancelRecord");

const recordingBox = document.getElementById("recordingBox");
const previewBox = document.getElementById("previewBox");

const timerElement = document.getElementById("timer");
const audioPreview = document.getElementById("audioPreview");

const commentInput = document.getElementById("commentInput");
const sendCommentButton = document.getElementById("sendComment");

const sendAudioButton = document.getElementById("sendAudio");
const deleteAudioButton = document.getElementById("deleteAudio");

const commentList = document.getElementById("commentList");

const postLike = document.getElementById("postLike");
const postLikes = document.getElementById("postLikes");
const commentFocus = document.getElementById("commentFocus");

// Recording variables
let mediaRecorder = null;
let audioChunks = [];
let audioBlob = null;
let audioURL = null;
let microphoneStream = null;

let timerInterval = null;
let seconds = 0;
let isPostLiked = false;

// Comments
let comments = [];


// -----------------------------
// Load saved text comments
// -----------------------------

try {
    comments = JSON.parse(
        localStorage.getItem("instagramComments") || "[]"
    );
} catch {
    comments = [];
}

renderComments();


// -----------------------------
// Post like
// -----------------------------

postLike.addEventListener("click", () => {

    isPostLiked = !isPostLiked;

    postLike.textContent = isPostLiked ? "♥" : "♡";

    postLike.style.color = isPostLiked ? "red" : "white";

    let likes = Number(postLikes.textContent);

    postLikes.textContent = isPostLiked
        ? likes + 1
        : likes - 1;
});


// -----------------------------
// Focus comment
// -----------------------------

commentFocus.addEventListener("click", () => {
    commentInput.focus();
});


// -----------------------------
// Start recording
// -----------------------------

micButton.addEventListener("click", async () => {

    if (mediaRecorder && mediaRecorder.state === "recording") {
        return;
    }

    if (!navigator.mediaDevices ||
        !navigator.mediaDevices.getUserMedia ||
        !window.MediaRecorder) {

        alert(
            "Your browser does not support microphone recording. " +
            "Use a recent version of Chrome or Edge."
        );

        return;
    }

    try {

        microphoneStream =
            await navigator.mediaDevices.getUserMedia({
                audio: true
            });

        audioChunks = [];

        mediaRecorder = new MediaRecorder(microphoneStream);

        mediaRecorder.ondataavailable = (event) => {

            if (event.data.size > 0) {
                audioChunks.push(event.data);
            }
        };

mediaRecorder.onstop = () => {

    stopTimer();

    audioBlob = new Blob(audioChunks, {
        type: audioChunks[0]?.type || "audio/webm"
    });

    if (audioBlob.size === 0) {
        alert("No voice recorded. Please try again.");
        recordingBox.classList.add("hidden");
        releaseMicrophone();
        return;
    }

    audioURL = URL.createObjectURL(audioBlob);

    audioPreview.src = audioURL;

    recordingBox.classList.add("hidden");
    previewBox.classList.remove("hidden");

    releaseMicrophone();

    console.log("Voice recorded:", audioBlob.size, "bytes");
};

        

        mediaRecorder.start();

        recordingBox.classList.remove("hidden");
        previewBox.classList.add("hidden");

        seconds = 0;

        timerElement.textContent = "00:00";

        startTimer();

    } catch (error) {

        console.error(error);

        alert(
            "Microphone permission denied or unavailable. " +
            "Please allow microphone access."
        );

        releaseMicrophone();
    }
});


// -----------------------------
// Stop recording
// -----------------------------

stopButton.addEventListener("click", () => {

    if (mediaRecorder &&
        mediaRecorder.state === "recording") {

        mediaRecorder.stop();
    }
});


// -----------------------------
// Cancel recording
// -----------------------------

cancelButton.addEventListener("click", () => {

    if (mediaRecorder &&
        mediaRecorder.state === "recording") {

        mediaRecorder.onstop = () => {

            stopTimer();
            releaseMicrophone();

            recordingBox.classList.add("hidden");
        };

        mediaRecorder.stop();

    } else {

        recordingBox.classList.add("hidden");

        stopTimer();

        releaseMicrophone();
    }
});


// -----------------------------
// Delete recorded audio
// -----------------------------

deleteAudioButton.addEventListener("click", () => {

    clearAudio();

    previewBox.classList.add("hidden");
});


// -----------------------------
// Send voice comment
// -----------------------------

sendAudioButton.addEventListener("click", () => {

    if (!audioBlob) {
        alert("Please record a voice message first.");
        return;
    }

    const username = "madara_official";

    const comment = {
        id: Date.now(),
        username: username,
        type: "voice",
        audio: audioURL,
        createdAt: new Date().toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit"
        }),
        liked: false
    };

comments.push(comment);

renderComments();

// Clear the preview, but keep the posted audio URL valid
audioPreview.pause();
audioPreview.removeAttribute("src");
audioPreview.load();

audioBlob = null;
audioChunks = [];
audioURL = null;

previewBox.classList.add("hidden");

});


// -----------------------------
// Send text comment
// -----------------------------

sendCommentButton.addEventListener("click", () => {

    const text = commentInput.value.trim();

    if (text === "") {
        return;
    }

    const comment = {
        id: Date.now(),
        username: "madara_official",
        type: "text",
        text: text,
        createdAt: new Date().toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit"
        }),
        liked: false
    };

    comments.push(comment);

    saveTextComments();

    renderComments();

    commentInput.value = "";
});


// Enter key to send text comment

commentInput.addEventListener("keydown", (event) => {

    if (event.key === "Enter") {
        sendCommentButton.click();
    }
});


// -----------------------------
// Render comments
// -----------------------------

function renderComments() {

    commentList.innerHTML = "";

    comments.forEach((comment) => {

        const commentElement = document.createElement("div");

        commentElement.className = "comment";

        // Avatar
        const avatar = document.createElement("div");

        avatar.className = "avatar small";

        avatar.textContent = "M";

        // Content
        const content = document.createElement("div");

        content.className = "comment-content";

        const text = document.createElement("p");

        const username = document.createElement("strong");

        username.textContent = comment.username;

        text.appendChild(username);

        if (comment.type === "text") {

            text.appendChild(
                document.createTextNode(" " + comment.text)
            );

        } else {

            text.appendChild(
                document.createTextNode(" 🎙️ Voice message")
            );

            const audio = document.createElement("audio");

            audio.controls = true;

            audio.className = "voice-player";

            audio.src = comment.audio;

            content.appendChild(text);

            content.appendChild(audio);
        }

        if (comment.type === "text") {
            content.appendChild(text);
        }

        // Time
        const time = document.createElement("div");

        time.className = "comment-time";

        time.textContent = comment.createdAt || "Just now";

        content.appendChild(time);

        // Like button
        const likeButton = document.createElement("button");

        likeButton.className = "comment-like";

        likeButton.textContent = comment.liked ? "♥" : "♡";

        if (comment.liked) {
            likeButton.classList.add("liked");
        }

        likeButton.addEventListener("click", () => {

            comment.liked = !comment.liked;

            renderComments();

            saveTextComments();
        });

        commentElement.appendChild(avatar);

        commentElement.appendChild(content);

        commentElement.appendChild(likeButton);

        commentList.appendChild(commentElement);
    });
}


// -----------------------------
// Save text comments
// -----------------------------

function saveTextComments() {

    const textComments = comments.filter(
        comment => comment.type === "text"
    );

    localStorage.setItem(
        "instagramComments",
        JSON.stringify(textComments)
    );
}


// -----------------------------
// Timer
// -----------------------------

function startTimer() {

    stopTimer();

    timerInterval = setInterval(() => {

        seconds++;

        const minutes = Math.floor(seconds / 60);

        const remainingSeconds = seconds % 60;

        timerElement.textContent =
            String(minutes).padStart(2, "0") +
            ":" +
            String(remainingSeconds).padStart(2, "0");

        if (seconds >= 120) {

            if (mediaRecorder &&
                mediaRecorder.state === "recording") {

                mediaRecorder.stop();
            }
        }

    }, 1000);
}


function stopTimer() {

    clearInterval(timerInterval);

    timerInterval = null;
}


// -----------------------------
// Release microphone
// -----------------------------

function releaseMicrophone() {

    if (microphoneStream) {

        microphoneStream.getTracks().forEach(track => {
            track.stop();
        });

        microphoneStream = null;
    }
}


// -----------------------------
// Clear audio
// -----------------------------

function clearAudio() {

    audioPreview.pause();

    audioPreview.removeAttribute("src");

    audioPreview.load();

    if (audioURL) {

        URL.revokeObjectURL(audioURL);

        audioURL = null;
    }

    audioBlob = null;

    audioChunks = [];
}
