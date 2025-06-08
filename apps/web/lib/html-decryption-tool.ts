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
        * { 
            box-sizing: border-box; 
            margin: 0; 
            padding: 0; 
        }
        
        body { 
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background: #0a0a0a;
            color: #e5e5e5;
            min-height: 100vh;
            padding: 2rem;
            line-height: 1.6;
        }
        
        .container { 
            max-width: 900px; 
            margin: 0 auto;
        }
        
        .header { 
            text-align: center; 
            margin-bottom: 3rem; 
            padding: 2rem 0;
        }
        
        .logo { 
            max-width: 12rem;
            margin-bottom: 0.5rem;
            background: linear-gradient(135deg, #03FFD1, #00acc1);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            background-clip: text;
        }
        
        .subtitle { 
            color: #a3a3a3; 
            font-size: 1.12rem;
            font-weight: 400;
        }
        
        .step { 
            background: #171717;
            border: 1px solid #262626;
            padding: 2rem;
            margin-bottom: 1.5rem;
            transition: all 0.2s ease;
        }
        
        .step:hover {
            border-color: #404040;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
        }
        
        .step-title { 
            color: #03FFD1; 
            font-weight: 600; 
            font-size: 1.125rem;
            margin-bottom: 1rem; 
        }
        
        .step-number {
            display: inline-flex;
            align-items: center;
            justify-content: center;
            width: 1.5rem;
            height: 1.5rem;
            background: #03FFD1;
            color: #000;
            border-radius: 50%;
            font-size: 0.875rem;
            font-weight: 600;
            margin-right: 0.75rem;
        }
        
        input[type="file"] {
            width: 100%;
            padding: 1rem;
            background: #0a0a0a;
            border: 2px dashed #404040;
            color: #e5e5e5;
            font-size: 0.875rem;
            transition: all 0.2s ease;
            cursor: pointer;
        }
        
        input[type="file"]:hover {
            border-color: #03FFD1;
            background: #171717;
        }
        
        input[type="file"]:focus {
            outline: none;
            border-color: #03FFD1;
            box-shadow: 0 0 0 3px rgba(0, 188, 212, 0.1);
        }
        
        button {
            border: 1px solid #03FFD1;
            color: #fff;
            padding: 1rem 2rem;
            background: transparent;
            cursor: pointer;
            font-weight: 600;
            font-size: 1rem;
            transition: all 0.2s ease;
            width: 100%;
        }
        
        button:hover { 
            transform: translateY(-1px); 
            box-shadow: 0 8px 25px rgba(0, 188, 212, 0.3);
        }
        
        button:disabled { 
            opacity: 0.5; 
            cursor: not-allowed; 
            transform: none; 
            box-shadow: none;
        }
        
        .progress { 
            width: 100%; 
            height: 0.5rem; 
            background: #262626;
            border-radius: 0.25rem; 
            overflow: hidden;
            margin: 1rem 0;
        }
        
        .progress-bar { 
            height: 100%; 
            background: linear-gradient(90deg, #03FFD1, #00acc1);
            width: 0%; 
            transition: width 0.3s ease;
        }
        
        .gallery { 
            display: grid; 
            grid-template-columns: repeat(auto-fill, minmax(250px, 1fr)); 
            gap: 1.5rem;
            margin-top: 2rem;
        }
        
        .photo-item {
            background: #171717;
            border: 1px solid #262626;
            overflow: hidden;
            transition: all 0.2s ease;
            cursor: pointer;
        }
        
        .photo-item:hover { 
            transform: translateY(-2px);
            border-color: #03FFD1;
            box-shadow: 0 8px 25px rgba(0, 0, 0, 0.3);
        }
        
        .photo-item img { 
            width: 100%; 
            height: 200px; 
            object-fit: cover; 
        }
        
        .photo-info { 
            padding: 1rem; 
            font-size: 0.875rem; 
            color: #a3a3a3; 
        }
        
        .photo-info strong {
            color: #e5e5e5;
            display: block;
            margin-bottom: 0.25rem;
        }
        
        .status-message { 
            padding: 1rem; 
            margin: 1rem 0;
            font-size: 0.875rem;
            font-weight: 500;
        }
        
        .error { 
            color: #ef4444; 
            background: rgba(239, 68, 68, 0.1); 
            border: 1px solid rgba(239, 68, 68, 0.2);
        }
        
        .success { 
            color: #22c55e; 
            background: rgba(34, 197, 94, 0.1); 
            border: 1px solid rgba(34, 197, 94, 0.2);
        }
        
        .warning {
            background: rgba(245, 158, 11, 0.1);
            border: 1px solid rgba(245, 158, 11, 0.2);
            color: #f59e0b;
            padding: 1.5rem;
            margin-bottom: 2rem;
            font-size: 0.875rem;
        }
        
        .security-badge {
            margin-top: 0.5rem;
            display: inline-flex;
            align-items: center;
            gap: 0.5rem;
            background: rgba(0, 188, 212, 0.1);
            border: 1px solid rgba(0, 188, 212, 0.2);
            color: #03FFD1;
            padding: 0.5rem 1rem;
            font-size: 0.8rem;
            font-weight: 500;
            margin-bottom: 1rem;
        }
        
        .progress-text {
            text-align: center;
            color: #a3a3a3;
            font-size: 0.875rem;
            margin-top: 0.5rem;
        }
        
        @media (max-width: 640px) {
            body { padding: 1rem; }
            .header { margin-bottom: 2rem; }
            .logo { font-size: 2rem; }
            .step { padding: 1.5rem; }
            .gallery { grid-template-columns: 1fr; }
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <img class="logo" src="https://halycron.space/logo.png">
            <div class="subtitle">Photo Decryption Tool</div>
            <div class="security-badge">
                🛡️ Zero-knowledge decryption
            </div>
        </div>

        <div class="warning">
            <strong>🔐 Security Notice:</strong> This tool works entirely in your browser. Your encryption keys and photos never leave your device. All decryption happens locally for maximum privacy.
        </div>

        <div class="step">
            <div class="step-title">
                <span class="step-number">1</span>
                Load Export Manifest
            </div>
            <input type="file" id="manifestFile" accept=".json" placeholder="Select manifest.json file">
            <div id="manifestStatus"></div>
        </div>

        <div class="step">
            <div class="step-title">
                <span class="step-number">2</span>
                Load Photos Folder
            </div>
            <input type="file" id="photosFolder" webkitdirectory multiple placeholder="Select the photos folder">
            <div id="photosStatus"></div>
        </div>

        <div class="step">
            <div class="step-title">
                <span class="step-number">3</span>
                Start Decryption
            </div>
            <button onclick="startDecryption()" id="decryptBtn">🚀 Decrypt All Photos</button>
        </div>

        <div class="step" id="progressStep" style="display: none;">
            <div class="step-title">
                ⚡ Processing Your Photos
            </div>
            <div class="progress">
                <div class="progress-bar" id="progressBar"></div>
            </div>
            <div id="progressText" class="progress-text">Preparing...</div>
        </div>

        <div id="results"></div>
        
        <div id="downloadSection" style="display: none;" class="step">
            <div class="step-title">
                📦 Download Options
            </div>
            <div style="display: flex; gap: 1rem; flex-wrap: wrap;">
                <button onclick="downloadAllPhotos()" id="downloadAllBtn" style="flex: 1; min-width: 200px;">
                    💾 Download All Photos
                </button>
                <button onclick="toggleGallery()" id="toggleGalleryBtn" style="flex: 1; min-width: 200px;">
                    🖼️ Browse Individual Photos
                </button>
            </div>
        </div>
        
        <div id="gallery" class="gallery" style="display: none;"></div>
    </div>

    <script>
        let manifest = null;
        let photos = [];
        let photoFiles = new Map();
        let decryptedPhotoBlobs = new Map();
        
        document.getElementById('manifestFile').addEventListener('change', function(e) {
            const file = e.target.files[0];
            if (!file) return;
            
            const reader = new FileReader();
            reader.onload = function(e) {
                try {
                    manifest = JSON.parse(e.target.result);
                    document.getElementById('manifestStatus').innerHTML = 
                        '<div class="status-message success">✅ Manifest loaded successfully: ' + manifest.photos.length + ' photos found</div>';
                    photos = manifest.photos;
                } catch (error) {
                    document.getElementById('manifestStatus').innerHTML = 
                        '<div class="status-message error">❌ Invalid manifest file. Please select the correct manifest.json file.</div>';
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
                '<div class="status-message success">✅ Photos folder loaded successfully: ' + files.length + ' files found</div>';
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

        function hexToArrayBuffer(hex) {
            const bytes = new Uint8Array(hex.match(/.{2}/g).map(byte => parseInt(byte, 16)));
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
                    // Use the file key directly (it's not actually encrypted in current implementation)
                    const fileKeyBytes = base64ToArrayBuffer(photo.encryptedFileKey);
                    const fileKey = await crypto.subtle.importKey(
                        'raw',
                        fileKeyBytes,
                        { name: 'AES-CBC' },  // Changed to AES-CBC to match utils.ts
                        false,
                        ['decrypt']
                    );
                    
                    // Get the photo file from the loaded folder
                    const photoFile = photoFiles.get(photo.originalFilename);
                    if (!photoFile) {
                        throw new Error('Photo file not found: ' + photo.originalFilename);
                    }
                    
                    const encryptedPhoto = await photoFile.arrayBuffer();
                    
                    // Decrypt photo content using AES-CBC with IV from fileKeyIv (hex format)
                    const fileKeyIv = hexToArrayBuffer(photo.fileKeyIv);
                    const decryptedPhoto = await crypto.subtle.decrypt(
                        { name: 'AES-CBC', iv: fileKeyIv },
                        fileKey,
                        encryptedPhoto
                    );
                    
                    // Create and display the photo
                    const blob = new Blob([decryptedPhoto], { type: photo.mimeType });
                    const url = URL.createObjectURL(blob);
                    
                    // Store decrypted blob for bulk download
                    decryptedPhotoBlobs.set(photo.originalFilename, blob);
                    
                    const photoElement = document.createElement('div');
                    photoElement.className = 'photo-item';
                    photoElement.innerHTML = 
                        '<img src="' + url + '" alt="' + photo.originalFilename + '">' +
                        '<div class="photo-info">' +
                            '<strong>' + photo.originalFilename + '</strong>' +
                            '<div>📅 ' + new Date(photo.createdAt).toLocaleDateString() + '</div>' +
                            '<div>📏 ' + (photo.imageWidth || 'Unknown') + ' × ' + (photo.imageHeight || 'Unknown') + '</div>' +
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
                        '<div class="photo-info" style="color: #ef4444; text-align: center; padding: 2rem;">' +
                            '<div style="font-size: 2rem; margin-bottom: 0.5rem;">❌</div>' +
                            '<strong>Decryption Failed</strong>' +
                            '<div style="margin-top: 0.5rem; opacity: 0.8;">' + photo.originalFilename + '</div>' +
                        '</div>';
                    gallery.appendChild(errorElement);
                }
                
                // Small delay to prevent browser freezing
                await new Promise(resolve => setTimeout(resolve, 10));
            }
            
            document.getElementById('progressText').textContent = 'Decryption complete!';
            document.getElementById('decryptBtn').disabled = false;
            document.getElementById('results').innerHTML = 
                '<div class="status-message success">🎉 Decryption completed successfully! Choose how you want to download your photos below.</div>';
            
            // Show download options
            document.getElementById('downloadSection').style.display = 'block';
        }

        async function downloadAllPhotos() {
            if (decryptedPhotoBlobs.size === 0) {
                alert('No decrypted photos available for download');
                return;
            }

            const downloadBtn = document.getElementById('downloadAllBtn');
            const originalText = downloadBtn.textContent;
            downloadBtn.disabled = true;
            downloadBtn.textContent = '⏳ Preparing downloads...';

            try {
                // Create ZIP file using modern compression API
                const { readable, writable } = new CompressionStream('gzip');
                
                // Fallback to simple concatenation for browsers without compression API
                await createAndDownloadZip();
                
            } catch (error) {
                console.log('Compression API not available, using fallback method');
                await createAndDownloadZip();
            } finally {
                downloadBtn.disabled = false;
                downloadBtn.textContent = originalText;
            }
        }

        async function createAndDownloadZip() {
            const fileCount = decryptedPhotoBlobs.size;
            let processedCount = 0;

            // Since we can't include external libraries, we'll offer sequential downloads
            // with a small delay between each to avoid overwhelming the browser
            const downloadBtn = document.getElementById('downloadAllBtn');
            
            let delay = 0;
            for (const [filename, blob] of decryptedPhotoBlobs) {
                setTimeout(() => {
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = filename;
                    a.style.display = 'none';
                    document.body.appendChild(a);
                    a.click();
                    document.body.removeChild(a);
                    
                    // Clean up the URL after a short delay
                    setTimeout(() => URL.revokeObjectURL(url), 1000);
                }, delay);
                
                delay += 500; // 500ms delay between downloads
                processedCount++;
                downloadBtn.textContent = \`⏳ Queuing \${processedCount}/\${fileCount} downloads...\`;
            }
            
            // Update button text after all downloads are queued
            setTimeout(() => {
                downloadBtn.textContent = '✅ All downloads queued!';
                setTimeout(() => {
                    downloadBtn.textContent = '💾 Download All Photos';
                    downloadBtn.disabled = false;
                }, 3000);
            }, delay);
        }

        function toggleGallery() {
            const gallery = document.getElementById('gallery');
            const toggleBtn = document.getElementById('toggleGalleryBtn');
            
            if (gallery.style.display === 'none') {
                gallery.style.display = 'grid';
                toggleBtn.textContent = '🙈 Hide Gallery';
            } else {
                gallery.style.display = 'none';
                toggleBtn.textContent = '🖼️ Browse Individual Photos';
            }
        }
    </script>
</body>
</html>`
}
 