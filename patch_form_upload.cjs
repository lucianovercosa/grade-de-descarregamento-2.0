const fs = require('fs');
let content = fs.readFileSync('src/components/VehicleForm.tsx', 'utf8');

const targetFunc = `  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.length) return;
    
    setUploading(true);
    const files = Array.from(e.target.files);
    const newAttachments = [...(formData.attachments || [])];

    try {
      for (const file of files) {
        const storageRef = ref(storage, \`attachments/\${Date.now()}_\${file.name}\`);
        await uploadBytes(storageRef, file);
        const url = await getDownloadURL(storageRef);
        newAttachments.push({ name: file.name, url, type: file.type });
      }
      setFormData({ ...formData, attachments: newAttachments });
    } catch (error) {
      console.error("Error uploading file:", error);
      alert("Erro ao fazer upload do arquivo");
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  };`;

const replacementFunc = `  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.length) return;
    
    setUploading(true);
    const files = Array.from(e.target.files);
    const newAttachments = [...(formData.attachments || [])];

    try {
      for (const file of files) {
        let finalFile = file;
        if (file.type.startsWith('image/')) {
          const imageCompression = (await import('browser-image-compression')).default;
          const options = {
            maxSizeMB: 0.5,
            maxWidthOrHeight: 1200,
            useWebWorker: true
          };
          finalFile = await imageCompression(file, options);
        }
        
        const reader = new FileReader();
        const base64Url = await new Promise<string>((resolve, reject) => {
          reader.onload = () => resolve(reader.result as string);
          reader.onerror = reject;
          reader.readAsDataURL(finalFile);
        });
        
        newAttachments.push({ name: file.name, url: base64Url, type: file.type });
      }
      setFormData({ ...formData, attachments: newAttachments });
    } catch (error) {
      console.error("Error processing file:", error);
      alert("Erro ao processar o arquivo. Tente um arquivo menor.");
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  };

  const openAttachment = (e: React.MouseEvent, att: {url: string, type: string}) => {
    e.preventDefault();
    if (att.url.startsWith('data:')) {
      try {
        const byteString = atob(att.url.split(',')[1]);
        const ab = new ArrayBuffer(byteString.length);
        const ia = new Uint8Array(ab);
        for (let i = 0; i < byteString.length; i++) {
          ia[i] = byteString.charCodeAt(i);
        }
        const blob = new Blob([ab], { type: att.type });
        const url = URL.createObjectURL(blob);
        window.open(url, '_blank');
      } catch (err) {
        console.error(err);
        window.open(att.url, '_blank');
      }
    } else {
      window.open(att.url, '_blank');
    }
  };`;

if (content.includes('await uploadBytes(storageRef, file);')) {
  content = content.replace(targetFunc, replacementFunc);
}

const targetLink = `<a href={att.url} target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:text-blue-300 text-sm truncate max-w-[80%] hover:underline">
                        {att.name}
                      </a>`;
const replacementLink = `<a href="#" onClick={(e) => openAttachment(e, att)} className="text-blue-400 hover:text-blue-300 text-sm truncate max-w-[80%] hover:underline">
                        {att.name}
                      </a>`;

if (content.includes(targetLink)) {
  content = content.replace(targetLink, replacementLink);
  fs.writeFileSync('src/components/VehicleForm.tsx', content);
  console.log('Success Form Upload');
} else {
  console.log('Target not found Form Upload Link');
}
