const video = document.getElementById('video');
const canvas = document.getElementById('canvas');
const resultDiv = document.getElementById('result');
const ctx = canvas.getContext('2d');

let model;

// Configuración de la carga del modelo para mayor precisión
const modelConfig = {
    base: 'mobilenet_v2' // Usar V2 para mejor precisión que la versión lite
};

// Acceder a la cámara con alta calidad
async function startCamera() {
    try {
        const stream = await navigator.mediaDevices.getUserMedia({ 
            video: { 
                facingMode: { ideal: "environment" },
                width: { ideal: 1280 },
                height: { ideal: 720 }
            } 
        });
        video.srcObject = stream;
        video.onloadedmetadata = () => {
            video.play();
            resizeCanvas();
        };
    } catch (error) {
        console.error('Error al acceder a la cámara:', error);
        resultDiv.innerText = '¡Ups! No puedo acceder a la cámara. 😞';
    }
}

function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
}

// Cargar COCO-SSD
cocoSsd.load(modelConfig).then(loadedModel => {
    model = loadedModel;
    console.log('Modelo COCO-SSD de alta precisión cargado');
    resultDiv.innerText = '¡Listo! Escaneando...';
    detectFrame();
});

async function detectFrame() {
    if (model && video.readyState === 4) {
        // Ajustamos el umbral (score) para detectar más objetos
        const predictions = await model.detect(video, 20, 0.4);
        drawPredictions(predictions);
        
        if (predictions.length > 0) {
            resultDiv.innerText = predictions
                .map(p => `${p.class.toUpperCase()}`)
                .slice(0, 3)
                .join(' | ');
        } else {
            resultDiv.innerText = 'Escaneando... 🔍';
        }
    }
    requestAnimationFrame(detectFrame);
}

function drawPredictions(predictions) {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Cálculo para mapear coordenadas de video (object-fit: cover) a canvas
    const vWidth = video.videoWidth;
    const vHeight = video.videoHeight;
    const cWidth = canvas.width;
    const cHeight = canvas.height;

    const scale = Math.max(cWidth / vWidth, cHeight / vHeight);
    const xOffset = (cWidth - vWidth * scale) / 2;
    const yOffset = (cHeight - vHeight * scale) / 2;

    predictions.forEach(prediction => {
        let [x, y, width, height] = prediction.bbox;
        
        // Escalar coordenadas
        x = x * scale + xOffset;
        y = y * scale + yOffset;
        width = width * scale;
        height = height * scale;

        // Estilo del rectángulo (Cyberpunk / Moderno)
        ctx.strokeStyle = '#b3ff7d';
        ctx.lineWidth = 3;
        ctx.setLineDash([5, 5]); // Línea punteada para efecto escáner
        ctx.strokeRect(x, y, width, height);
        ctx.setLineDash([]); // Reset

        // Esquinas reforzadas
        ctx.lineWidth = 6;
        const cornerSize = 20;
        // Top Left
        ctx.beginPath(); ctx.moveTo(x, y + cornerSize); ctx.lineTo(x, y); ctx.lineTo(x + cornerSize, y); ctx.stroke();
        // Top Right
        ctx.beginPath(); ctx.moveTo(x + width - cornerSize, y); ctx.lineTo(x + width, y); ctx.lineTo(x + width, y + cornerSize); ctx.stroke();
        // Bottom Left
        ctx.beginPath(); ctx.moveTo(x, y + height - cornerSize); ctx.lineTo(x, y + height); ctx.lineTo(x + cornerSize, y + height); ctx.stroke();
        // Bottom Right
        ctx.beginPath(); ctx.moveTo(x + width - cornerSize, y + height); ctx.lineTo(x + width, y + height); ctx.lineTo(x + width, y + height - cornerSize); ctx.stroke();

        // Etiqueta
        ctx.fillStyle = '#b3ff7d';
        ctx.font = 'bold 18px Inter, sans-serif';
        const labelText = `${prediction.class} ${(prediction.score * 100).toFixed(0)}%`;
        const textWidth = ctx.measureText(labelText).width;
        
        ctx.fillRect(x, y - 30, textWidth + 15, 30);
        ctx.fillStyle = '#000000';
        ctx.fillText(labelText, x + 7, y - 8);
    });
}

window.addEventListener('resize', resizeCanvas);
startCamera();
