/**
 * Generate standalone HTML decryption tool
 * This creates a self-contained HTML file that users can open in any browser
 * to decrypt their exported photos without needing any server
 */
export const generateDecryptionTool = () => {
	return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Halycron Photo Decryption Tool</title>
    <style>
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { 
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%);
            color: #f8fafc;
            min-height: 100vh;
            padding: 20px;
        }
        .container { 
            max-width: 800px; 
            margin: 0 auto; 
            background: rgba(30, 41, 59, 0.5);
            backdrop-filter: blur(10px);
            border: 1px solid rgba(148, 163, 184, 0.1);
            border-radius: 16px;
            padding: 32px;
        }
        .header { text-align: center; margin-bottom: 32px; }
        .logo { color: #06b6d4; font-size: 24px; font-weight: bold; margin-bottom: 8px; }
        .subtitle { color: #94a3b8; }
        .step { 
            background: rgba(15, 23, 42, 0.5);
            border: 1px solid rgba(148, 163, 184, 0.1);
            border-radius: 12px;
            padding: 24px;
            margin-bottom: 20px;
        }
        .step-title { color: #06b6d4; font-weight: 600; margin-bottom: 12px; }
        input[type="file"], input[type="password"] {
            width: 100%;
            padding: 12px;
            background: rgba(15, 23, 42, 0.8);
            border: 1px solid rgba(148, 163, 184, 0.2);
            border-radius: 8px;
            color: #f8fafc;
            margin: 8px 0;
        }
        button {
            background: linear-gradient(135deg, #06b6d4, #0891b2);
            color: white;
            border: none;
            padding: 12px 24px;
            border-radius: 8px;
            cursor: pointer;
            font-weight: 600;
            transition: all 0.2s;
        }
        button:hover { transform: translateY(-1px); box-shadow: 0 4px 12px rgba(6, 182, 212, 0.3); }
        button:disabled { opacity: 0.5; cursor: not-allowed; transform: none; }
        .progress { 
            width: 100%; 
            height: 8px; 
            background: rgba(15, 23, 42, 0.8);
            border-radius: 4px; 
            overflow: hidden;
            margin: 12px 0;
        }
        .progress-bar { 
            height: 100%; 
            background: linear-gradient(90deg, #06b6d4, #0891b2);
            width: 0%; 
            transition: width 0.3s;
        }
        .gallery { 
            display: grid; 
            grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); 
            gap: 16px;
            margin-top: 20px;
        }
        .photo-item {
            background: rgba(15, 23, 42, 0.5);
            border: 1px solid rgba(148, 163, 184, 0.1);
            border-radius: 12px;
            overflow: hidden;
            transition: transform 0.2s;
        }
        .photo-item:hover { transform: scale(1.02); }
        .photo-item img { width: 100%; height: 150px; object-fit: cover; }
        .photo-info { padding: 12px; font-size: 14px; color: #94a3b8; }
        .error { color: #ef4444; background: rgba(239, 68, 68, 0.1); padding: 12px; border-radius: 8px; margin: 8px 0; }
        .success { color: #10b981; background: rgba(16, 185, 129, 0.1); padding: 12px; border-radius: 8px; margin: 8px 0; }
        .warning {
            background: rgba(245, 158, 11, 0.1);
            border: 1px solid rgba(245, 158, 11, 0.2);
            color: #f59e0b;
            padding: 16px;
            border-radius: 8px;
            margin-bottom: 24px;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <div class="logo">🔒 Halycron Photo Decryption Tool</div>
            <div class="subtitle">Decrypt your exported photos securely in your browser</div>
        </div>

        <div class="warning">
            ⚠️ <strong>Security Notice:</strong> This tool works entirely in your browser. Your encryption keys and photos never leave your device.
        </div>

        <div class="step">
            <div class="step-title">Step 1: Load Your Export Package</div>
            <input type="file" id="manifestFile" accept=".json" placeholder="Select manifest.json">
            <div id="manifestStatus"></div>
        </div>

        <div class="step">
            <div class="step-title">Step 2: Load Photos Folder</div>
            <input type="file" id="photosFolder" webkitdirectory multiple>
            <div id="photosStatus"></div>
        </div>

        <div class="step">
            <div class="step-title">Step 3: Enter Your Encryption Password</div>
            <input type="password" id="encryptionPassword" placeholder="Enter your account password">
            <button onclick="startDecryption()" id="decryptBtn">Start Decryption</button>
        </div>

        <div class="step" id="progressStep" style="display: none;">
            <div class="step-title">Decryption Progress</div>
            <div class="progress">
                <div class="progress-bar" id="progressBar"></div>
            </div>
            <div id="progressText">Preparing...</div>
        </div>

        <div id="results"></div>
        <div id="gallery" class="gallery"></div>
    </div>

    <script>
        let manifest = null;
        let photos = [];
        let photoFiles = new Map();
        
        document.getElementById('manifestFile').addEventListener('change', function(e) {
            const file = e.target.files[0];
            if (!file) return;
            
            const reader = new FileReader();
            reader.onload = function(e) {
                try {
                    manifest = JSON.parse(e.target.result);
                    document.getElementById('manifestStatus').innerHTML = 
                        '<div class="success">✅ Manifest loaded: ' + manifest.photos.length + ' photos found</div>';
                    photos = manifest.photos;
                } catch (error) {
                    document.getElementById('manifestStatus').innerHTML = 
                        '<div class="error">❌ Invalid manifest file</div>';
                }
            };
            reader.readAsText(file);
        });

        document.getElementById('photosFolder').addEventListener('change', function(e) {
            const files = Array.from(e.target.files);
            photoFiles.clear();
            
            files.forEach(file => {
                const fileName = file.name;
                photoFiles.set(fileName, file);
            });
            
            document.getElementById('photosStatus').innerHTML = 
                '<div class="success">✅ Photos folder loaded: ' + files.length + ' files found</div>';
        });

        async function deriveKey(password, salt) {
            const encoder = new TextEncoder();
            const keyMaterial = await crypto.subtle.importKey(
                'raw',
                encoder.encode(password),
                { name: 'PBKDF2' },
                false,
                ['deriveKey']
            );
            
            return crypto.subtle.deriveKey(
                {
                    name: 'PBKDF2',
                    salt: salt,
                    iterations: 100000,
                    hash: 'SHA-256'
                },
                keyMaterial,
                { name: 'AES-GCM', length: 256 },
                false,
                ['decrypt']
            );
        }

        async function decryptData(encryptedData, key, iv) {
            return crypto.subtle.decrypt(
                { name: 'AES-GCM', iv: iv },
                key,
                encryptedData
            );
        }

        function base64ToArrayBuffer(base64) {
            const binaryString = atob(base64);
            const bytes = new Uint8Array(binaryString.length);
            for (let i = 0; i < binaryString.length; i++) {
                bytes[i] = binaryString.charCodeAt(i);
            }
            return bytes.buffer;
        }

        async function startDecryption() {
            if (!manifest || !photos.length) {
                alert('Please load a manifest file first');
                return;
            }
            
            if (photoFiles.size === 0) {
                alert('Please load the photos folder first');
                return;
            }
            
            const password = document.getElementById('encryptionPassword').value;
            if (!password) {
                alert('Please enter your encryption password');
                return;
            }

            document.getElementById('progressStep').style.display = 'block';
            document.getElementById('decryptBtn').disabled = true;
            
            const gallery = document.getElementById('gallery');
            gallery.innerHTML = '';
            
            for (let i = 0; i < photos.length; i++) {
                const photo = photos[i];
                const progress = ((i + 1) / photos.length) * 100;
                
                document.getElementById('progressBar').style.width = progress + '%';
                document.getElementById('progressText').textContent = 
                    'Decrypting photo ' + (i + 1) + ' of ' + photos.length + '...';
                
                try {
                    // Derive key from password and user-specific salt
                    const salt = new TextEncoder().encode(manifest.userId || 'halycron');
                    const key = await deriveKey(password, salt);
                    
                    // Decrypt the file key
                    const encryptedFileKey = base64ToArrayBuffer(photo.encryptedFileKey);
                    const fileKeyIv = base64ToArrayBuffer(photo.fileKeyIv);
                    const fileKeyBuffer = await decryptData(encryptedFileKey, key, fileKeyIv);
                    const fileKey = await crypto.subtle.importKey(
                        'raw',
                        fileKeyBuffer,
                        { name: 'AES-GCM' },
                        false,
                        ['decrypt']
                    );
                    
                    // Get the photo file from the loaded folder
                    const photoFile = photoFiles.get(photo.originalFilename);
                    if (!photoFile) {
                        throw new Error('Photo file not found: ' + photo.originalFilename);
                    }
                    
                    const encryptedPhoto = await photoFile.arrayBuffer();
                    
                    // Decrypt photo content (assuming first 12 bytes are IV)
                    const photoIv = encryptedPhoto.slice(0, 12);
                    const photoData = encryptedPhoto.slice(12);
                    const decryptedPhoto = await decryptData(photoData, fileKey, photoIv);
                    
                    // Create and display the photo
                    const blob = new Blob([decryptedPhoto], { type: photo.mimeType });
                    const url = URL.createObjectURL(blob);
                    
                    const photoElement = document.createElement('div');
                    photoElement.className = 'photo-item';
                    photoElement.innerHTML = 
                        '<img src="' + url + '" alt="' + photo.originalFilename + '">' +
                        '<div class="photo-info">' +
                            '<div><strong>' + photo.originalFilename + '</strong></div>' +
                            '<div>' + new Date(photo.createdAt).toLocaleDateString() + '</div>' +
                        '</div>';
                    
                    // Add download functionality
                    photoElement.addEventListener('click', function() {
                        const a = document.createElement('a');
                        a.href = url;
                        a.download = photo.originalFilename;
                        a.click();
                    });
                    
                    gallery.appendChild(photoElement);
                    
                } catch (error) {
                    console.error('Failed to decrypt photo:', photo.originalFilename, error);
                    const errorElement = document.createElement('div');
                    errorElement.className = 'photo-item';
                    errorElement.innerHTML = 
                        '<div class="photo-info" style="color: #ef4444;">' +
                            '<div>❌ Failed to decrypt</div>' +
                            '<div>' + photo.originalFilename + '</div>' +
                        '</div>';
                    gallery.appendChild(errorElement);
                }
                
                // Small delay to prevent browser freezing
                await new Promise(resolve => setTimeout(resolve, 10));
            }
            
            document.getElementById('progressText').textContent = 'Decryption complete!';
            document.getElementById('decryptBtn').disabled = false;
            document.getElementById('results').innerHTML = 
                '<div class="success">✅ Decryption completed. Click on any photo to download it.</div>';
        }
    </script>
</body>
</html>`
}
