import { useState } from "react";
import "./App.css";

function App() {
	const [selectedFiles, setSelectedFiles] = useState([]);
	const [resizedImages, setResizedImages] = useState([]);
	const [isProcessing, setIsProcessing] = useState(false);

	const TARGET_WIDTH = 1920;
	const TARGET_HEIGHT = 1280;
	const PADDING_FACTOR = 0.5; // Adjust for padding effect

	const handleFileChange = (e) => {
		setSelectedFiles(Array.from(e.target.files));
		setResizedImages([]);
	};

	const resizeImages = async () => {
		setIsProcessing(true);
		const resizedArray = await Promise.all(
			selectedFiles.map((file) => resizeImageWithAspectRatio(file))
		);
		setResizedImages(resizedArray);
		setIsProcessing(false);
	};

	const resizeImageWithAspectRatio = (file) => {
		return new Promise((resolve) => {
			const reader = new FileReader();
			reader.onload = (event) => {
				const img = new Image();
				img.src = event.target.result;

				img.onload = () => {
					// Step 1: Fit image within a square canvas
					const squareSize = Math.max(TARGET_WIDTH, TARGET_HEIGHT);
					const squareCanvas = document.createElement("canvas");
					const squareCtx = squareCanvas.getContext("2d");

					squareCanvas.width = squareSize;
					squareCanvas.height = squareSize;

					// Fill square with white background
					squareCtx.fillStyle = "white";
					squareCtx.fillRect(0, 0, squareSize, squareSize);

					// Maintain aspect ratio, calculate new dimensions with padding factor
					const scale = Math.min(squareSize / img.width, squareSize / img.height);
					const newWidth = img.width * scale * PADDING_FACTOR;
					const newHeight = img.height * scale * PADDING_FACTOR;

					// Center the image within the square
					const offsetX = (squareSize - newWidth) / 2;
					const offsetY = (squareSize - newHeight) / 2;

					squareCtx.drawImage(img, offsetX, offsetY, newWidth, newHeight);

					// Step 2: Place square into a 1920x1280 canvas without stretching
					const finalCanvas = document.createElement("canvas");
					finalCanvas.width = TARGET_WIDTH;
					finalCanvas.height = TARGET_HEIGHT;
					const finalCtx = finalCanvas.getContext("2d");

					finalCtx.fillStyle = "white";
					finalCtx.fillRect(0, 0, TARGET_WIDTH, TARGET_HEIGHT);

					// Center the square canvas within the 1920x1280 canvas
					const offsetFinalX = (TARGET_WIDTH - squareSize) / 2;
					const offsetFinalY = (TARGET_HEIGHT - squareSize) / 2;

					finalCtx.drawImage(squareCanvas, offsetFinalX, offsetFinalY);

					// Convert final canvas to an image file
					finalCanvas.toBlob((blob) => {
						const resizedFile = new File([blob], file.name, { type: file.type });
						resolve(resizedFile);
					}, file.type);
				};
			};
			reader.readAsDataURL(file);
		});
	};

	const downloadImages = () => {
		resizedImages.forEach((image, index) => {
			const url = URL.createObjectURL(image);
			const a = document.createElement("a");
			a.href = url;
			a.download = image.name || `resized-image-${index}.jpg`;
			document.body.appendChild(a);
			a.click();
			document.body.removeChild(a);
			URL.revokeObjectURL(url);
		});
	};
	return (
		<>
			<h1>Batch Image Resizer</h1>
			<input type="file" multiple accept="image/*" onChange={handleFileChange} />
			<br />
			<button
				onClick={resizeImages}
				disabled={selectedFiles.length === 0 || isProcessing}
				style={{ marginTop: "10px", padding: "10px 20px" }}
			>
				{isProcessing ? "Processing..." : "Resize Images"}
			</button>
			<br />
			{resizedImages.length > 0 && (
				<button
					onClick={downloadImages}
					style={{ marginTop: "10px", padding: "10px 20px" }}
				>
					Download Resized Images
				</button>
			)}
		</>
	);
}

export default App;
