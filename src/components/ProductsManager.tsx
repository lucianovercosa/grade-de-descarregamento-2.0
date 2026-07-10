import React, { useState } from 'react';
import * as xlsx from 'xlsx';
import { collection, doc, writeBatch } from 'firebase/firestore';
import { db } from '../firebase';

export function ProductsManager() {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setLoading(true);
    setMessage('');
    setError('');

    const reader = new FileReader();
    reader.onload = async (evt) => {
      try {
        const bstr = evt.target?.result;
        const wb = xlsx.read(bstr, { type: 'binary' });
        const wsname = wb.SheetNames[0];
        const ws = wb.Sheets[wsname];
        const data = xlsx.utils.sheet_to_json(ws, { header: 1 }) as any[][];

        if (data.length < 2) {
          throw new Error('A planilha parece estar vazia ou sem cabeçalhos.');
        }

        // Assuming row 0 is header, and data starts from row 1.
        // We look for columns that contain 'codigo' or 'desc'
        const headers = data[0].map(h => h ? String(h).toLowerCase().trim() : '');
        let codeIdx = headers.findIndex(h => h.includes('cod') || h.includes('cód'));
        let descIdx = headers.findIndex(h => h.includes('desc'));

        if (codeIdx === -1 || descIdx === -1) {
          // If we can't find by header name, assume 0 is code and 1 is description
          codeIdx = 0;
          descIdx = 1;
        }

        const batch = writeBatch(db);
        let count = 0;

        for (let i = 1; i < data.length; i++) {
          const row = data[i];
          if (!row || row.length === 0) continue;
          const code = row[codeIdx] ? String(row[codeIdx]).trim() : '';
          const desc = row[descIdx] ? String(row[descIdx]).trim() : '';

          if (code && desc) {
            const productRef = doc(db, 'products', code);
            batch.set(productRef, {
              code,
              description: desc,
              updated_at: new Date().toISOString()
            }, { merge: true });
            count++;
          }
        }

        if (count > 0) {
          await batch.commit();
          setMessage(`${count} produtos importados/atualizados com sucesso.`);
        } else {
          setError('Nenhum produto encontrado para importar.');
        }
      } catch (err: any) {
        console.error(err);
        setError(err.message || 'Erro ao processar o arquivo.');
      } finally {
        setLoading(false);
        // Clear the input
        if (e.target) {
          e.target.value = '';
        }
      }
    };
    reader.readAsBinaryString(file);
  };

  return (
    <div className="bg-[#15151A] rounded-xl border border-white/10 p-6 max-w-2xl shadow-sm text-white font-sans">
      <h2 className="text-sm font-bold text-white/80 mb-6 uppercase tracking-widest">Base de Produtos</h2>
      
      <div className="flex flex-col gap-4 mb-6">
        <p className="text-sm text-white/60">
          Faça upload de uma planilha Excel (XLSX) para atualizar a base de produtos. 
          O sistema tentará identificar automaticamente as colunas de <strong>Código</strong> e <strong>Descrição</strong>.
          <br /><br />
          Caso não encontre pelos nomes "Código" e "Descrição", utilizará a 1ª e a 2ª coluna da planilha.
        </p>
        
        <label className="flex flex-col gap-2">
          <span className="text-[10px] uppercase tracking-widest text-white/40 font-bold">Importar Excel (XLSX, XLS, CSV)</span>
          <div className="flex items-center gap-2">
            <input 
              type="file" 
              accept=".xlsx, .xls, .csv" 
              onChange={handleFileUpload}
              disabled={loading}
              className="bg-black/40 border border-white/10 rounded px-3 py-2 text-sm focus:outline-none w-full file:mr-4 file:py-1 file:px-2 file:rounded file:border file:border-white/10 file:text-[10px] file:uppercase file:tracking-widest file:font-bold file:bg-white/5 file:text-white hover:file:bg-white/10 text-white/60 cursor-pointer disabled:opacity-50" 
            />
          </div>
        </label>
        
        {loading && <div className="text-sm text-blue-400 mt-2">Processando e importando...</div>}
        {message && <div className="text-sm text-green-400 mt-2">{message}</div>}
        {error && <div className="text-sm text-red-400 mt-2">{error}</div>}
      </div>
    </div>
  );
}
