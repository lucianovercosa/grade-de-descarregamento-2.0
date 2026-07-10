const fs = require('fs');
let content = fs.readFileSync('src/components/VehicleForm.tsx', 'utf8');

if (!content.includes('import { ref, uploadBytes, getDownloadURL }')) {
  content = content.replace(
    "import { db } from '../firebase';",
    "import { db, storage } from '../firebase';\nimport { ref, uploadBytes, getDownloadURL } from 'firebase/storage';"
  );
}

if (!content.includes('const [uploading, setUploading] = useState(false);')) {
  content = content.replace(
    'const [loading, setLoading] = useState(false);',
    'const [loading, setLoading] = useState(false);\n  const [uploading, setUploading] = useState(false);\n\n  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {\n    if (!e.target.files?.length) return;\n    \n    setUploading(true);\n    const files = Array.from(e.target.files);\n    const newAttachments = [...(formData.attachments || [])];\n\n    try {\n      for (const file of files) {\n        const storageRef = ref(storage, `attachments/${Date.now()}_${file.name}`);\n        await uploadBytes(storageRef, file);\n        const url = await getDownloadURL(storageRef);\n        newAttachments.push({ name: file.name, url, type: file.type });\n      }\n      setFormData({ ...formData, attachments: newAttachments });\n    } catch (error) {\n      console.error("Error uploading file:", error);\n      alert("Erro ao fazer upload do arquivo");\n    } finally {\n      setUploading(false);\n      e.target.value = "";\n    }\n  };\n\n  const removeAttachment = (index: number) => {\n    const newAttachments = [...(formData.attachments || [])];\n    newAttachments.splice(index, 1);\n    setFormData({ ...formData, attachments: newAttachments });\n  };'
  );
}

const targetInputs = `          <label className="flex flex-col gap-1 text-[10px] uppercase tracking-widest text-white/40 font-bold">
            Anexar fotos ou arquivos
            <div className="flex items-center gap-2">
              <input type="file" multiple className="bg-black/40 border border-white/10 rounded px-3 py-2 text-sm focus:outline-none w-full file:mr-4 file:py-1 file:px-2 file:rounded file:border file:border-white/10 file:text-[10px] file:uppercase file:tracking-widest file:font-bold file:bg-white/5 file:text-white hover:file:bg-white/10 text-white/60" />
            </div>
          </label>

          <label className="flex flex-col gap-1 text-[10px] uppercase tracking-widest text-white/40 font-bold">
            Tirar foto pelo celular
            <div className="flex items-center gap-2">
              <input type="file" accept="image/*" capture="environment" className="bg-black/40 border border-white/10 rounded px-3 py-2 text-sm focus:outline-none w-full file:mr-4 file:py-1 file:px-2 file:rounded file:border file:border-white/10 file:text-[10px] file:uppercase file:tracking-widest file:font-bold file:bg-white/5 file:text-white hover:file:bg-white/10 text-white/60" />
            </div>
          </label>`;

const newInputs = `          <div className="md:col-span-2 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <label className="flex flex-col gap-1 text-[10px] uppercase tracking-widest text-white/40 font-bold">
                Anexar fotos ou arquivos
                <div className="flex items-center gap-2">
                  <input type="file" multiple onChange={handleFileUpload} disabled={uploading} className="bg-black/40 border border-white/10 rounded px-3 py-2 text-sm focus:outline-none w-full file:mr-4 file:py-1 file:px-2 file:rounded file:border file:border-white/10 file:text-[10px] file:uppercase file:tracking-widest file:font-bold file:bg-white/5 file:text-white hover:file:bg-white/10 text-white/60 disabled:opacity-50" />
                </div>
              </label>

              <label className="flex flex-col gap-1 text-[10px] uppercase tracking-widest text-white/40 font-bold">
                Tirar foto pelo celular
                <div className="flex items-center gap-2">
                  <input type="file" accept="image/*" capture="environment" onChange={handleFileUpload} disabled={uploading} className="bg-black/40 border border-white/10 rounded px-3 py-2 text-sm focus:outline-none w-full file:mr-4 file:py-1 file:px-2 file:rounded file:border file:border-white/10 file:text-[10px] file:uppercase file:tracking-widest file:font-bold file:bg-white/5 file:text-white hover:file:bg-white/10 text-white/60 disabled:opacity-50" />
                </div>
              </label>
            </div>
            
            {uploading && <div className="text-blue-400 text-xs font-bold animate-pulse">Enviando arquivo(s)...</div>}

            {formData.attachments && formData.attachments.length > 0 && (
              <div className="mt-2 space-y-2">
                <div className="text-[10px] uppercase tracking-widest text-white/40 font-bold">Arquivos Anexados ({formData.attachments.length})</div>
                <div className="flex flex-col gap-2">
                  {formData.attachments.map((att, idx) => (
                    <div key={idx} className="flex items-center justify-between bg-black/40 border border-white/10 rounded p-2">
                      <a href={att.url} target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:text-blue-300 text-sm truncate max-w-[80%] hover:underline">
                        {att.name}
                      </a>
                      <button type="button" onClick={() => removeAttachment(idx)} className="text-red-400 hover:text-red-300 text-xs font-bold uppercase tracking-widest px-2 py-1 bg-red-500/10 rounded">
                        Remover
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>`;

if (content.includes('Anexar fotos ou arquivos')) {
  content = content.replace(targetInputs, newInputs);
  fs.writeFileSync('src/components/VehicleForm.tsx', content);
  console.log('Success Form');
} else {
  console.log('Target not found Form');
}
